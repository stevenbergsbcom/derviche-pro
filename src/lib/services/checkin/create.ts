/**
 * Fonctions Create pour le service Check-in
 * Derviche Diffusion
 * 
 * Création de réservations depuis l'interface de check-in (PWA).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';

import type { 
  CreateCheckinReservationData,
  CreateCheckinReservationResult,
  DuplicateCheckResult,
} from './types';
import { ADMIN_ROLES } from './constants';
import { isValidRpcResult } from './guards';
import { canAccessSlot } from './shows';
import { logActivityClient } from '@/lib/services/logs/client';

/**
 * Vérifie si un email a déjà une réservation sur ce créneau
 * Ne bloque pas, retourne juste l'info
 */
export async function checkDuplicateEmail(
  slotId: string,
  email: string
): Promise<DuplicateCheckResult> {
  try {
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('reservations')
      .select('id, guest_first_name, guest_last_name, num_places')
      .eq('slot_id', slotId)
      .ilike('guest_email', normalizedEmail)
      .eq('status', 'confirmed')
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('checkin.checkDuplicateEmail - Erreur', { error });
      return { hasDuplicate: false };
    }

    if (data) {
      return {
        hasDuplicate: true,
        existingReservation: {
          id: data.id,
          guestFirstName: data.guest_first_name,
          guestLastName: data.guest_last_name,
          numPlaces: data.num_places,
        },
      };
    }

    return { hasDuplicate: false };
  } catch (err) {
    logger.error('checkin.checkDuplicateEmail - Exception', { err });
    return { hasDuplicate: false };
  }
}

/**
 * Crée une réservation depuis l'interface de check-in (PWA)
 * 
 * Logique d'accès :
 * - super-admin / admin : Peuvent créer sur tous les slots
 * - externe : Peuvent créer sur les slots où ils sont hosted_by_id
 * - company : Peuvent créer sur les slots de leurs spectacles où hosted_by='company'
 * 
 * Fonctionnalités :
 * - Vérification d'accès au slot
 * - Détection de doublon email (avertissement, ne bloque pas)
 * - Création via RPC create_admin_reservation
 * - Mise à jour du checkin_status si fourni
 */
export async function createReservationFromCheckin(
  data: CreateCheckinReservationData,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CreateCheckinReservationResult> {
  try {
    logger.info('checkin.createReservationFromCheckin - Début', {
      slotId: data.slotId,
      email: data.email,
      userId,
      role,
    });

    // 1. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(data.slotId, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.createReservationFromCheckin - Accès refusé', { slotId: data.slotId });
      return { success: false, error: 'Accès non autorisé à cette représentation' };
    }

    // Note S184 : la vérification des doublons est désormais faite côté client
    // (checkDuplicateReservation + DuplicateReservationDialog) avant d'appeler cette fonction.

    // 2. Appeler la RPC create_admin_reservation
    const supabase = createClient();
    
    // Note: La RPC ne supporte pas encore checkin_status directement
    // On va créer la réservation puis mettre à jour le status si nécessaire
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_admin_reservation',
      {
        p_slot_id: data.slotId,
        p_num_places: data.numPlaces,
        p_first_name: data.firstName.trim(),
        p_last_name: data.lastName.trim(),
        p_email: data.email.trim(),
        p_phone: data.phone?.trim() || undefined,
        p_email_secondary: data.emailSecondary?.trim() || undefined,
        p_phone_secondary: data.phoneSecondary?.trim() || undefined,
        p_address: data.address?.trim() || undefined,
        p_postal_code: data.postalCode?.trim() || undefined,
        p_city: data.city?.trim() || undefined,
        p_country: data.country?.trim() || undefined,
        p_organization: data.organization?.trim() || undefined,
        p_function: data.function?.trim() || undefined,
        p_afc_number: data.afcNumber?.trim() || undefined,
        p_comment: data.specialRequests?.trim() || undefined,
        p_checkin_comment: data.checkinComment?.trim() || undefined,
        p_checkin_venue_notes: data.checkinVenueNotes?.trim() || undefined,
        p_checkin_internal_notes: ADMIN_ROLES.includes(role) 
          ? (data.checkinInternalNotes?.trim() || undefined) 
          : undefined,
      }
    );

    if (rpcError) {
      logger.error('checkin.createReservationFromCheckin - Erreur RPC', { error: rpcError });
      return { success: false, error: rpcError.message };
    }

    // Valider le format de la réponse RPC
    if (!isValidRpcResult(rpcResult)) {
      logger.error('checkin.createReservationFromCheckin - Format réponse invalide', { rpcResult });
      return { success: false, error: 'Erreur interne: format de réponse invalide' };
    }

    if (!rpcResult.success) {
      logger.error('checkin.createReservationFromCheckin - RPC échouée', { error: rpcResult.error });
      return { success: false, error: rpcResult.error || 'Erreur lors de la création' };
    }

    const reservationId = rpcResult.reservation_id;
    if (!reservationId) {
      logger.error('checkin.createReservationFromCheckin - Pas d\'ID retourné');
      return { success: false, error: 'Erreur interne: pas d\'ID de réservation' };
    }

    // 4. Si checkin_status fourni, mettre à jour la réservation
    if (data.checkinStatus) {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          checkin_status: data.checkinStatus,
          checkin_at: new Date().toISOString(),
          checkin_by: userId,
        })
        .eq('id', reservationId);

      if (updateError) {
        logger.warn('checkin.createReservationFromCheckin - Erreur mise à jour status', { 
          reservationId, 
          error: updateError 
        });
        // On ne fait pas échouer la création pour ça
      }
    }

    logger.info('checkin.createReservationFromCheckin - Succès', { reservationId });
    logActivityClient({
      category: 'reservation',
      action: 'reservation_create',
      success: true,
      actor_id: userId,
      actor_role: role,
      reservation_id: reservationId,
      details: {
        guest_name: `${data.firstName} ${data.lastName}`,
        guest_email: data.email,
        slot_id: data.slotId,
        num_places: data.numPlaces,
        checkin_status: data.checkinStatus || null,
        source: 'checkin',
      },
    });

    return {
      success: true,
      reservationId,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.createReservationFromCheckin - Exception', { error: message });
    return { success: false, error: message };
  }
}
