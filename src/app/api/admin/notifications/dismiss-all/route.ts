/**
 * POST /api/admin/notifications/dismiss-all
 * Derviche Diffusion
 *
 * Masque toutes les notifications pour l'admin courant (soft delete individuel).
 * Les autres admins continuent de voir leurs notifications.
 */

import { createClient } from '@/lib/supabase/server';
import { dismissAllNotifications } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/api';

// ============================================
// POST — Masquer toutes les notifications
// ============================================

export async function POST(): Promise<Response> {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if (!auth.ok) return auth.response;

    await dismissAllNotifications(auth.userId);

    return successResponse();
  } catch (err) {
    logger.error('[notifications/dismiss-all] Erreur inattendue', { err });
    return serverErrorResponse();
  }
}
