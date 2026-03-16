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

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';

// ============================================
// CONSTANTES DE VALIDATION
// ============================================

const VALID_CATEGORIES = ['email', 'calendar', 'reservation', 'system', 'show'] as const;
const ALLOWED_ROLES = ['super-admin', 'admin', 'externe', 'company'];

// ============================================
// POST
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Vérification auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Vérification rôle
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !ALLOWED_ROLES.includes(roleData.role)) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 3. Parsing du body
    const body = await request.json() as Record<string, unknown>;

    const category = body.category as string;
    const action = body.action as string;
    const success = body.success as boolean;

    // Validation basique
    if (!category || !action || typeof success !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants: category, action, success' },
        { status: 400 },
      );
    }

    if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json(
        { success: false, error: `Catégorie invalide: ${category}` },
        { status: 400 },
      );
    }

    // 4. Insertion via admin client (service_role)
    const adminClient = createAdminClient();
    const { error: insertError } = await adminClient.from('app_logs').insert({
      category,
      level: success ? 'info' : 'error',
      action,
      status: success ? 'success' : 'error',
      actor_id: (body.actor_id as string) ?? user.id,
      actor_role: (body.actor_role as string) ?? roleData.role,
      reservation_id: (body.reservation_id as string) ?? null,
      details: (body.details as Record<string, unknown>) ?? {},
    });

    if (insertError) {
      logger.warn('[log-activity API] Erreur insertion', { error: insertError.message });
      // On retourne quand même 200 — le log n'est pas critique
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.warn('[log-activity API] Exception', {
      error: err instanceof Error ? err.message : String(err),
    });
    // Retourner 200 même en cas d'erreur — le logging ne doit jamais bloquer
    return NextResponse.json({ success: true });
  }
}
