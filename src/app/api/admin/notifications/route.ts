/**
 * API Route — Notifications Admin
 * GET /api/admin/notifications?page=1&limit=20
 *
 * Retourne la liste paginée des notifications admin avec :
 * - statut lu/non-lu pour l'admin courant (via admin_notification_reads)
 * - nombre total de non-lus (pour le badge)
 * - métadonnées de pagination
 *
 * Sécurité :
 * - Authentification requise (session cookie)
 * - Rôle admin ou super-admin uniquement
 * - is_read calculé côté service via RLS (user_id = auth.uid())
 */

import { createClient } from '@/lib/supabase/server';
import {
  getAdminNotifications,
  type GetNotificationsResult,
} from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { requireAuth, successResponse, serverErrorResponse } from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface ApiSuccess {
  success: true;
  data: GetNotificationsResult;
}

interface ApiError {
  success: false;
  error: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ApiResponse = ApiSuccess | ApiError;

// ============================================
// GET — Liste paginée des notifications
// ============================================

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, undefined, '[notifications API]');
    if (!auth.ok) return auth.response;

    // Extraire et valider les paramètres de pagination
    const { searchParams } = new URL(request.url);
    const rawPage  = parseInt(searchParams.get('page')  ?? '1',  10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);

    const page  = isNaN(rawPage)  || rawPage  < 1  ? 1  : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1  ? 20
                : rawLimit > 100                    ? 100
                : rawLimit;

    const result = await getAdminNotifications(page, limit);

    return successResponse(result);
  } catch (err) {
    logger.error('[notifications API] Exception GET', { err });
    return serverErrorResponse();
  }
}
