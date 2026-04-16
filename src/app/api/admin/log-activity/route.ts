/**
 * API Route — Log Activity (proxy pour le logging client-side)
 * POST /api/admin/log-activity
 * Derviche Diffusion — S190
 *
 * Permet aux fonctions exécutées côté navigateur (PWA check-in, bookings publics)
 * d'insérer des logs dans app_logs via le service_role.
 *
 * Sécurité (2 niveaux) :
 *
 * 1. Catégorie 'reservation' — ACCESSIBLE AUX GUESTS (anonymes)
 *    - Action whitelist : uniquement 'reservation_create'
 *    - actor_id / actor_role forcés (ignorés du body) pour éviter l'usurpation
 *    - details limité à 2 KB
 *    - reservation_id validé UUID
 *
 * 2. Autres catégories (email, calendar, system, show) — AUTH REQUISE
 *    - Rôles : super-admin, admin, externe, company (STAFF_ROLES)
 *    - Pas de restriction sur action / actor / details (usage interne)
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

/** Actions autorisées pour les clients anonymes (catégorie 'reservation') */
const ANONYMOUS_ALLOWED_ACTIONS = ['reservation_create'] as const;

/** Taille max du champ details pour les clients anonymes (en caractères JSON) */
const ANONYMOUS_DETAILS_MAX_SIZE = 2048;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// POST
// ============================================

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Récupération user (optionnel pour la catégorie 'reservation')
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

    // 3. Préparation des valeurs à insérer selon le niveau d'auth
    const requiresAuth = category !== 'reservation';
    let actorId: string | null = null;
    let actorRole: string | null = null;
    let reservationId: string | null = null;
    let details: Record<string, unknown> = {};

    if (requiresAuth) {
      // Catégories internes : auth staff requise, tous les champs acceptés
      const auth = await requireAuth(supabase, STAFF_ROLES);
      if (!auth.ok) return auth.response;
      actorId = (body.actor_id as string) ?? auth.userId;
      actorRole = (body.actor_role as string) ?? auth.role;
      reservationId = (body.reservation_id as string) ?? null;
      details = (body.details as Record<string, unknown>) ?? {};
    } else {
      // Catégorie 'reservation' : anonyme autorisé, restrictions strictes

      // 3a. Action whitelist
      if (!(ANONYMOUS_ALLOWED_ACTIONS as readonly string[]).includes(action)) {
        return errorResponse(`Action non autorisée pour cette catégorie: ${action}`, 400);
      }

      // 3b. actor_id / actor_role : valeur serveur uniquement (pas le body)
      actorId = user?.id ?? null;
      actorRole = null; // jamais renseigné pour les anonymes

      // 3c. reservation_id : validation UUID stricte
      const rawReservationId = body.reservation_id;
      if (typeof rawReservationId === 'string' && UUID_REGEX.test(rawReservationId)) {
        reservationId = rawReservationId;
      }

      // 3d. details : limite de taille
      const rawDetails = body.details;
      if (rawDetails && typeof rawDetails === 'object') {
        const serialized = JSON.stringify(rawDetails);
        if (serialized.length > ANONYMOUS_DETAILS_MAX_SIZE) {
          return errorResponse(
            `details trop volumineux (max ${ANONYMOUS_DETAILS_MAX_SIZE} caractères)`,
            400
          );
        }
        details = rawDetails as Record<string, unknown>;
      }
    }

    // 4. Insertion via admin client (service_role)
    const adminClient = createAdminClient();
    const { error: insertError } = await adminClient.from('app_logs').insert({
      category,
      level: success ? 'info' : 'error',
      action,
      status: success ? 'success' : 'error',
      actor_id: actorId,
      actor_role: actorRole,
      reservation_id: reservationId,
      details,
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
