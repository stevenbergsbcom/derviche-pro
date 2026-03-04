/**
 * POST /api/admin/notifications/dismiss-all
 * Derviche Diffusion
 *
 * Masque toutes les notifications pour l'admin courant (soft delete individuel).
 * Les autres admins continuent de voir leurs notifications.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dismissAllNotifications } from '@/lib/services/notifications';
import type { InternalRole } from '@/types/database';

// ============================================
// TYPES
// ============================================

interface ApiResponse {
  success: boolean;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

async function getCurrentUserRole(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return { user, role: (roleData?.role ?? null) as InternalRole | null };
}

// ============================================
// POST — Masquer toutes les notifications
// ============================================

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient();
    const { user, role } = await getCurrentUserRole(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    if (role !== 'admin' && role !== 'super-admin') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    await dismissAllNotifications(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
