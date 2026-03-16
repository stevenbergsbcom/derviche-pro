/**
 * Modification des infos guest pour le service Check-in
 * Derviche Diffusion
 *
 * Contient updateGuestInfo() — met à jour les informations d'un guest
 * sur une réservation (fonctionne même si la réservation est annulée).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { CheckinFollowupTemplateKey } from '@/types/email-templates';
import type { CheckinReservation, UpdateGuestInfoParams, UpdateGuestInfoResult } from './types';
import { ADMIN_ROLES } from './constants';
import { canAccessSlot } from './shows';
import { logActivityClient } from '@/lib/services/logs/client';

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
    guestCountry,
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
      guest_country: guestCountry?.trim() || null,
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
        google_calendar_event_id,
        checkin_followup_emails (
          template_key,
          sent_at
        )
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
      userId: null, // non fetché ici — utilisé uniquement à la lecture initiale
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
      checkinStatus: updated.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
      googleCalendarEventId: (updated as unknown as { google_calendar_event_id: string | null }).google_calendar_event_id,
      checkinFollowupEmails: ((updated as unknown as {
        checkin_followup_emails: { template_key: string; sent_at: string }[] | null;
      }).checkin_followup_emails ?? []).map((e) => ({
        templateKey: e.template_key as CheckinFollowupTemplateKey,
        sentAt: e.sent_at,
      })),
    };

    logger.info('checkin.updateGuestInfo - Succès', { reservationId });

    // S190 : Log d'activité
    logActivityClient({
      category: 'reservation',
      action: 'reservation_modify_guest',
      success: true,
      actor_id: userId,
      actor_role: role,
      reservation_id: reservationId,
      details: {
        guest_name: `${result.guestFirstName} ${result.guestLastName}`,
        guest_email: result.guestEmail,
        source: 'checkin',
      },
    });

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
