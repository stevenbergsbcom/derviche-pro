/**
 * API Route - 20 dernières réservations d'un professionnel (PWA)
 * GET /api/pwa/professional/[userId]/recent
 *
 * Utilisé dans le CheckinDrawer PWA pour afficher l'historique
 * récent d'un professionnel connecté.
 *
 * Accès : tous les rôles authentifiés (staff DD + company).
 * L'affichage dans le drawer est limité à isStaffDD côté UI.
 *
 * Derviche Diffusion — Session S152
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface PwaRecentReservationEntry {
  reservation_id: string;
  show_title: string;
  slot_date: string;
  slot_time: string;
  reservation_status: 'confirmed' | 'cancelled' | 'no_show';
  checkin_status: 'present_loved' | 'present_press' | 'present_neutral' | 'absent' | null;
  num_places: number;
}

interface ApiResponse {
  success: boolean;
  data?: PwaRecentReservationEntry[];
  error?: string;
}

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// ============================================
// GET
// ============================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { userId } = await context.params;

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant invalide' },
        { status: 400 }
      );
    }

    // Vérification authentification (tout rôle connecté)
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Autorisation : soi-même OU staff DD (super-admin, admin, externe)
    if (currentUser.id !== userId) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .in('role', ['super-admin', 'admin', 'externe'])
        .maybeSingle();

      if (!roleRow) {
        return NextResponse.json(
          { success: false, error: 'Non autorisé' },
          { status: 403 }
        );
      }
    }

    // Appel RPC via service_role
    const supabaseAdmin = createAdminClient();
    const { data, error: rpcError } = await supabaseAdmin.rpc(
      'get_professional_recent_reservations',
      { p_user_id: userId }
    );

    if (rpcError) {
      logger.error('API /pwa/professional/[userId]/recent - Erreur RPC', {
        userId,
        error: rpcError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (data ?? []) as PwaRecentReservationEntry[],
    });
  } catch (error) {
    logger.error('API /pwa/professional/[userId]/recent - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
