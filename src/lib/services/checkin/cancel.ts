/**
 * Fonctions Cancel pour le service Check-in
 * Derviche Diffusion
 * 
 * Annulation et réactivation de réservations depuis l'interface de check-in (PWA).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { CheckinStatus } from '@/types/database';

import type { 
  CheckinReservation,
  CancelReservationParams,
  CancelReservationResult,
  ReactivateReservationParams,
  ReactivateReservationResult,
} from './types';
import { ADMIN_ROLES } from './constants';
import { canAccessSlot } from './shows';

/**
 * Annule une réservation confirmée
 * 
 * Fonctionnalités :
 * - Vérifie que la réservation est bien confirmée
 * - Vérifie l'accès au slot
 * - Passe le statut de 'confirmed' à 'cancelled'
 * - Réinitialise le checkin_status à null
 * - Le trigger update_slot_capacity gère l'incrémentation de remaining_capacity
 */
export async function cancelReservationFromPWA(
  params: CancelReservationParams
): Promise<CancelReservationResult> {
  const { reservationId, userId, role, companyId } = params;

  try {
    logger.info('checkin.cancelReservationFromPWA - Début', {
      reservationId,
      userId,
      role,
    });

    const supabase = createClient();

    // 1. Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, slot_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.cancelReservationFromPWA - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // 2. Vérifier que la réservation est bien confirmée
    if (reservation.status !== 'confirmed') {
      logger.warn('checkin.cancelReservationFromPWA - Réservation non confirmée', {
        reservationId,
        status: reservation.status,
      });
      return {
        success: false,
        data: null,
        error: 'Cette réservation n\'est pas confirmée',
      };
    }

    // 3. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.cancelReservationFromPWA - Accès refusé', {
        reservationId,
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette représentation',
      };
    }

    // 4. Annuler la réservation
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        checkin_status: null, // Réinitialiser le statut de check-in
      })
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at,
        google_calendar_event_id
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.cancelReservationFromPWA - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de l\'annulation',
      };
    }

    // 5. Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
      googleCalendarEventId: (updated as unknown as { google_calendar_event_id: string | null }).google_calendar_event_id,
    };

    logger.info('checkin.cancelReservationFromPWA - Succès', { reservationId });

    return { success: true, data: result, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.cancelReservationFromPWA - Exception', {
      reservationId,
      error: message,
    });
    return { success: false, data: null, error: message };
  }
}

/**
 * Réactive une réservation annulée
 * 
 * Fonctionnalités :
 * - Vérifie que la réservation est bien annulée
 * - Vérifie l'accès au slot
 * - Passe le statut de 'cancelled' à 'confirmed'
 * - Le trigger update_slot_capacity gère la décrémentation de remaining_capacity
 * - Autorise l'overbooking (retourne un warning via isOverbooking)
 */
export async function reactivateReservation(
  params: ReactivateReservationParams
): Promise<ReactivateReservationResult> {
  const { reservationId, userId, role, companyId } = params;

  try {
    logger.info('checkin.reactivateReservation - Début', {
      reservationId,
      userId,
      role,
    });

    const supabase = createClient();

    // 1. Récupérer la réservation avec les infos du slot
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        num_places,
        status,
        slots!inner (
          id,
          capacity,
          remaining_capacity
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.reactivateReservation - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // 2. Vérifier que la réservation est bien annulée
    if (reservation.status !== 'cancelled') {
      logger.warn('checkin.reactivateReservation - Réservation non annulée', {
        reservationId,
        status: reservation.status,
      });
      return {
        success: false,
        data: null,
        error: 'Cette réservation n\'est pas annulée',
      };
    }

    // 3. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.reactivateReservation - Accès refusé', {
        reservationId,
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette représentation',
      };
    }

    // 4. Extraire les infos du slot pour vérifier l'overbooking
    const slot = reservation.slots as unknown as {
      id: string;
      capacity: number;
      remaining_capacity: number;
    };

    const isUnlimited = slot.capacity >= 999999;
    const remainingAfterReactivation = slot.remaining_capacity - reservation.num_places;
    const isOverbooking = !isUnlimited && remainingAfterReactivation < 0;

    logger.info('checkin.reactivateReservation - Calcul capacité', {
      slotId: slot.id,
      currentRemaining: slot.remaining_capacity,
      numPlaces: reservation.num_places,
      remainingAfterReactivation,
      isOverbooking,
    });

    // 5. Réactiver la réservation
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        // On ne reset pas le checkin_status car il était probablement null
      })
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at,
        google_calendar_event_id
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.reactivateReservation - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de la réactivation',
      };
    }

    // 6. Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
      googleCalendarEventId: (updated as unknown as { google_calendar_event_id: string | null }).google_calendar_event_id,
    };

    logger.info('checkin.reactivateReservation - Succès', {
      reservationId,
      isOverbooking,
    });

    return {
      success: true,
      data: {
        reservation: result,
        isOverbooking,
      },
      error: null,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.reactivateReservation - Exception', {
      reservationId,
      error: message,
    });
    return { success: false, data: null, error: message };
  }
}
