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

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAdminNotifications,
  type GetNotificationsResult,
} from '@/lib/services/notifications';
import { logger } from '@/lib/logger';

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

type ApiResponse = ApiSuccess | ApiError;

// ============================================
// HELPERS
// ============================================

async function getCurrentUserRole(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return { user, role: roleData?.role ?? null };
}

// ============================================
// GET — Liste paginée des notifications
// ============================================

export async function GET(request: Request): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient();
    const { user, role } = await getCurrentUserRole(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    if (role !== 'super-admin' && role !== 'admin') {
      logger.warn('[notifications API] Accès refusé GET', { userId: user.id, role });
      return NextResponse.json({ success: false, error: 'Droits insuffisants' }, { status: 403 });
    }

    // Extraire et valider les paramètres de pagination
    const { searchParams } = new URL(request.url);
    const rawPage  = parseInt(searchParams.get('page')  ?? '1',  10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);

    const page  = isNaN(rawPage)  || rawPage  < 1  ? 1  : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1  ? 20
                : rawLimit > 100                    ? 100
                : rawLimit;

    const result = await getAdminNotifications(page, limit);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    logger.error('[notifications API] Exception GET', { err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
