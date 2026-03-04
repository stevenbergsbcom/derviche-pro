/**
 * API Route - Envoi email confirmation par reservationId uniquement
 * POST /api/emails/send-confirmation-by-id
 *
 * Version allégée de send-confirmation destinée aux actions admin/externe :
 * le serveur récupère toutes les données nécessaires depuis la DB.
 *
 * Sécurité :
 * - Authentification requise (admin, super-admin ou externe)
 * - Vérification rôle en base via service role
 * - Ne retourne jamais les détails techniques d'erreur au client
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  sendReservationConfirmationEmail,
  sendAdminNotificationEmail,
  type AdminNotificationEmailData,
} from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { createCalendarEvent } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import type { UserRole } from '@/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const schema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
  syncCalendar: z.boolean().optional().default(true),
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
  guest_structure: string | null;
  user_id: string | null;
  profiles: { email: string; first_name: string | null; last_name: string | null } | null;
  slots: {
    date: string;
    time: string;
    shows: {
      title: string;
      slug: string;
      duration_minutes: number | null;
      derviche_manager_id: string | null;
      companies: { name: string } | null;
    };
    venues: { name: string; city: string } | null;
  };
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Valider le body
    const rawBody: unknown = await request.json();
    const parseResult = schema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Données invalides' }, { status: 400 });
    }

    const { reservationId, syncCalendar } = parseResult.data;

    // 2. Vérifier l'authentification
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Client service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /emails/send-confirmation-by-id] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json({ success: false, error: 'Configuration serveur manquante' }, { status: 500 });
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Vérifier le rôle de l'utilisateur (admin, super-admin ou externe)
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = userRoleData?.role as UserRole | undefined;
    const isAuthorized =
      userRole === 'super-admin' ||
      userRole === 'admin' ||
      userRole === 'externe';

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 5a. Si externe : vérifier qu'il est bien assigné au spectacle de cette réservation
    if (userRole === 'externe') {
      // Récupérer le show_id de la réservation via son slot
      const { data: slotData } = await adminClient
        .from('reservations')
        .select('slots!inner ( show_id, hosted_by_id )')
        .eq('id', reservationId)
        .maybeSingle();

      type SlotCheck = { show_id: string; hosted_by_id: string | null };
      const rawSlot = (slotData as unknown as { slots: SlotCheck | SlotCheck[] }).slots;
      const slot: SlotCheck | null = rawSlot
        ? (Array.isArray(rawSlot) ? rawSlot[0] : rawSlot)
        : null;

      const isAssigned = slot?.hosted_by_id === user.id;

      if (!isAssigned) {
        logger.warn('[API /emails/send-confirmation-by-id] Externe non assigné à ce spectacle', {
          userId: user.id,
          reservationId,
        });
        return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
      }
    }

    // 5b. Récupérer la réservation complète
    const { data: raw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
        num_places,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_structure,
        user_id,
        profiles:user_id (
          email,
          first_name,
          last_name
        ),
        slots!inner (
          date,
          time,
          shows!inner (
            title,
            slug,
            duration_minutes,
            derviche_manager_id,
            companies:company_id ( name )
          ),
          venues ( name, city )
        )
      `)
      .eq('id', reservationId)
      .maybeSingle();

    if (reservationError || !raw) {
      logger.warn('[API /emails/send-confirmation-by-id] Réservation introuvable', { reservationId });
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    const reservation = raw as unknown as ReservationFull;

    // 6. Déterminer le destinataire
    const profileData = Array.isArray(reservation.profiles)
      ? reservation.profiles[0]
      : reservation.profiles;

    const recipientEmail = reservation.guest_email ?? profileData?.email;
    const recipientFirstName = reservation.guest_first_name ?? profileData?.first_name ?? '';
    const recipientLastName = reservation.guest_last_name ?? profileData?.last_name ?? '';
    const recipientFullName =
      `${recipientFirstName} ${recipientLastName}`.trim() || 'Cher professionnel';

    if (!recipientEmail) {
      logger.warn('[API /emails/send-confirmation-by-id] Aucun email destinataire', { reservationId });
      return NextResponse.json({ success: false, error: 'Email destinataire introuvable' }, { status: 422 });
    }

    const slots = reservation.slots as ReservationFull['slots'];
    const show = slots.shows;
    const venue = slots.venues;
    const company = show.companies;

    // 7. Récupérer le manager Derviche
    let managerName: string | null = null;
    let managerEmail: string | null = null;
    let managerPhone: string | null = null;

    if (show.derviche_manager_id) {
      const { data: mgr } = await adminClient
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', show.derviche_manager_id)
        .maybeSingle();

      if (mgr) {
        managerName = `${mgr.first_name ?? ''} ${mgr.last_name ?? ''}`.trim() || null;
        managerEmail = mgr.email ?? null;
        managerPhone = (mgr as unknown as { phone?: string | null }).phone ?? null;
      }
    }

    // 8. Envoyer l'email de confirmation au professionnel
    const emailResult = await sendReservationConfirmationEmail({
      to: recipientEmail,
      guestFullName: recipientFullName,
      reservationCode: reservation.id.slice(0, 8).toUpperCase(),
      reservationId: reservation.id,
      showTitle: show.title,
      showSlug: show.slug,
      companyName: company?.name ?? '',
      slotDateFormatted: formatDateFr(slots.date),
      slotTimeFormatted: formatTimeFr(slots.time),
      venueName: venue?.name ?? '',
      venueCity: venue?.city ?? '',
      numPlaces: reservation.num_places,
      managerName,
      managerEmail,
      managerPhone,
    });

    if (!emailResult.success) {
      logger.error('[API /emails/send-confirmation-by-id] Échec envoi', { reservationId, error: emailResult.error });
    }

    // 9. Notifier le manager DD si préférence activée
    try {
      const { data: notifPrefData } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'email_notification_new_reservation')
        .maybeSingle();

      const isBoolTrue = (v: unknown) => v === true || v === 'true' || String(v) === 'true';

      if (isBoolTrue(notifPrefData?.value) && managerEmail) {
        const notifData: AdminNotificationEmailData = {
          to: managerEmail,
          adminName: managerName ?? managerEmail,
          eventType: 'new_reservation',
          guestFullName: recipientFullName,
          guestEmail: recipientEmail,
          guestStructure: reservation.guest_structure,
          showTitle: show.title,
          slotDateFormatted: formatDateFr(slots.date),
          slotTimeFormatted: formatTimeFr(slots.time),
          venueName: venue?.name ?? '',
          numPlaces: reservation.num_places,
          reservationId: reservation.id,
        };

        await sendAdminNotificationEmail(notifData).catch((err) => {
          logger.error('[API /emails/send-confirmation-by-id] Erreur notif manager', { err });
        });
      }
    } catch (notifErr) {
      logger.error('[API /emails/send-confirmation-by-id] Exception notif manager (non-bloquant)', { notifErr });
    }

    // 10. Créer l'événement Google Calendar (non-bloquant)
    if (syncCalendar) {
      try {
        const isBoolTrue = (v: unknown) => v === true || v === 'true';

        const { data: calPref } = await adminClient
          .from('app_settings')
          .select('value')
          .eq('key', 'google_calendar_enabled')
          .maybeSingle();

        if (isBoolTrue(calPref?.value)) {
          const calResult = await createCalendarEvent({
            showTitle: show.title,
            guestFullName: recipientFullName,
            guestStructure: reservation.guest_structure,
            guestEmail: recipientEmail,
            reservationId: reservation.id,
            numPlaces: reservation.num_places,
            slotDate: slots.date,
            slotTime: slots.time,
            durationMinutes: show.duration_minutes,
            venueName: venue?.name ?? '',
            venueCity: venue?.city ?? '',
            sendEmailNotification: true,
          });

          if (calResult.success) {
            await adminClient
              .from('reservations')
              .update({ google_calendar_event_id: calResult.eventId })
              .eq('id', reservation.id);
          }
        }
      } catch (calErr) {
        logger.error('[API /emails/send-confirmation-by-id] Exception Calendar (non-bloquant)', { calErr });
      }
    }

    // 11. Notification admin en base (badge)
    await createAdminNotification({
      type: 'new_reservation',
      reservation_id: reservation.id,
      professional_name: recipientFullName,
      show_title: show.title,
      slot_date: `${slots.date}T${slots.time}`,
      message: `${recipientFullName} a réservé ${reservation.num_places} place(s) pour « ${show.title} »`,
    });

    return NextResponse.json({ success: emailResult.success, messageId: emailResult.messageId });

  } catch (err) {
    logger.error('[API /emails/send-confirmation-by-id] Exception', { err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
