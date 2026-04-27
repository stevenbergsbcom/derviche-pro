/**
 * API Route - Envoi d'email d'annulation de réservation
 * POST /api/emails/send-cancellation
 *
 * Stratégie : le client envoie seulement le reservationId.
 * Le serveur récupère toutes les données nécessaires (show, venue, manager, etc.)
 * en utilisant le service role pour bypasser les RLS.
 *
 * L'envoi est non-bloquant : un échec email ne fait pas échouer l'annulation.
 *
 * Sécurité :
 * - Rate limiting : 20 req / 1h par IP (anti-spam emails)
 * - Validation du payload entrant (Zod)
 * - Vérification que l'utilisateur connecté est bien lié à la réservation
 *   (propriétaire, admin, super-admin, ou externe assigné au spectacle)
 * - La clé API Resend reste côté serveur
 *
 * Refacto S198 : factorisation via `@/lib/services/email-routes`.
 */

import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  sendReservationCancellationEmail,
  type ReservationCancellationEmailData,
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
  maybeDeleteCalendarEvent,
} from '@/lib/services/email-routes';

// ============================================
// VALIDATION SCHEMA
// ============================================

const sendCancellationSchema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
  syncCalendar: z.boolean().optional().default(true),
});

// ============================================
// TYPES INTERNES
// ============================================

interface ReservationWithDetails {
  id: string;
  num_places: number;
  status: string;
  cancellation_reason: string | null;
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
      derviche_manager_id: string | null;
      companies: { name: string } | null;
    };
  };
}

const ROUTE = '[API /emails/send-cancellation]';

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting (anti-spam emails)
    const limited = await withEmailRateLimit(request, '/api/emails/send-cancellation');
    if (limited) return limited;

    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendCancellationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn(`${ROUTE} Payload invalide`, { errors: parseResult.error.flatten() });
      return errorResponse('Données invalides');
    }
    const payload = parseResult.data;

    // 2. Authentification de l'utilisateur courant
    const userClient = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      logger.warn(`${ROUTE} Utilisateur non authentifié`);
      return unauthorizedResponse();
    }

    // 3. Admin client + chargement de la réservation
    const adminClient = createAdminClient();

    const { data: reservationRaw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
        num_places,
        status,
        cancellation_reason,
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
            derviche_manager_id,
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
    const venue = slots.venues;
    const company = show.companies;

    // 4. Autorisation — owner / full-admin / externe assigné
    const userRole = await loadUserRole(adminClient, user.id);
    const authError2 = await authorizeEmailRouteAccess(
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
    if (authError2) return authError2;

    // 5. Vérifier que la réservation est bien annulée
    if (reservation.status !== 'cancelled') {
      logger.warn(`${ROUTE} Réservation non annulée`, {
        reservationId: payload.reservationId,
        status: reservation.status,
      });
      return errorResponse("La réservation n'est pas annulée", 422);
    }

    // 6. Résoudre le destinataire
    const recipient = resolveRecipient(reservation);
    if (!recipient) {
      logger.warn(`${ROUTE} Aucun email destinataire trouvé`, {
        reservationId: payload.reservationId,
      });
      return errorResponse('Email destinataire introuvable', 422);
    }

    // 7. Manager Derviche
    const manager = await loadManager(adminClient, show.derviche_manager_id);

    // 8. Envoi de l'email d'annulation au professionnel
    const cancellationData: ReservationCancellationEmailData = {
      to: recipient.email,
      guestFullName: recipient.fullName,
      reservationId: reservation.id,
      showTitle: show.title,
      showSlug: show.slug,
      companyName: company?.name ?? '',
      slotDateFormatted: formatDateFr(slots.date),
      slotTimeFormatted: formatTimeFr(slots.time),
      venueName: venue?.name ?? '',
      venueCity: venue?.city ?? '',
      venueAddress: venue?.address ?? null,
      venuePostalCode: venue?.postal_code ?? null,
      numPlaces: reservation.num_places,
      cancellationReason: reservation.cancellation_reason,
      managerName: manager.name,
      managerEmail: manager.email,
      managerPhone: manager.phone,
    };

    const emailResult = await sendReservationCancellationEmail(cancellationData);

    if (!emailResult.success) {
      logger.error(`${ROUTE} Échec envoi email pro`, {
        reservationId: payload.reservationId,
        error: emailResult.error,
      });
      // On continue pour tenter les notifications admin.
    }

    // 9. Notifications email admin (manager + custom recipient, non-bloquant)
    // Normalisation défensive : Supabase peut renvoyer `profiles` en tableau
    // pour une relation 1-1 selon le typage du select embed.
    const profilePhone = resolveProfile(reservation)?.phone ?? null;

    await sendAdminNotificationsForEvent({
      adminClient,
      eventSettingKey: 'email_notification_cancellation',
      baseNotifData: {
        eventType: 'cancellation',
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
        venueName: venue?.name ?? '',
        venueCity: venue?.city ?? '',
        venueAddress: venue?.address ?? null,
        venuePostalCode: venue?.postal_code ?? null,
        numPlaces: reservation.num_places,
        specialRequests: reservation.special_requests,
        reservationId: reservation.id,
        cancellationReason: reservation.cancellation_reason,
      },
      managerEmail: manager.email,
      managerName: manager.name,
      routeLabel: ROUTE,
    });

    // 10. Suppression Google Calendar (non-bloquant)
    if (payload.syncCalendar) {
      await maybeDeleteCalendarEvent({
        adminClient,
        googleCalendarEventId: reservation.google_calendar_event_id,
        routeLabel: ROUTE,
      });
    }

    // 11. Notification admin in-app (badge sidebar) — non-bloquant
    await createAdminNotification({
      type: 'cancellation',
      reservation_id: reservation.id,
      professional_name: recipient.fullName,
      show_title: show.title,
      slot_date: `${slots.date}T${slots.time}`,
      message: `${recipient.fullName} a annulé sa réservation pour « ${show.title} »`,
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
