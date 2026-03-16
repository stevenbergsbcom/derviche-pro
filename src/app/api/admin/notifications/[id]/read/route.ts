/**
 * API Route — Marquer une notification lue
 * POST /api/admin/notifications/[id]/read
 *
 * Marque une notification spécifique comme lue pour l'admin courant.
 * Idempotent : appeler plusieurs fois ne provoque pas d'erreur (upsert).
 *
 * Sécurité :
 * - Authentification requise (session cookie)
 * - Rôle admin ou super-admin uniquement
 * - Chaque admin ne marque que ses propres lignes (RLS : user_id = auth.uid())
 */

import { createClient } from '@/lib/supabase/server';
import { markNotificationAsRead } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { requireAuth, errorResponse, successResponse, serverErrorResponse } from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================
// POST — Marquer une notification lue
// ============================================

export async function POST(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { id } = await context.params;

    // Valider que l'id est un UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return errorResponse('ID de notification invalide', 400);
    }

    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, '[notifications/read API]');
    if (!auth.ok) return auth.response;

    await markNotificationAsRead(id, auth.userId);

    return successResponse();
  } catch (err) {
    logger.error('[notifications/read API] Exception POST', { err });
    return serverErrorResponse();
  }
}
