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

import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  requireAuth,
  errorResponse,
  serverErrorResponse,
  successResponse,
} from '@/lib/api';

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

interface RouteContext {
  params: Promise<{ professionalId: string }>;
}

// ============================================
// GET - Historique complet
// ============================================

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { professionalId } = await context.params;
    logger.info('API /admin/professionals/[id]/history GET - Début', { professionalId });

    // Vérification UUID basique
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(professionalId)) {
      return errorResponse('Identifiant invalide', 400);
    }

    // Vérification authentification + rôle admin
    const supabase = await createClient();
    const auth = await requireAuth(supabase);
    if (!auth.ok) return auth.response;

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
      return serverErrorResponse('Erreur lors de la récupération de l\'historique');
    }

    logger.info('API /admin/professionals/[id]/history - Succès', {
      professionalId,
      count: (data as ProfessionalReservationHistoryEntry[]).length,
    });

    return successResponse((data ?? []) as ProfessionalReservationHistoryEntry[]);
  } catch (error) {
    logger.error('API /admin/professionals/[id]/history - Exception', { error });
    return serverErrorResponse();
  }
}
