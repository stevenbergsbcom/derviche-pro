/**
 * Ex\u00e9cution des mutations Cancel/Reactivate pour le service Check-in
 * Derviche Diffusion
 *
 * Logique DB (annulation, r\u00e9activation, mise \u00e0 jour capacit\u00e9s, logging).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';
import type { CheckinStatus } from '@/types/database';

import type {
  CheckinReservation,
  CancelReservationParams,
  CancelReservationResult,
  ReactivateReservationParams,
  ReactivateReservationResult,
} from './types';
import { ADMIN_ROLES } from './constants';
import {
  validateCancelReservation,
  validateReactivateReservation,
} from './cancel-validation';

/**
 * Annule une r\u00e9servation confirm\u00e9e
 *
 * Fonctionnalit\u00e9s :
 * - V\u00e9rifie que la r\u00e9servation est bien confirm\u00e9e
 * - V\u00e9rifie l'acc\u00e8s au slot
 * - Passe le statut de 'confirmed' \u00e0 'cancelled'
 * - R\u00e9initialise le checkin_status \u00e0 null
 * - Le trigger update_slot_capacity g\u00e8re l'incr\u00e9mentation de remaining_capacity
 */
export async function cancelReservationFromPWA(
  params: CancelReservationParams
): Promise<CancelReservationResult> {
  const { reservationId, userId, role, companyId } = params;

  try {
    logger.info('checkin.cancelReservationFromPWA - D\u00e9but', {
      reservationId,
      userId,
      role,
    });

    // Validation et v\u00e9rification des permissions
    const validation = await validateCancelReservation(
      reservationId,
      userId,
      role,
      companyId
    );

    if (!validation.valid) {
      return {
        success: false,
        data: null,
        error: validation.error!,
      };
    }

    // Annuler la r\u00e9servation
    const supabase = createClient();

    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        checkin_status: null, // R\u00e9initialiser le statut de check-in
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
        guest_country,
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
      logger.error('checkin.cancelReservationFromPWA - Erreur mise \u00e0 jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de l\'annulation',
      };
    }

    // Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      userId: null, // non fetch\u00e9 ici \u2014 utilis\u00e9 uniquement \u00e0 la lecture initiale
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
      guestCountry: (updated as unknown as { guest_country: string | null }).guest_country,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
      googleCalendarEventId: (updated as unknown as { guest_country: string | null, google_calendar_event_id: string | null }).google_calendar_event_id,
      checkinFollowupEmails: [],
    };

    logger.info('checkin.cancelReservationFromPWA - Succ\u00e8s', { reservationId });
    logActivityClient({
      category: 'reservation',
      action: 'reservation_cancel',
      success: true,
      actor_id: userId,
      actor_role: role,
      reservation_id: reservationId,
      details: {
        guest_name: `${result.guestFirstName ?? ''} ${result.guestLastName ?? ''}`.trim(),
        source: 'checkin',
      },
    });

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
 * R\u00e9active une r\u00e9servation annul\u00e9e
 *
 * Fonctionnalit\u00e9s :
 * - V\u00e9rifie que la r\u00e9servation est bien annul\u00e9e
 * - V\u00e9rifie l'acc\u00e8s au slot
 * - Passe le statut de 'cancelled' \u00e0 'confirmed'
 * - Le trigger update_slot_capacity g\u00e8re la d\u00e9cr\u00e9mentation de remaining_capacity
 * - Autorise l'overbooking (retourne un warning via isOverbooking)
 */
export async function reactivateReservation(
  params: ReactivateReservationParams
): Promise<ReactivateReservationResult> {
  const { reservationId, userId, role, companyId } = params;

  try {
    logger.info('checkin.reactivateReservation - D\u00e9but', {
      reservationId,
      userId,
      role,
    });

    // Validation et v\u00e9rification des permissions
    const validation = await validateReactivateReservation(
      reservationId,
      userId,
      role,
      companyId
    );

    if (!validation.valid || !validation.reservation) {
      return {
        success: false,
        data: null,
        error: validation.error!,
      };
    }

    // Extraire les infos du slot pour v\u00e9rifier l'overbooking
    const slot = validation.reservation.slots;

    const isUnlimited = slot.capacity >= 999999;
    const remainingAfterReactivation = slot.remaining_capacity - validation.reservation.num_places;
    const isOverbooking = !isUnlimited && remainingAfterReactivation < 0;

    logger.info('checkin.reactivateReservation - Calcul capacit\u00e9', {
      slotId: slot.id,
      currentRemaining: slot.remaining_capacity,
      numPlaces: validation.reservation.num_places,
      remainingAfterReactivation,
      isOverbooking,
    });

    // R\u00e9activer la r\u00e9servation
    const supabase = createClient();

    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        // On ne reset pas le checkin_status car il \u00e9tait probablement null
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
        guest_country,
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
      logger.error('checkin.reactivateReservation - Erreur mise \u00e0 jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de la r\u00e9activation',
      };
    }

    // Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      userId: null, // non fetch\u00e9 ici \u2014 utilis\u00e9 uniquement \u00e0 la lecture initiale
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
      guestCountry: (updated as unknown as { guest_country: string | null }).guest_country,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
      googleCalendarEventId: (updated as unknown as { guest_country: string | null, google_calendar_event_id: string | null }).google_calendar_event_id,
      checkinFollowupEmails: [],
    };

    logger.info('checkin.reactivateReservation - Succ\u00e8s', {
      reservationId,
      isOverbooking,
    });
    logActivityClient({
      category: 'reservation',
      action: 'reservation_reactivate',
      success: true,
      actor_id: userId,
      actor_role: role,
      reservation_id: reservationId,
      details: {
        guest_name: `${result.guestFirstName ?? ''} ${result.guestLastName ?? ''}`.trim(),
        is_overbooking: isOverbooking,
        source: 'checkin',
      },
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
