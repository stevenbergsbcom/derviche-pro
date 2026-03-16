/**
 * API Route — Tout marquer comme lu
 * POST /api/admin/notifications/read-all
 *
 * Marque toutes les notifications comme lues pour l'admin courant.
 * Idempotent : appeler plusieurs fois ne provoque pas d'erreur.
 *
 * Sécurité :
 * - Authentification requise (session cookie)
 * - Rôle admin ou super-admin uniquement
 * - Chaque admin ne marque que ses propres lignes (RLS : user_id = auth.uid())
 */

import { createClient } from '@/lib/supabase/server';
import { markAllNotificationsAsRead } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/api';

// ============================================
// POST — Marquer toutes les notifications lues
// ============================================

export async function POST(): Promise<Response> {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, '[notifications/read-all API]');
    if (!auth.ok) return auth.response;

    await markAllNotificationsAsRead(auth.userId);

    return successResponse();
  } catch (err) {
    logger.error('[notifications/read-all API] Exception POST', { err });
    return serverErrorResponse();
  }
}
