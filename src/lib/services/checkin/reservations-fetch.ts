/**
 * Lecture des réservations d'un slot pour le service Check-in
 * Derviche Diffusion
 *
 * Contient getSlotReservations() — récupère et transforme les réservations
 * triées par ordre alphabétique.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { CheckinReservation, CheckinReservationsResult } from './types';
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
        user_id,
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
      userId: (r as unknown as { user_id: string | null }).user_id,
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
      guestCountry: (r as unknown as { guest_country: string | null }).guest_country,
      guestAfcNumber: r.guest_afc_number,
      numPlaces: r.num_places,
      status: r.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: r.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: r.checkin_comment,
      checkinVenueNotes: r.checkin_venue_notes,
      // Notes internes : super-admin, admin et externe uniquement (voir ADMIN_ROLES)
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? r.checkin_internal_notes : null,
      specialRequests: r.special_requests,
      createdAt: r.created_at,
      googleCalendarEventId: (r as unknown as { google_calendar_event_id: string | null }).google_calendar_event_id,
      checkinFollowupEmails: ((r as unknown as {
        checkin_followup_emails: { template_key: string; sent_at: string }[] | null;
      }).checkin_followup_emails ?? []).map((e) => ({
        templateKey: e.template_key as import('@/types/email-templates').CheckinFollowupTemplateKey,
        sentAt: e.sent_at,
      })),
    }));

    logger.info('checkin.getSlotReservations - Succès', { count: reservations.length });
    return { data: reservations, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getSlotReservations - Exception', { error: message });
    return { data: [], error: message };
  }
}
