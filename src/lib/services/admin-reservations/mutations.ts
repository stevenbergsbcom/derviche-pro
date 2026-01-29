/**
 * Fonctions de mutation pour le service Admin Reservations
 * Création, modification, annulation, check-in
 * 
 * @module admin-reservations/mutations
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { 
  AdminReservationResult,
  CheckinUpdateData,
  UpdateReservationData,
  CreateAdminReservationData,
  CreateAdminReservationResult,
  RpcResult,
} from './types';
import { 
  ERROR_MESSAGES, 
  USER_ERROR_MESSAGES,
  RPC_ERROR_DUPLICATE_PREFIX,
} from './constants';
import { getAdminReservationById } from './detail';

// ============================================
// CHECK-IN
// ============================================

/**
 * Met à jour le statut check-in d'une réservation
 * 
 * @param id - UUID de la réservation
 * @param checkinData - Données de check-in (statut, commentaires, notes)
 * @returns Réservation mise à jour ou erreur
 * 
 * @example
 * ```ts
 * const result = await updateReservationCheckin('123', {
 *   checkinStatus: 'present_loved',
 *   checkinComment: 'Très intéressé par la programmation',
 * });
 * ```
 */
export async function updateReservationCheckin(
  id: string,
  checkinData: CheckinUpdateData
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        checkin_status: checkinData.checkinStatus,
        checkin_comment: checkinData.checkinComment || null,
        checkin_venue_notes: checkinData.checkinVenueNotes || null,
        checkin_internal_notes: checkinData.checkinInternalNotes || null,
        checkin_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      logger.error(ERROR_MESSAGES.UPDATE_CHECKIN, { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    const result = await getAdminReservationById(id);
    if (result.data) {
      logger.info(`Checkin mis à jour: ${id} → ${checkinData.checkinStatus}`);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception updateReservationCheckin', { id, message });
    return { data: null, error: message };
  }
}

// ============================================
// MODIFICATION COMPLÈTE
// ============================================

/**
 * Modifie une réservation complètement (via RPC sécurisée)
 * Gère automatiquement les changements de capacité
 * 
 * @param id - UUID de la réservation
 * @param data - Données à mettre à jour (partielles)
 * @returns Réservation mise à jour ou erreur
 * 
 * @remarks
 * Utilise la fonction RPC `update_reservation_safe` qui :
 * - Vérifie la capacité disponible si changement de slot ou nombre de places
 * - Met à jour les compteurs de capacité automatiquement
 * - Retourne une erreur explicite si capacité insuffisante
 * 
 * @example
 * ```ts
 * const result = await updateReservation('123', {
 *   numPlaces: 3,
 *   slotId: 'new-slot-uuid',
 * });
 * ```
 */
export async function updateReservation(
  id: string,
  data: UpdateReservationData
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    // Appel à la fonction RPC sécurisée
    // Note: Cast nécessaire car les types Supabase auto-générés ne contiennent pas cette RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await (supabase.rpc as any)('update_reservation_safe', {
      p_reservation_id: id,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_email: data.email,
      p_phone: data.phone,
      p_email_secondary: data.emailSecondary,
      p_phone_secondary: data.phoneSecondary,
      p_address: data.address,
      p_postal_code: data.postalCode,
      p_city: data.city,
      p_organization: data.organization,
      p_function: data.function,
      p_afc_number: data.afcNumber,
      p_num_places: data.numPlaces,
      p_slot_id: data.slotId,
      p_special_requests: data.specialRequests,
      p_checkin_comment: data.checkinComment,
      p_checkin_venue_notes: data.checkinVenueNotes,
      p_checkin_internal_notes: data.checkinInternalNotes,
    });

    if (rpcError) {
      logger.error('Erreur RPC update_reservation_safe', { id, error: rpcError.message });
      return { data: null, error: rpcError.message };
    }

    // Vérifier le résultat de la RPC
    const rpcResult = result as RpcResult;
    if (!rpcResult.success) {
      logger.error(ERROR_MESSAGES.UPDATE_RPC_FAIL, { id, error: rpcResult.error });
      return { data: null, error: rpcResult.error || ERROR_MESSAGES.UPDATE_RESERVATION };
    }

    // Récupérer la réservation mise à jour
    const updatedResult = await getAdminReservationById(id);
    if (updatedResult.data) {
      logger.info(`Réservation modifiée: ${id}`);
    }

    return updatedResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception updateReservation', { id, message });
    return { data: null, error: message };
  }
}

// ============================================
// ANNULATION
// ============================================

/**
 * Annule une réservation
 * 
 * @param id - UUID de la réservation
 * @param reason - Motif d'annulation (optionnel)
 * @returns Réservation annulée ou erreur
 * 
 * @remarks
 * - Met le statut à 'cancelled'
 * - Enregistre la date et le motif d'annulation
 * - La capacité du slot est automatiquement mise à jour via trigger
 * 
 * @example
 * ```ts
 * const result = await cancelReservation('123', 'Demande du programmateur');
 * ```
 */
export async function cancelReservation(
  id: string,
  reason?: string
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      })
      .eq('id', id);

    if (updateError) {
      logger.error(ERROR_MESSAGES.CANCEL, { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    const result = await getAdminReservationById(id);
    if (result.data) {
      logger.info(`Réservation annulée: ${id}`);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception cancelReservation', { id, message });
    return { data: null, error: message };
  }
}

// ============================================
// CRÉATION
// ============================================

/**
 * Crée une nouvelle réservation depuis l'interface admin
 * Utilise la RPC create_admin_reservation pour traçabilité
 * 
 * @param data - Données de la réservation à créer
 * @returns Succès avec ID ou erreur
 * 
 * @remarks
 * - Vérifie automatiquement la capacité disponible
 * - Détecte les doublons email/slot (règle R-RESA-04)
 * - Enregistre la source comme 'admin' pour traçabilité
 * 
 * @example
 * ```ts
 * const result = await createAdminReservation({
 *   slotId: 'slot-uuid',
 *   numPlaces: 2,
 *   firstName: 'Jean',
 *   lastName: 'Dupont',
 *   email: 'jean.dupont@example.com',
 * });
 * 
 * if (result.success) {
 *   console.log(`Réservation créée: ${result.reservationId}`);
 * }
 * ```
 */
export async function createAdminReservation(
  data: CreateAdminReservationData
): Promise<CreateAdminReservationResult> {
  try {
    const supabase = createClient();

    // Appel à la fonction RPC sécurisée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await (supabase.rpc as any)('create_admin_reservation', {
      p_slot_id: data.slotId,
      p_num_places: data.numPlaces,
      p_first_name: data.firstName.trim(),
      p_last_name: data.lastName.trim(),
      p_email: data.email.trim().toLowerCase(),
      p_phone: data.phone?.trim() || null,
      p_email_secondary: data.emailSecondary?.trim() || null,
      p_phone_secondary: data.phoneSecondary?.trim() || null,
      p_address: data.address?.trim() || null,
      p_postal_code: data.postalCode?.trim() || null,
      p_city: data.city?.trim() || null,
      p_organization: data.organization?.trim() || null,
      p_function: data.function?.trim() || null,
      p_afc_number: data.afcNumber?.trim() || null,
      p_comment: data.comment?.trim() || null,
      p_checkin_comment: data.checkinComment?.trim() || null,
      p_checkin_venue_notes: data.checkinVenueNotes?.trim() || null,
      p_checkin_internal_notes: data.checkinInternalNotes?.trim() || null,
    });

    if (rpcError) {
      logger.error('Erreur RPC create_admin_reservation', { error: rpcError.message });
      return { success: false, error: rpcError.message };
    }

    // Vérifier le résultat de la RPC
    const rpcResult = result as RpcResult;
    
    if (!rpcResult.success) {
      // Détecter l'erreur de doublon email/slot (R-RESA-04)
      if (rpcResult.error?.includes(RPC_ERROR_DUPLICATE_PREFIX)) {
        const email = rpcResult.error.split(RPC_ERROR_DUPLICATE_PREFIX)[1]?.trim() || data.email;
        logger.warn('[admin-reservations] Doublon email/slot détecté', { 
          slotId: data.slotId, 
          email,
        });
        return {
          success: false,
          error: USER_ERROR_MESSAGES.DUPLICATE_EMAIL_SLOT(email),
        };
      }

      logger.error(ERROR_MESSAGES.CREATE_RPC_FAIL, { error: rpcResult.error });
      return { success: false, error: rpcResult.error || 'Erreur lors de la création' };
    }

    logger.info('Réservation admin créée', { reservationId: rpcResult.reservation_id });
    return { success: true, reservationId: rpcResult.reservation_id };

  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception createAdminReservation', { message });
    return { success: false, error: message };
  }
}
