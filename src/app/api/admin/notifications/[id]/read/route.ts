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

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markNotificationAsRead } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
// POST — Marquer une notification lue
// ============================================

export async function POST(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await context.params;

    // Valider que l'id est un UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de notification invalide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { user, role } = await getCurrentUserRole(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    if (role !== 'super-admin' && role !== 'admin') {
      logger.warn('[notifications/read API] Accès refusé', { userId: user.id, role });
      return NextResponse.json({ success: false, error: 'Droits insuffisants' }, { status: 403 });
    }

    await markNotificationAsRead(id, user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[notifications/read API] Exception POST', { err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
