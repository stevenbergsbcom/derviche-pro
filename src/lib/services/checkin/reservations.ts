/**
 * Fonctions Reservations pour le service Check-in
 * Derviche Diffusion
 * 
 * Gestion des réservations : lecture, mise à jour du check-in, modification des infos guest.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { CheckinStatus } from '@/types/database';

import type { 
  CheckinReservation, 
  CheckinReservationsResult,
  UpdateCheckinParams,
  UpdateCheckinResult,
  UpdateGuestInfoParams,
  UpdateGuestInfoResult,
} from './types';
import { ADMIN_ROLES } from './constants';
import { canAccessSlot } from './shows';

/**
 * Récupère les réservations d'un slot
 * Triées par ordre alphabétique (nom de famille, puis prénom)
 */
export async function getSlotReservations(
  slotId: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CheckinReservationsResult> {
  try {
    logger.info('checkin.getSlotReservations - Début', { slotId, userId, role });

    // Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(slotId, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.getSlotReservations - Accès refusé', { slotId, userId });
      return { data: [], error: 'Accès non autorisé à cette représentation' };
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
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
        created_at
      `)
      .eq('slot_id', slotId)
      .order('guest_last_name', { ascending: true, nullsFirst: false })
      .order('guest_first_name', { ascending: true, nullsFirst: false });

    if (error) {
      logger.error('checkin.getSlotReservations - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      logger.info('checkin.getSlotReservations - Aucune réservation');
      return { data: [], error: null };
    }

    // Transformer les données
    // Note: checkinInternalNotes masqué pour les non-admins
    const reservations: CheckinReservation[] = data.map((r) => ({
      id: r.id,
      guestFirstName: r.guest_first_name,
      guestLastName: r.guest_last_name,
      guestEmail: r.guest_email,
      guestEmailSecondary: r.guest_email_secondary,
      guestPhone: r.guest_phone,
      guestPhoneSecondary: r.guest_phone_secondary,
      guestFunction: r.guest_function,
      guestStructure: r.guest_structure,
      guestAddress: r.guest_address,
      guestPostalCode: r.guest_postal_code,
      guestCity: r.guest_city,
      guestAfcNumber: r.guest_afc_number,
      numPlaces: r.num_places,
      status: r.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: r.checkin_status as CheckinStatus | null,
      checkinComment: r.checkin_comment,
      checkinVenueNotes: r.checkin_venue_notes,
      // Notes internes masquées pour les non-admins
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? r.checkin_internal_notes : null,
      specialRequests: r.special_requests,
      createdAt: r.created_at,
    }));

    logger.info('checkin.getSlotReservations - Succès', { count: reservations.length });
    return { data: reservations, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getSlotReservations - Exception', { error: message });
    return { data: [], error: message };
  }
}

/**
 * Met à jour le statut de check-in d'une réservation
 * 
 * Vérifie que l'utilisateur a accès au slot associé avant de modifier.
 * Enregistre également qui a fait le check-in et quand.
 */
export async function updateCheckinStatus(
  params: UpdateCheckinParams
): Promise<UpdateCheckinResult> {
  const { 
    reservationId, 
    status, 
    comment, 
    venueNotes, 
    internalNotes, 
    userId, 
    role, 
    companyId,
    // Champs guest
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
  } = params;

  try {
    logger.info('checkin.updateCheckinStatus - Début', { 
      reservationId, 
      status, 
      userId, 
      role 
    });

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, slot_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.updateCheckinStatus - Réservation non trouvée', { 
        reservationId, 
        error: fetchError 
      });
      return { 
        success: false, 
        data: null, 
        error: 'Réservation non trouvée' 
      };
    }

    // 2. Vérifier que la réservation est confirmée
    if (reservation.status !== 'confirmed') {
      logger.warn('checkin.updateCheckinStatus - Réservation non confirmée', { 
        reservationId, 
        status: reservation.status 
      });
      return { 
        success: false, 
        data: null, 
        error: 'Seules les réservations confirmées peuvent être pointées' 
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
      logger.warn('checkin.updateCheckinStatus - Accès refusé', { 
        reservationId, 
        slotId: reservation.slot_id, 
        userId 
      });
      return { 
        success: false, 
        data: null, 
        error: 'Accès non autorisé à cette représentation' 
      };
    }

    // 4. Mettre à jour la réservation
    const now = new Date().toISOString();
    
    // Construire l'objet de mise à jour
    // Note: internalNotes uniquement pour super-admin et admin
    // Note: Si status n'est pas fourni, on ne met pas à jour les champs checkin_*
    const updateData: {
      checkin_status?: CheckinStatus | null;
      checkin_comment?: string | null;
      checkin_venue_notes?: string | null;
      checkin_internal_notes?: string | null;
      checkin_at?: string;
      checkin_by?: string;
      // Champs guest (optionnels)
      guest_first_name?: string;
      guest_last_name?: string;
      guest_email?: string;
      guest_email_secondary?: string | null;
      guest_phone?: string | null;
      guest_phone_secondary?: string | null;
      guest_structure?: string | null;
      guest_function?: string | null;
      guest_address?: string | null;
      guest_postal_code?: string | null;
      guest_city?: string | null;
      guest_afc_number?: string | null;
      special_requests?: string | null;
    } = {};

    // Ajouter les champs check-in si status est fourni (y compris null pour réinitialiser)
    if (status !== undefined) {
      updateData.checkin_status = status;
      // Mettre à jour checkin_at/checkin_by seulement si on définit un status (pas si on réinitialise à null)
      if (status !== null) {
        updateData.checkin_at = now;
        updateData.checkin_by = userId;
      }
    }

    // Le commentaire peut être modifié indépendamment du statut
    if (comment !== undefined) {
      updateData.checkin_comment = comment;
    }

    // Ajouter venueNotes si fourni (tous les rôles peuvent le modifier)
    if (venueNotes !== undefined) {
      updateData.checkin_venue_notes = venueNotes;
    }

    // Ajouter internalNotes uniquement si l'utilisateur est admin
    if (internalNotes !== undefined && ADMIN_ROLES.includes(role)) {
      updateData.checkin_internal_notes = internalNotes;
    }

    // Ajouter les champs guest si fournis
    if (guestFirstName !== undefined) {
      updateData.guest_first_name = guestFirstName.trim();
    }
    if (guestLastName !== undefined) {
      updateData.guest_last_name = guestLastName.trim();
    }
    if (guestEmail !== undefined) {
      updateData.guest_email = guestEmail.trim();
    }
    if (guestEmailSecondary !== undefined) {
      updateData.guest_email_secondary = guestEmailSecondary?.trim() || null;
    }
    if (guestPhone !== undefined) {
      updateData.guest_phone = guestPhone?.trim() || null;
    }
    if (guestPhoneSecondary !== undefined) {
      updateData.guest_phone_secondary = guestPhoneSecondary?.trim() || null;
    }
    if (guestStructure !== undefined) {
      updateData.guest_structure = guestStructure?.trim() || null;
    }
    if (guestFunction !== undefined) {
      updateData.guest_function = guestFunction?.trim() || null;
    }
    if (guestAddress !== undefined) {
      updateData.guest_address = guestAddress?.trim() || null;
    }
    if (guestPostalCode !== undefined) {
      updateData.guest_postal_code = guestPostalCode?.trim() || null;
    }
    if (guestCity !== undefined) {
      updateData.guest_city = guestCity?.trim() || null;
    }
    if (guestAfcNumber !== undefined) {
      updateData.guest_afc_number = guestAfcNumber?.trim() || null;
    }
    if (specialRequests !== undefined) {
      updateData.special_requests = specialRequests?.trim() || null;
    }

    // Vérifier qu'on a quelque chose à mettre à jour
    if (Object.keys(updateData).length === 0) {
      logger.warn('checkin.updateCheckinStatus - Aucune donnée à mettre à jour', { reservationId });
      return {
        success: false,
        data: null,
        error: 'Aucune modification à enregistrer',
      };
    }

    logger.info('checkin.updateCheckinStatus - Données à mettre à jour', { 
      reservationId, 
      fieldsCount: Object.keys(updateData).length,
      fields: Object.keys(updateData),
    });

    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
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
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.updateCheckinStatus - Erreur mise à jour', { 
        reservationId, 
        error: updateError 
      });
      return { 
        success: false, 
        data: null, 
        error: updateError?.message || 'Erreur lors de la mise à jour' 
      };
    }

    // 5. Transformer et retourner la réservation mise à jour
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
    };

    logger.info('checkin.updateCheckinStatus - Succès', { 
      reservationId, 
      newStatus: status 
    });

    return { success: true, data: result, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.updateCheckinStatus - Exception', { 
      reservationId, 
      error: message 
    });
    return { success: false, data: null, error: message };
  }
}

/**
 * Met à jour les informations d'un guest sur une réservation
 * 
 * Contrairement à updateCheckinStatus, cette fonction :
 * - Fonctionne même si la réservation est annulée
 * - Ne permet PAS de modifier le checkin_status
 * - Permet de modifier les notes et les infos du professionnel
 */
export async function updateGuestInfo(
  params: UpdateGuestInfoParams
): Promise<UpdateGuestInfoResult> {
  const {
    reservationId,
    userId,
    role,
    companyId,
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
    checkinComment,
    checkinVenueNotes,
    checkinInternalNotes,
  } = params;

  try {
    logger.info('checkin.updateGuestInfo - Début', {
      reservationId,
      userId,
      role,
    });

    // Validation basique
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      return {
        success: false,
        data: null,
        error: 'Le prénom et le nom sont obligatoires',
      };
    }
    if (!guestEmail.trim()) {
      return {
        success: false,
        data: null,
        error: "L'email est obligatoire",
      };
    }

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, slot_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.updateGuestInfo - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // 2. Vérifier l'accès au slot (même pour les annulées)
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.updateGuestInfo - Accès refusé', {
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

    // 3. Construire l'objet de mise à jour
    const updateData: Record<string, string | null> = {
      guest_first_name: guestFirstName.trim(),
      guest_last_name: guestLastName.trim(),
      guest_email: guestEmail.trim(),
      guest_email_secondary: guestEmailSecondary?.trim() || null,
      guest_phone: guestPhone?.trim() || null,
      guest_phone_secondary: guestPhoneSecondary?.trim() || null,
      guest_structure: guestStructure?.trim() || null,
      guest_function: guestFunction?.trim() || null,
      guest_address: guestAddress?.trim() || null,
      guest_postal_code: guestPostalCode?.trim() || null,
      guest_city: guestCity?.trim() || null,
      guest_afc_number: guestAfcNumber?.trim() || null,
      special_requests: specialRequests?.trim() || null,
    };

    // Ajouter les notes si fournies
    if (checkinComment !== undefined) {
      updateData.checkin_comment = checkinComment?.trim() || null;
    }
    if (checkinVenueNotes !== undefined) {
      updateData.checkin_venue_notes = checkinVenueNotes?.trim() || null;
    }
    // Notes internes uniquement pour les admins
    if (checkinInternalNotes !== undefined && ADMIN_ROLES.includes(role)) {
      updateData.checkin_internal_notes = checkinInternalNotes?.trim() || null;
    }

    // 4. Effectuer la mise à jour
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
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
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.updateGuestInfo - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de la mise à jour',
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
    };

    logger.info('checkin.updateGuestInfo - Succès', { reservationId });

    return { success: true, data: result, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.updateGuestInfo - Exception', {
      reservationId,
      error: message,
    });
    return { success: false, data: null, error: message };
  }
}
