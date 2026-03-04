/**
 * Fonctions Transfer pour le service Check-in
 * Derviche Diffusion
 * 
 * Gestion du transfert de réservations entre créneaux.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy, CheckinStatus } from '@/types/database';

import type { 
  CheckinReservation,
  TransferReservationParams,
  TransferReservationResult,
  TransferTargetSlot,
  TransferTargetSlotsResult,
} from './types';
import { ADMIN_ROLES, MAX_PLACES } from './constants';
import { isValidVenue, isValidShow, isValidHostedBy } from './guards';
import { canAccessSlot } from './shows';

/**
 * Transfère une réservation vers un autre créneau du même spectacle
 * 
 * Fonctionnalités :
 * - Vérifie l'accès au slot source (pas le cible)
 * - Vérifie que les deux slots appartiennent au même spectacle
 * - Permet de modifier le nombre de places en même temps
 * - Reset le checkin_status à null
 * - Autorise l'overbooking (retourne un warning via isOverbooking)
 * 
 * Le trigger update_slot_capacity gère automatiquement :
 * - Libération des places sur le slot source
 * - Réservation des places sur le slot cible
 */
export async function transferReservation(
  params: TransferReservationParams
): Promise<TransferReservationResult> {
  const { reservationId, targetSlotId, newNumPlaces, userId, role, companyId } = params;

  try {
    logger.info('checkin.transferReservation - Début', {
      reservationId,
      targetSlotId,
      newNumPlaces,
      userId,
      role,
    });

    const supabase = createClient();

    // 1. Récupérer la réservation avec les infos du slot source ET l'email de l'invité
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        num_places,
        status,
        guest_email,
        guest_first_name,
        guest_last_name,
        slots!inner (
          id,
          show_id
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.transferReservation - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // Extraire le show_id du slot source
    const sourceSlot = reservation.slots as unknown as { id: string; show_id: string };
    if (!sourceSlot || typeof sourceSlot.show_id !== 'string') {
      logger.error('checkin.transferReservation - Données slot source invalides');
      return {
        success: false,
        data: null,
        error: 'Erreur interne: données du créneau invalides',
      };
    }

    // 2. Vérifier que la réservation est confirmée
    if (reservation.status !== 'confirmed') {
      logger.warn('checkin.transferReservation - Réservation non confirmée', {
        reservationId,
        status: reservation.status,
      });
      return {
        success: false,
        data: null,
        error: 'Seules les réservations confirmées peuvent être transférées',
      };
    }

    // 3. Vérifier que ce n'est pas le même slot
    if (reservation.slot_id === targetSlotId) {
      logger.warn('checkin.transferReservation - Même slot source et cible');
      return {
        success: false,
        data: null,
        error: 'Le créneau cible est identique au créneau actuel',
      };
    }

    // 4. Vérifier l'accès au slot SOURCE
    const hasAccess = await canAccessSlot(reservation.slot_id, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.transferReservation - Accès refusé au slot source', {
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette réservation',
      };
    }

    // 5. Récupérer le slot cible et vérifier qu'il appartient au même spectacle
    const { data: targetSlot, error: targetError } = await supabase
      .from('slots')
      .select('id, show_id, capacity, remaining_capacity')
      .eq('id', targetSlotId)
      .single();

    if (targetError || !targetSlot) {
      logger.warn('checkin.transferReservation - Slot cible non trouvé', {
        targetSlotId,
        error: targetError,
      });
      return {
        success: false,
        data: null,
        error: 'Créneau cible non trouvé',
      };
    }

    if (targetSlot.show_id !== sourceSlot.show_id) {
      logger.warn('checkin.transferReservation - Spectacles différents', {
        sourceShowId: sourceSlot.show_id,
        targetShowId: targetSlot.show_id,
      });
      return {
        success: false,
        data: null,
        error: 'Le transfert n\'est possible qu\'entre créneaux du même spectacle',
      };
    }

    // 6. Vérifier si l'invité a déjà une réservation sur le créneau cible
    const guestEmailNormalized = reservation.guest_email?.trim() || null;
    
    if (guestEmailNormalized) {
      const { data: existingReservation, error: duplicateError } = await supabase
        .from('reservations')
        .select('id, guest_first_name, guest_last_name')
        .eq('slot_id', targetSlotId)
        .ilike('guest_email', guestEmailNormalized)
        .eq('status', 'confirmed')
        .neq('id', reservationId) // Exclure la réservation en cours de transfert
        .limit(1)
        .maybeSingle();

      if (duplicateError) {
        logger.warn('checkin.transferReservation - Erreur vérification doublon', {
          error: duplicateError,
        });
        // On continue quand même, le trigger PostgreSQL bloquera si nécessaire
      } else if (existingReservation) {
        const existingName = [existingReservation.guest_first_name, existingReservation.guest_last_name]
          .filter(Boolean)
          .join(' ') || 'Sans nom';
        logger.warn('checkin.transferReservation - Doublon détecté', {
          reservationId,
          targetSlotId,
          existingReservationId: existingReservation.id,
        });
        return {
          success: false,
          data: null,
          error: `Cet invité (${guestEmailNormalized}) a déjà une réservation sur ce créneau (${existingName})`,
        };
      }
    }

    // 7. Calculer le nombre de places final
    const finalNumPlaces = newNumPlaces !== undefined ? newNumPlaces : reservation.num_places;

    // 8. Validation du nombre de places : entier entre 1 et MAX_PLACES
    if (!Number.isInteger(finalNumPlaces)) {
      return {
        success: false,
        data: null,
        error: 'Le nombre de places doit être un nombre entier',
      };
    }

    if (finalNumPlaces < 1) {
      return {
        success: false,
        data: null,
        error: 'Le nombre de places doit être au moins 1',
      };
    }

    if (finalNumPlaces > MAX_PLACES) {
      return {
        success: false,
        data: null,
        error: `Le nombre de places ne peut pas dépasser ${MAX_PLACES}`,
      };
    }

    // 9. Calculer la capacité après transfert pour l'avertissement d'overbooking
    const remainingAfterTransfer = targetSlot.remaining_capacity - finalNumPlaces;
    const isUnlimited = targetSlot.capacity >= 999999;
    const isOverbooking = !isUnlimited && remainingAfterTransfer < 0;

    logger.info('checkin.transferReservation - Calcul capacité', {
      targetSlotId,
      currentRemaining: targetSlot.remaining_capacity,
      finalNumPlaces,
      remainingAfterTransfer,
      isOverbooking,
    });

    // 10. Effectuer le transfert (UPDATE)
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        slot_id: targetSlotId,
        num_places: finalNumPlaces,
        checkin_status: null, // Reset du check-in
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
      // Gestion spécifique de l'erreur de doublon (code PostgreSQL 23505)
      if (updateError?.code === '23505') {
        logger.warn('checkin.transferReservation - Doublon détecté par contrainte unique', {
          reservationId,
          targetSlotId,
          error: updateError,
        });
        return {
          success: false,
          data: null,
          error: 'Cet invité a déjà une réservation sur ce créneau',
        };
      }
      
      logger.error('checkin.transferReservation - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors du transfert',
      };
    }

    // 11. Transformer la réservation mise à jour
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
      // Notes internes masquées pour les non-admins
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
      googleCalendarEventId: (updated as unknown as { google_calendar_event_id: string | null }).google_calendar_event_id,
    };

    logger.info('checkin.transferReservation - Succès', {
      reservationId,
      targetSlotId,
      finalNumPlaces,
      isOverbooking,
    });

    return {
      success: true,
      data: {
        reservation: result,
        targetSlotCapacity: {
          capacity: targetSlot.capacity,
          remainingAfterTransfer,
          isUnlimited,
          isOverbooking,
        },
      },
      error: null,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.transferReservation - Exception', {
      reservationId,
      error: message,
    });
    return {
      success: false,
      data: null,
      error: 'Une erreur inattendue est survenue lors du transfert',
    };
  }
}

/**
 * Récupère les créneaux disponibles pour le transfert d'une réservation
 * Retourne tous les créneaux du même spectacle (sauf le créneau actuel)
 * avec indication si l'invité a déjà une réservation sur chaque créneau
 */
export async function getTransferTargetSlots(
  reservationId: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<TransferTargetSlotsResult> {
  try {
    logger.info('checkin.getTransferTargetSlots - Début', { reservationId, userId, role });

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id actuel ET l'email de l'invité
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        status,
        guest_email,
        slots!inner (
          id,
          show_id,
          shows!inner (
            slug
          )
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.getTransferTargetSlots - Réservation non trouvée', { reservationId });
      return { data: [], error: 'Réservation non trouvée' };
    }

    // 2. Vérifier l'accès au slot source
    const hasAccess = await canAccessSlot(reservation.slot_id, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.getTransferTargetSlots - Accès refusé');
      return { data: [], error: 'Accès non autorisé à cette réservation' };
    }

    // Extraire les infos du slot
    const sourceSlot = reservation.slots as unknown as { 
      id: string; 
      show_id: string; 
      shows: { slug: string } 
    };
    
    if (!sourceSlot?.shows?.slug) {
      logger.error('checkin.getTransferTargetSlots - Données slot invalides');
      return { data: [], error: 'Erreur interne: données invalides' };
    }

    // 3. Récupérer tous les slots du même spectacle
    const { data: allSlots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        capacity,
        remaining_capacity,
        hosted_by,
        hosted_by_id,
        venues (
          id,
          name,
          city
        ),
        shows!inner (
          id,
          slug,
          title
        ),
        reservations (
          id,
          status,
          checkin_status,
          guest_email
        )
      `)
      .eq('show_id', sourceSlot.show_id)
      .neq('id', reservation.slot_id) // Exclure le slot actuel
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      logger.error('checkin.getTransferTargetSlots - Erreur Supabase', { error: slotsError });
      return { data: [], error: slotsError.message };
    }

    if (!allSlots || allSlots.length === 0) {
      return { data: [], error: null };
    }

    // Normaliser l'email de l'invité pour la comparaison
    const guestEmailNormalized = reservation.guest_email?.toLowerCase().trim() || null;

    // 4. Transformer les données
    const slots: TransferTargetSlot[] = [];

    for (const slot of allSlots) {
      // Valider le venue
      const venue = isValidVenue(slot.venues)
        ? { id: slot.venues.id, name: slot.venues.name, city: (slot.venues as { city?: string }).city || '' }
        : { id: '', name: 'Lieu inconnu', city: '' };

      // Valider le show
      if (!isValidShow(slot.shows)) continue;
      const show = slot.shows;

      // Valider hosted_by
      const hostedBy: SlotHostedBy = isValidHostedBy(slot.hosted_by)
        ? slot.hosted_by
        : 'derviche';

      // Compter les réservations
      const reservations = Array.isArray(slot.reservations) ? slot.reservations : [];
      const confirmedReservations = reservations.filter(
        (r): r is { id: string; status: string; checkin_status: string | null; guest_email: string | null } =>
          typeof r === 'object' && r !== null && (r as { status?: unknown }).status === 'confirmed'
      );
      const confirmedCount = confirmedReservations.length;
      const checkedInCount = confirmedReservations.filter(
        (r) =>
          r.checkin_status !== null &&
          r.checkin_status !== 'absent'
      ).length;

      // Vérifier si l'invité a déjà une réservation confirmée sur ce créneau
      const hasExistingGuestReservation = guestEmailNormalized
        ? confirmedReservations.some(
            (r) => r.guest_email?.toLowerCase().trim() === guestEmailNormalized
          )
        : false;

      slots.push({
        id: slot.id,
        date: slot.date,
        time: slot.time,
        capacity: slot.capacity,
        remainingCapacity: slot.remaining_capacity,
        hostedBy,
        hostedById: slot.hosted_by_id,
        venue,
        show: {
          id: show.id,
          slug: show.slug,
          title: show.title,
        },
        confirmedCount,
        checkedInCount,
        hasExistingGuestReservation,
      });
    }

    logger.info('checkin.getTransferTargetSlots - Succès', { count: slots.length });
    return { data: slots, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getTransferTargetSlots - Exception', { error: message });
    return { data: [], error: 'Une erreur inattendue est survenue' };
  }
}
