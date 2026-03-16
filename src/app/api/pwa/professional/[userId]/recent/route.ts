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
import {
  requireAuth,
  STAFF_ROLES,
  errorResponse,
  successResponse,
  serverErrorResponse,
  getErrorMessage,
} from '@/lib/api';

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

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// ============================================
// GET
// ============================================

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await context.params;

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(userId)) {
      return errorResponse('Identifiant invalide', 400);
    }

    // Vérification authentification + rôle staff
    const supabase = await createClient();
    const auth = await requireAuth(
      supabase,
      [...STAFF_ROLES, 'professional'],
      '[pwa/professional/recent]'
    );
    if (!auth.ok) return auth.response;

    // Autorisation : soi-même OU staff DD (super-admin, admin, externe)
    if (auth.userId !== userId) {
      const staffRoles = ['super-admin', 'admin', 'externe'];
      if (!staffRoles.includes(auth.role)) {
        return errorResponse('Non autorisé', 403);
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
      return serverErrorResponse('Erreur lors de la récupération');
    }

    return successResponse((data ?? []) as PwaRecentReservationEntry[]);
  } catch (err) {
    logger.error('API /pwa/professional/[userId]/recent - Exception', {
      error: getErrorMessage(err),
    });
    return serverErrorResponse('Erreur serveur');
  }
}
