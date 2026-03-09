/**
 * API Route - Historique des réservations d'un professionnel
 * GET /api/admin/professionals/[professionalId]/history
 *
 * Retourne TOUTES les réservations (tous statuts, tous spectacles)
 * d'un professionnel, ordonnées par date décroissante.
 *
 * Appelle la RPC get_professional_reservation_history via service_role.
 * Accessible uniquement aux super-admin et admin.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface ProfessionalReservationHistoryEntry {
  reservation_id: string;
  show_title: string;
  slot_date: string;
  slot_time: string;
  reservation_status: 'confirmed' | 'cancelled' | 'no_show';
  checkin_status: 'present_loved' | 'present_press' | 'present_neutral' | 'absent' | null;
  num_places: number;
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: ProfessionalReservationHistoryEntry[];
  error?: string;
}

interface RouteContext {
  params: Promise<{ professionalId: string }>;
}

// ============================================
// GET - Historique complet
// ============================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id]/history GET - Début', { professionalId });

    // Vérification UUID basique
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(professionalId)) {
      return NextResponse.json(
        { success: false, error: 'Identifiant invalide' },
        { status: 400 }
      );
    }

    // Vérification authentification + rôle admin
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

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .in('role', ['super-admin', 'admin'])
      .single();

    if (!roleData) {
      return NextResponse.json(
        { success: false, error: 'Droits insuffisants' },
        { status: 403 }
      );
    }

    // Appel RPC via service_role (bypasse RLS)
    const supabaseAdmin = createAdminClient();

    const { data, error: rpcError } = await supabaseAdmin.rpc(
      'get_professional_reservation_history',
      { p_user_id: professionalId }
    );

    if (rpcError) {
      logger.error('API /admin/professionals/[id]/history - Erreur RPC', {
        professionalId,
        error: rpcError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération de l\'historique' },
        { status: 500 }
      );
    }

    logger.info('API /admin/professionals/[id]/history - Succès', {
      professionalId,
      count: (data as ProfessionalReservationHistoryEntry[]).length,
    });

    return NextResponse.json({
      success: true,
      data: (data ?? []) as ProfessionalReservationHistoryEntry[],
    });
  } catch (error) {
    logger.error('API /admin/professionals/[id]/history - Exception', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
