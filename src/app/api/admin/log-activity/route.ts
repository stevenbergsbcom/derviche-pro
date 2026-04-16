/**
 * API Route — Log Activity (proxy pour le logging client-side)
 * POST /api/admin/log-activity
 * Derviche Diffusion — S190
 *
 * Permet aux fonctions exécutées côté navigateur (PWA check-in)
 * d'insérer des logs dans app_logs via le service_role.
 *
 * Sécurité :
 *   - Authentification requise
 *   - Rôle admin, super-admin, externe ou company
 *   - Catégorie et action validées
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';
import {
  requireAuth,
  STAFF_ROLES,
  errorResponse,
  successResponse,
  getErrorMessage,
} from '@/lib/api';

// ============================================
// CONSTANTES DE VALIDATION
// ============================================

const VALID_CATEGORIES = ['email', 'calendar', 'reservation', 'system', 'show'] as const;

// ============================================
// POST
// ============================================

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Vérification auth + rôle (optionnel pour la catégorie 'reservation')
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Parsing du body
    const body = await request.json() as Record<string, unknown>;

    const category = body.category as string;
    const action = body.action as string;
    const success = body.success as boolean;

    // Validation basique
    if (!category || !action || typeof success !== 'boolean') {
      return errorResponse('Paramètres manquants: category, action, success', 400);
    }

    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      return errorResponse(`Catégorie invalide: ${category}`, 400);
    }

    // Pour les catégories admin (email, calendar, system, show), auth staff requise
    const requiresAuth = category !== 'reservation';
    let authUserId: string | null = null;
    let authRole: string | null = null;

    if (requiresAuth) {
      const auth = await requireAuth(supabase, STAFF_ROLES);
      if (!auth.ok) return auth.response;
      authUserId = auth.userId;
      authRole = auth.role;
    } else if (user) {
      // Guest reservations : user peut être null, c'est OK
      authUserId = user.id;
    }

    // 3. Insertion via admin client (service_role)
    const adminClient = createAdminClient();
    const { error: insertError } = await adminClient.from('app_logs').insert({
      category,
      level: success ? 'info' : 'error',
      action,
      status: success ? 'success' : 'error',
      actor_id: (body.actor_id as string) ?? authUserId,
      actor_role: (body.actor_role as string) ?? authRole,
      reservation_id: (body.reservation_id as string) ?? null,
      details: (body.details as Record<string, unknown>) ?? {},
    });

    if (insertError) {
      logger.warn('[log-activity API] Erreur insertion', { error: insertError.message });
      // On retourne quand même 200 — le log n'est pas critique
    }

    return successResponse();
  } catch (err) {
    logger.warn('[log-activity API] Exception', {
      error: getErrorMessage(err),
    });
    // Retourner 200 même en cas d'erreur — le logging ne doit jamais bloquer
    return successResponse();
  }
}
