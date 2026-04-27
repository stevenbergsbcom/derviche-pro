/**
 * API Route - Envoi d'email de confirmation de réservation
 * POST /api/emails/send-confirmation
 *
 * Appelée côté client après une réservation réussie.
 * L'envoi est non-bloquant : un échec email ne fait pas échouer la réservation.
 *
 * Sécurité :
 * - Rate limiting : 20 req / 1h par IP (anti-spam emails)
 * - Validation stricte du payload entrant (Zod)
 * - Vérification que la réservation existe en base (via service role)
 * - Vérification que l'email correspond à la réservation
 * - Ne retourne jamais les détails techniques d'erreur au client
 * - La clé API Resend reste côté serveur (variable d'environnement)
 *
 * Refacto S198 : factorisation helpers via `@/lib/services/email-routes`.
 */

import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendReservationConfirmationEmail } from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { errorResponse, successResponse, serverErrorResponse } from '@/lib/api';
import {
  withEmailRateLimit,
  resolveProfile,
  loadManager,
  sendAdminNotificationsForEvent,
  maybeCreateCalendarEvent,
} from '@/lib/services/email-routes';

// ============================================
// VALIDATION SCHEMA
// ============================================

const sendConfirmationSchema = z.object({
  to: z.string().email('Email destinataire invalide'),
  guestFullName: z.string().min(1).max(200),
  reservationCode: z.string().min(1).max(20),
  reservationId: z.string().uuid('ID de réservation invalide'),
  showTitle: z.string().min(1).max(300),
  showSlug: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  slotDateFormatted: z.string().min(1).max(100),
  slotTimeFormatted: z.string().min(1).max(20),
  venueName: z.string().min(1).max(200),
  venueCity: z.string().max(100).default(''),
  numPlaces: z.number().int().min(1).max(10),
});

// ============================================
// TYPE INTERNE (reservation consolidée)
// ============================================

interface ReservationFull {
  id: string;
  num_places: number;
  guest_email: string | null;
  guest_phone: string | null;
  guest_structure: string | null;
  guest_function: string | null;
  guest_afc_number: string | null;
  special_requests: string | null;
  user_id: string | null;
  profiles: { email: string | null; phone: string | null } | null;
  slots: {
    date: string;
    time: string;
    venues: {
      name: string;
      city: string;
      address: string | null;
      postal_code: string | null;
    } | null;
    shows: {
      title: string;
      duration_minutes: number | null;
      derviche_manager_id: string | null;
      derviche_site_url: string | null;
      companies: { name: string } | null;
    };
  };
}

const ROUTE = '[API /emails/send-confirmation]';

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting (anti-spam emails)
    const limited = await withEmailRateLimit(request, '/api/emails/send-confirmation');
    if (limited) return limited;

    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendConfirmationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn(`${ROUTE} Payload invalide`, { errors: parseResult.error.flatten() });
      return errorResponse('Données invalides');
    }
    const payload = parseResult.data;

    // 2. Client admin (service role)
    const adminClient = createAdminClient();

    // 3. Charger la réservation complète en une requête
    const { data: reservationRaw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
        num_places,
        guest_email,
        guest_phone,
        guest_structure,
        guest_function,
        guest_afc_number,
        special_requests,
        user_id,
        profiles:user_id (
          email,
          phone
        ),
        slots!inner (
          date,
          time,
          venues (
            name,
            city,
            address,
            postal_code
          ),
          shows!inner (
            title,
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
      // Statut 200 pour ne pas exposer l'existence de la ressource au client.
      return errorResponse('Réservation introuvable', 200);
    }

    const reservation = reservationRaw as unknown as ReservationFull;
    const slots = reservation.slots;
    const show = slots.shows;
    const venue = slots.venues;

    // 4. Vérifier que l'email correspond à la réservation
    // Normalisation défensive : `profiles` peut être un tableau.
    const profile = resolveProfile(reservation);
    const profileEmail = profile?.email ?? null;

    const emailMatch =
      reservation.guest_email?.toLowerCase() === payload.to.toLowerCase() ||
      profileEmail?.toLowerCase() === payload.to.toLowerCase();

    if (!emailMatch) {
      logger.warn(`${ROUTE} Email ne correspond pas à la réservation`, {
        reservationId: payload.reservationId,
      });
      return errorResponse('Email invalide', 200);
    }

    // 5. Notification admin in-app (badge) — AVANT l'envoi email pour
    //    garantir la trace même si Resend tombe.
    const slotDateIso = `${slots.date}T${slots.time}`;
    await createAdminNotification({
      type: 'new_reservation',
      reservation_id: payload.reservationId,
      professional_name: payload.guestFullName,
      show_title: payload.showTitle,
      slot_date: slotDateIso,
      message: `${payload.guestFullName} a réservé ${payload.numPlaces} place(s) pour « ${payload.showTitle} »`,
    });

    // 6. Charger le manager Derviche du spectacle
    const manager = await loadManager(adminClient, show.derviche_manager_id);

    // 7. Envoyer l'email de confirmation
    const result = await sendReservationConfirmationEmail({
      ...payload,
      venueAddress: venue?.address ?? null,
      venuePostalCode: venue?.postal_code ?? null,
      dervisheSiteUrl: show.derviche_site_url ?? null,
      userId: reservation.user_id,
      managerName: manager.name,
      managerEmail: manager.email,
      managerPhone: manager.phone,
    });

    if (!result.success) {
      logger.error(`${ROUTE} Échec envoi`, {
        reservationId: payload.reservationId,
        error: result.error,
      });
      return errorResponse("Erreur lors de l'envoi", 200);
    }

    // 8. Notifications email admin (manager + custom recipient, non-bloquant)
    const profilePhone = profile?.phone ?? null;

    await sendAdminNotificationsForEvent({
      adminClient,
      eventSettingKey: 'email_notification_new_reservation',
      baseNotifData: {
        eventType: 'new_reservation',
        guestFullName: payload.guestFullName,
        guestEmail: payload.to,
        guestStructure: reservation.guest_structure,
        // Téléphone : champ guest prioritaire, sinon profil pro lié.
        guestPhone: reservation.guest_phone ?? profilePhone,
        guestFunction: reservation.guest_function,
        guestAfcNumber: reservation.guest_afc_number,
        userId: reservation.user_id,
        showTitle: payload.showTitle,
        companyName: show.companies?.name ?? payload.companyName ?? '',
        slotDateFormatted: payload.slotDateFormatted,
        slotTimeFormatted: payload.slotTimeFormatted,
        venueName: payload.venueName,
        venueCity: venue?.city ?? payload.venueCity ?? '',
        venueAddress: venue?.address ?? null,
        venuePostalCode: venue?.postal_code ?? null,
        numPlaces: payload.numPlaces,
        specialRequests: reservation.special_requests,
        reservationId: payload.reservationId,
      },
      managerEmail: manager.email,
      managerName: manager.name,
      routeLabel: ROUTE,
    });

    // 9. Création de l'événement Google Calendar (non-bloquant)
    await maybeCreateCalendarEvent({
      adminClient,
      reservationId: payload.reservationId,
      eventData: {
        showTitle: payload.showTitle,
        guestFullName: payload.guestFullName,
        guestStructure: reservation.guest_structure,
        guestEmail: payload.to,
        reservationId: payload.reservationId,
        guestComment: reservation.special_requests,
        managerName: manager.name,
        managerPhone: manager.phone,
        managerEmail: manager.email,
        numPlaces: payload.numPlaces,
        slotDate: slots.date,
        slotTime: slots.time,
        durationMinutes: show.duration_minutes,
        venueName: venue?.name ?? payload.venueName,
        // Fallback robuste : la valeur DB prime sur le payload client
        // (cohérent avec la branche notif admin ci-dessus).
        venueCity: venue?.city ?? payload.venueCity,
        sendEmailNotification: true,
      },
      routeLabel: ROUTE,
    });

    return successResponse({ messageId: result.messageId });
  } catch (err) {
    logger.error(`${ROUTE} Exception`, { err });
    return serverErrorResponse();
  }
}
