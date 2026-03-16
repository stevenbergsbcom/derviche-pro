/**
 * Mutations (écriture) des réservations professionnelles
 *
 * @module pro-reservations/mutations
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';
import type {
  CancelResult,
  ChangeSlotResult,
  ClaimReservationsResult,
  UpdateReservationRpcResult,
} from './types';

/**
 * Type guard pour valider le résultat de la RPC update_reservation_safe
 * Évite un simple cast (result as RpcResult) non vérifié
 */
function isUpdateReservationRpcResult(val: unknown): val is UpdateReservationRpcResult {
  return (
    typeof val === 'object' &&
    val !== null &&
    'success' in val &&
    typeof (val as Record<string, unknown>).success === 'boolean'
  );
}

/**
 * Annule une réservation appartenant au programmateur connecté
 * La clause user_id = auth.uid() empêche l'annulation de réservations tierces
 *
 * @param id - UUID de la réservation à annuler
 * @param reason - Motif d'annulation (optionnel)
 */
export async function cancelMyReservation(
  id: string,
  reason?: string
): Promise<CancelResult> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour annuler une réservation.' };
    }

    // Vérifier que la réservation existe, appartient au user et est annulable
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      logger.warn('Tentative annulation réservation introuvable ou non autorisée', { id, userId: user.id });
      return { success: false, error: 'Réservation introuvable ou accès non autorisé.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Cette réservation est déjà annulée.' };
    }

    // Annulation effective
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('Erreur annulation réservation pro', { id, error: updateError.message });
      return { success: false, error: updateError.message };
    }

    logger.info('Réservation annulée par le pro', { id, userId: user.id });
    logActivityClient({
      category: 'reservation',
      action: 'reservation_cancel',
      success: true,
      reservation_id: id,
      details: {
        reason: reason ?? null,
        source: 'professional',
      },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception cancelMyReservation', { id, message });
    return { success: false, error: message };
  }
}

/**
 * Change le créneau d'une réservation appartenant au programmateur connecté
 * Utilise la RPC update_reservation_safe (gère la capacité automatiquement)
 *
 * @param reservationId - UUID de la réservation à modifier
 * @param newSlotId - UUID du nouveau créneau
 */
export async function changeMyReservationSlot(
  reservationId: string,
  newSlotId: string
): Promise<ChangeSlotResult> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour modifier une réservation.' };
    }

    // Vérifier que la réservation appartient bien au user et est modifiable
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, slot_id')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      logger.warn('Tentative modification réservation introuvable ou non autorisée', {
        reservationId,
        userId: user.id,
      });
      return { success: false, error: 'Réservation introuvable ou accès non autorisé.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Impossible de modifier une réservation annulée.' };
    }

    if (existing.slot_id === newSlotId) {
      return { success: false, error: 'Vous êtes déjà inscrit sur ce créneau.' };
    }

    // Appel à la RPC sécurisée qui gère la capacité
    // update_reservation_safe n'est pas dans les types DB générés — cast via unknown + type guard sur le retour
    const { data: result, error: rpcError } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>)('update_reservation_safe', {
      p_reservation_id: reservationId,
      p_slot_id: newSlotId,
      // Tous les autres champs à null = conservés tels quels par la RPC
      p_first_name: null,
      p_last_name: null,
      p_email: null,
      p_phone: null,
      p_email_secondary: null,
      p_phone_secondary: null,
      p_address: null,
      p_postal_code: null,
      p_city: null,
      p_organization: null,
      p_function: null,
      p_afc_number: null,
      p_num_places: null,
      p_special_requests: null,
      p_checkin_comment: null,
      p_checkin_venue_notes: null,
      p_checkin_internal_notes: null,
    });

    if (rpcError) {
      logger.error('Erreur RPC changeMyReservationSlot', { reservationId, error: rpcError.message });
      return { success: false, error: rpcError.message };
    }

    // Valider le résultat via type guard au lieu d'un cast aveugle
    if (!isUpdateReservationRpcResult(result)) {
      logger.error('RPC update_reservation_safe : réponse inattendue', { reservationId, result });
      return { success: false, error: 'Réponse serveur inattendue.' };
    }

    if (!result.success) {
      logger.error('RPC update_reservation_safe échouée (pro)', { reservationId, error: result.error });
      return { success: false, error: result.error ?? 'Erreur lors de la modification.' };
    }

    logger.info('Créneau modifié par le pro', { reservationId, newSlotId, userId: user.id });
    logActivityClient({
      category: 'reservation',
      action: 'reservation_change_slot',
      success: true,
      reservation_id: reservationId,
      details: {
        new_slot_id: newSlotId,
        source: 'professional',
      },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception changeMyReservationSlot', { reservationId, message });
    return { success: false, error: message };
  }
}

/**
 * Rapatrie les réservations guest sélectionnées vers le compte de l'utilisateur connecté
 * La RPC vérifie que l'email et le user_id correspondent bien au compte authentifié
 *
 * @param userId - UUID de l'utilisateur connecté
 * @param email - Email de l'utilisateur (doit correspondre à son compte)
 * @param reservationIds - Liste des IDs de réservations à rapatrier
 */
export async function claimSelectedReservations(
  userId: string,
  email: string,
  reservationIds: string[]
): Promise<ClaimReservationsResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('claim_selected_reservations', {
      p_user_id: userId,
      p_email: email,
      p_reservation_ids: reservationIds,
    });

    if (error) {
      logger.error('Erreur rapatriement réservations guest', { error: error.message });
      return { claimed: 0, error: error.message };
    }

    const claimed = typeof data === 'number' ? data : 0;
    logger.info('Réservations guest rapatriées', { userId, count: claimed });
    return { claimed, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception claimSelectedReservations', { message });
    return { claimed: 0, error: message };
  }
}
