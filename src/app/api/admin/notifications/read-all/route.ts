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

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markAllNotificationsAsRead } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface ApiSuccess {
  success: true;
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
// POST — Marquer toutes les notifications lues
// ============================================

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient();
    const { user, role } = await getCurrentUserRole(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    if (role !== 'super-admin' && role !== 'admin') {
      logger.warn('[notifications/read-all API] Accès refusé', { userId: user.id, role });
      return NextResponse.json({ success: false, error: 'Droits insuffisants' }, { status: 403 });
    }

    await markAllNotificationsAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[notifications/read-all API] Exception POST', { err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
