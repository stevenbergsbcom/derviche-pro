/**
 * API Route - Envoi email confirmation par reservationId uniquement
 * POST /api/emails/send-confirmation-by-id
 *
 * Version allégée de send-confirmation destinée aux actions admin/externe :
 * le serveur récupère toutes les données nécessaires depuis la DB.
 *
 * Sécurité :
 * - Authentification requise (admin, super-admin ou externe assigné)
 * - Vérification rôle en base via service role
 * - Ne retourne jamais les détails techniques d'erreur au client
 *
 * Refacto S198 : factorisation via `@/lib/services/email-routes`.
 */

import type { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendReservationConfirmationEmail } from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import {
  withEmailRateLimit,
  resolveRecipient,
  resolveProfile,
  loadManager,
  loadUserRole,
  authorizeEmailRouteAccess,
  sendAdminNotificationsForEvent,
  maybeCreateCalendarEvent,
} from '@/lib/services/email-routes';

// ============================================
// VALIDATION SCHEMA
// ============================================

const schema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
  syncCalendar: z.boolean().optional().default(true),
  skipEmail: z.boolean().optional().default(false),
});

// ============================================
// TYPES INTERNES
// ============================================

interface ReservationFull {
  id: string;
  num_places: number;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_structure: string | null;
  guest_function: string | null;
  guest_afc_number: string | null;
  special_requests: string | null;
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
    shows: {
      title: string;
      slug: string;
      duration_minutes: number | null;
      derviche_manager_id: string | null;
      derviche_site_url: string | null;
      companies: { name: string } | null;
    };
    venues: {
      name: string;
      city: string;
      address: string | null;
      postal_code: string | null;
    } | null;
  };
}

const ROUTE = '[API /emails/send-confirmation-by-id]';

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting
    const limited = await withEmailRateLimit(
      request,
      '/api/emails/send-confirmation-by-id',
    );
    if (limited) return limited;

    // 1. Validation payload
    const rawBody: unknown = await request.json();
    const parseResult = schema.safeParse(rawBody);
    if (!parseResult.success) {
      return errorResponse('Données invalides');
    }
    const { reservationId, syncCalendar, skipEmail } = parseResult.data;

    // 2. Authentification
    const userClient = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    // 3. Admin client + chargement de la réservation
    const adminClient = createAdminClient();

    const { data: raw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
        num_places,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_structure,
        guest_function,
        guest_afc_number,
        special_requests,
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
          shows!inner (
            title,
            slug,
            duration_minutes,
            derviche_manager_id,
            derviche_site_url,
            companies:company_id ( name )
          ),
          venues ( name, city, address, postal_code )
        )
      `)
      .eq('id', reservationId)
      .maybeSingle();

    if (reservationError || !raw) {
      logger.warn(`${ROUTE} Réservation introuvable`, { reservationId });
      return notFoundResponse('Réservation introuvable');
    }

    const reservation = raw as unknown as ReservationFull;
    const slots = reservation.slots;
    const show = slots.shows;
    const venue = slots.venues;
    const company = show.companies;

    // 4. Autorisation — full-admin ou externe assigné uniquement
    //    (pas d'owner : cette route est spécifiquement pour les actions admin)
    const userRole = await loadUserRole(adminClient, user.id);
    const accessDenied = await authorizeEmailRouteAccess(
      adminClient,
      {
        userId: user.id,
        userRole,
        reservationUserId: reservation.user_id,
        hostedById: slots.hosted_by_id,
      },
      { allowFullAdmin: true, allowExterne: true },
      ROUTE,
    );
    if (accessDenied) return accessDenied;

    // 5. Destinataire
    const recipient = resolveRecipient(reservation);
    if (!recipient) {
      logger.warn(`${ROUTE} Aucun email destinataire`, { reservationId });
      return errorResponse('Email destinataire introuvable', 422);
    }

    // 6. Manager
    const manager = await loadManager(adminClient, show.derviche_manager_id);

    // 7. Envoi de l'email de confirmation (sauf si skipEmail)
    let emailResult: { success: boolean; messageId?: string; error?: string } = {
      success: true,
    };

    if (!skipEmail) {
      emailResult = await sendReservationConfirmationEmail({
        to: recipient.email,
        guestFullName: recipient.fullName,
        reservationCode: reservation.id.slice(0, 8).toUpperCase(),
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
        dervisheSiteUrl: show.derviche_site_url ?? null,
        userId: reservation.user_id,
        managerName: manager.name,
        managerEmail: manager.email,
        managerPhone: manager.phone,
      });

      if (!emailResult.success) {
        logger.error(`${ROUTE} Échec envoi`, {
          reservationId,
          error: emailResult.error,
        });
      }

      // 8. Notifications email admin (non-bloquant)
      // Normalisation défensive : `profiles` peut être un tableau.
      const profilePhone = resolveProfile(reservation)?.phone ?? null;

      await sendAdminNotificationsForEvent({
        adminClient,
        eventSettingKey: 'email_notification_new_reservation',
        baseNotifData: {
          eventType: 'new_reservation',
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
        },
        managerEmail: manager.email,
        managerName: manager.name,
        routeLabel: ROUTE,
      });
    }

    // 9. Création Google Calendar (non-bloquant) — uniquement si on a bien
    //    envoyé un email (pas en cas de skipEmail).
    if (syncCalendar && !skipEmail) {
      await maybeCreateCalendarEvent({
        adminClient,
        reservationId: reservation.id,
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
          venueName: venue?.name ?? '',
          venueCity: venue?.city ?? '',
          sendEmailNotification: true,
        },
        routeLabel: ROUTE,
      });
    }

    // 10. Notification admin in-app (badge sidebar) — non-bloquant
    // NB : contrairement à `send-confirmation` qui crée la notif AVANT
    // l'envoi email (pour garantir la trace même si Resend échoue),
    // cette route historique la crée EN FIN de flux. Comportement
    // préservé tel quel lors de la refacto S198 ; il est aussi créé
    // lorsque skipEmail=true — c'est le comportement attendu côté admin
    // (badge présent même si aucun mail n'est envoyé).
    await createAdminNotification({
      type: 'new_reservation',
      reservation_id: reservation.id,
      professional_name: recipient.fullName,
      show_title: show.title,
      slot_date: `${slots.date}T${slots.time}`,
      message: `${recipient.fullName} a réservé ${reservation.num_places} place(s) pour « ${show.title} »`,
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
