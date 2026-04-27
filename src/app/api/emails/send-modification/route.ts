/**
 * API Route - Envoi d'email de modification de créneau
 * POST /api/emails/send-modification
 *
 * Stratégie : le client envoie reservationId + oldSlotId.
 * Le serveur récupère l'ancien créneau (snapshot), le nouveau créneau
 * (déjà en DB), et envoie l'email au pro + notifs admin si activées.
 *
 * L'envoi est non-bloquant : un échec email ne fait pas échouer la modification.
 *
 * Sécurité :
 * - Rate limiting : 20 req / 1h par IP (anti-spam emails)
 * - Validation du payload entrant (Zod)
 * - Vérification que l'utilisateur connecté est propriétaire de la réservation
 *   (ou admin/super-admin/externe assigné)
 * - La clé API Resend reste côté serveur
 *
 * Refacto S198 : factorisation via `@/lib/services/email-routes`.
 */

import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  sendReservationModificationEmail,
  type ReservationModificationEmailData,
} from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api';
import {
  withEmailRateLimit,
  resolveRecipient,
  resolveProfile,
  loadManager,
  loadUserRole,
  authorizeEmailRouteAccess,
  sendAdminNotificationsForEvent,
  maybeUpdateCalendarEvent,
} from '@/lib/services/email-routes';

// ============================================
// VALIDATION SCHEMA
// ============================================

const sendModificationSchema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
  oldSlotId: z.string().uuid('ID de créneau invalide'),
  syncCalendar: z.boolean().optional().default(true),
});

// ============================================
// TYPES INTERNES
// ============================================

interface ReservationWithDetails {
  id: string;
  num_places: number;
  status: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_structure: string | null;
  guest_function: string | null;
  guest_afc_number: string | null;
  special_requests: string | null;
  google_calendar_event_id: string | null;
  user_id: string | null;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  slots: {
    id: string;
    date: string;
    time: string;
    hosted_by_id: string | null;
    venues: {
      name: string;
      city: string;
      address: string | null;
      postal_code: string | null;
    } | null;
    shows: {
      title: string;
      slug: string;
      duration_minutes: number | null;
      derviche_manager_id: string | null;
      derviche_site_url: string | null;
      companies: { name: string } | null;
    };
  };
}

interface SlotDetails {
  id: string;
  date: string;
  time: string;
  venues: { name: string; city: string } | null;
}

const ROUTE = '[API /emails/send-modification]';

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting
    const limited = await withEmailRateLimit(request, '/api/emails/send-modification');
    if (limited) return limited;

    // 1. Validation payload
    const rawBody: unknown = await request.json();
    const parseResult = sendModificationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn(`${ROUTE} Payload invalide`, { errors: parseResult.error.flatten() });
      return errorResponse('Données invalides');
    }
    const payload = parseResult.data;

    // 2. Authentification
    const userClient = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      logger.warn(`${ROUTE} Utilisateur non authentifié`);
      return unauthorizedResponse();
    }

    // 3. Admin client + chargement réservation (avec NOUVEAU créneau)
    const adminClient = createAdminClient();

    const { data: reservationRaw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
        num_places,
        status,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_structure,
        guest_function,
        guest_afc_number,
        special_requests,
        google_calendar_event_id,
        user_id,
        profiles:user_id (
          email,
          first_name,
          last_name,
          phone
        ),
        slots!inner (
          id,
          date,
          time,
          hosted_by_id,
          venues (
            name,
            city,
            address,
            postal_code
          ),
          shows!inner (
            title,
            slug,
            duration_minutes,
            derviche_manager_id,
            derviche_site_url,
            companies:company_id ( name )
          )
        )
      `)
      .eq('id', payload.reservationId)
      .maybeSingle();

    if (reservationError || !reservationRaw) {
      logger.warn(`${ROUTE} Réservation introuvable`, {
        reservationId: payload.reservationId,
      });
      return notFoundResponse('Réservation introuvable');
    }

    const reservation = reservationRaw as unknown as ReservationWithDetails;
    const slots = reservation.slots;
    const show = slots.shows;
    const newVenue = slots.venues;
    const company = show.companies;

    // 4. Autorisation — owner / full-admin / externe assigné
    const userRole = await loadUserRole(adminClient, user.id);
    const accessDenied = await authorizeEmailRouteAccess(
      adminClient,
      {
        userId: user.id,
        userRole,
        reservationUserId: reservation.user_id,
        hostedById: slots.hosted_by_id,
      },
      { allowOwner: true, allowFullAdmin: true, allowExterne: true },
      ROUTE,
    );
    if (accessDenied) return accessDenied;

    // 5. Ancien créneau (snapshot)
    const { data: oldSlotRaw, error: oldSlotError } = await adminClient
      .from('slots')
      .select('id, date, time, venues(name, city)')
      .eq('id', payload.oldSlotId)
      .maybeSingle();

    if (oldSlotError || !oldSlotRaw) {
      logger.warn(`${ROUTE} Ancien créneau introuvable`, { oldSlotId: payload.oldSlotId });
      return notFoundResponse('Ancien créneau introuvable');
    }

    const oldSlot = oldSlotRaw as unknown as SlotDetails;

    // 6. Destinataire
    const recipient = resolveRecipient(reservation);
    if (!recipient) {
      logger.warn(`${ROUTE} Aucun email destinataire`, {
        reservationId: payload.reservationId,
      });
      return errorResponse('Email destinataire introuvable', 422);
    }

    // 7. Manager
    const manager = await loadManager(adminClient, show.derviche_manager_id);

    // 8. Envoi de l'email de modification
    const modificationData: ReservationModificationEmailData = {
      to: recipient.email,
      guestFullName: recipient.fullName,
      reservationId: reservation.id,
      showTitle: show.title,
      showSlug: show.slug,
      companyName: company?.name ?? '',
      oldSlotDateFormatted: formatDateFr(oldSlot.date),
      oldSlotTimeFormatted: formatTimeFr(oldSlot.time),
      newSlotDateFormatted: formatDateFr(slots.date),
      newSlotTimeFormatted: formatTimeFr(slots.time),
      venueName: newVenue?.name ?? '',
      venueCity: newVenue?.city ?? '',
      venueAddress: newVenue?.address ?? null,
      venuePostalCode: newVenue?.postal_code ?? null,
      numPlaces: reservation.num_places,
      dervisheSiteUrl: show.derviche_site_url ?? null,
      managerName: manager.name,
      managerEmail: manager.email,
      managerPhone: manager.phone,
    };

    const emailResult = await sendReservationModificationEmail(modificationData);

    if (!emailResult.success) {
      logger.error(`${ROUTE} Échec envoi email pro`, {
        reservationId: payload.reservationId,
        error: emailResult.error,
      });
    }

    // 9. Notifications email admin (manager + custom recipient, non-bloquant)
    // Normalisation défensive : Supabase peut renvoyer `profiles` en tableau
    // pour une relation 1-1 selon le typage du select embed.
    const profilePhone = resolveProfile(reservation)?.phone ?? null;

    await sendAdminNotificationsForEvent({
      adminClient,
      eventSettingKey: 'email_notification_modification',
      baseNotifData: {
        eventType: 'modification',
        guestFullName: recipient.fullName,
        guestEmail: recipient.email,
        guestStructure: reservation.guest_structure,
        guestPhone: reservation.guest_phone ?? profilePhone,
        guestFunction: reservation.guest_function,
        guestAfcNumber: reservation.guest_afc_number,
        userId: reservation.user_id,
        showTitle: show.title,
        companyName: company?.name ?? '',
        slotDateFormatted: formatDateFr(slots.date),
        slotTimeFormatted: formatTimeFr(slots.time),
        venueName: newVenue?.name ?? '',
        venueCity: newVenue?.city ?? '',
        venueAddress: newVenue?.address ?? null,
        venuePostalCode: newVenue?.postal_code ?? null,
        numPlaces: reservation.num_places,
        specialRequests: reservation.special_requests,
        reservationId: reservation.id,
      },
      managerEmail: manager.email,
      managerName: manager.name,
      routeLabel: ROUTE,
    });

    // 10. Mise à jour Google Calendar (non-bloquant)
    if (payload.syncCalendar) {
      await maybeUpdateCalendarEvent({
        adminClient,
        googleCalendarEventId: reservation.google_calendar_event_id,
        eventData: {
          showTitle: show.title,
          guestFullName: recipient.fullName,
          guestStructure: reservation.guest_structure,
          guestEmail: recipient.email,
          reservationId: reservation.id,
          guestComment: reservation.special_requests,
          managerName: manager.name,
          managerPhone: manager.phone,
          managerEmail: manager.email,
          numPlaces: reservation.num_places,
          slotDate: slots.date,
          slotTime: slots.time,
          durationMinutes: show.duration_minutes,
          venueName: newVenue?.name ?? '',
          venueCity: newVenue?.city ?? '',
        },
        routeLabel: ROUTE,
      });
    }

    // 11. Notification admin in-app (badge sidebar) — non-bloquant
    await createAdminNotification({
      type: 'modification',
      reservation_id: reservation.id,
      professional_name: recipient.fullName,
      show_title: show.title,
      slot_date: `${slots.date}T${slots.time}`,
      message: `${recipient.fullName} a modifié son créneau pour « ${show.title} »`,
    });

    return successResponse({
      success: emailResult.success,
      messageId: emailResult.messageId,
    });
  } catch (err) {
    logger.error(`${ROUTE} Exception`, { err });
    return serverErrorResponse();
  }
}
