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
 * - Validation du payload entrant (Zod)
 * - Vérification que l'utilisateur connecté est bien lié à la réservation
 *   (propriétaire, ou admin/super-admin)
 * - La clé API Resend reste côté serveur
 * - Vérification des préférences de notification admin avant envoi
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  sendReservationCancellationEmail,
  sendAdminNotificationEmail,
  type ReservationCancellationEmailData,
  type AdminNotificationEmailData,
} from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { deleteCalendarEvent } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import type { UserRole } from '@/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const sendCancellationSchema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
});

type SendCancellationPayload = z.infer<typeof sendCancellationSchema>;

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
  guest_structure: string | null;
  google_calendar_event_id: string | null;
  user_id: string | null;
  profiles: { email: string; first_name: string | null; last_name: string | null } | null;
  slots: {
    date: string;
    time: string;
    venues: { name: string; city: string } | null;
    shows: {
      title: string;
      slug: string;
      derviche_manager_id: string | null;
      companies: { name: string } | null;
    };
  };
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendCancellationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn('[API /emails/send-cancellation] Payload invalide', {
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      );
    }

    const payload: SendCancellationPayload = parseResult.data;

    // 2. Vérifier l'authentification de l'utilisateur
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      logger.warn('[API /emails/send-cancellation] Utilisateur non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 3. Initialiser le client service role pour récupérer toutes les données
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /emails/send-cancellation] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Récupérer la réservation avec tous les détails nécessaires
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
        guest_structure,
        google_calendar_event_id,
        user_id,
        profiles:user_id (
          email,
          first_name,
          last_name
        ),
        slots!inner (
          date,
          time,
          venues (
            name,
            city
          ),
          shows!inner (
            title,
            slug,
            derviche_manager_id,
            companies:company_id (
              name
            )
          )
        )
      `)
      .eq('id', payload.reservationId)
      .maybeSingle();

    if (reservationError || !reservationRaw) {
      logger.warn('[API /emails/send-cancellation] Réservation introuvable', {
        reservationId: payload.reservationId,
      });
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    const reservation = reservationRaw as unknown as ReservationWithDetails;

    // 5. Vérifier que l'utilisateur est autorisé (propriétaire ou admin)
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = userRoleData?.role as UserRole | undefined;
    const isAdmin = userRole === 'super-admin' || userRole === 'admin';
    const isOwner = reservation.user_id === user.id;

    if (!isAdmin && !isOwner) {
      logger.warn('[API /emails/send-cancellation] Accès refusé', {
        reservationId: payload.reservationId,
        userId: user.id,
      });
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 6. Vérifier que la réservation est bien annulée
    if (reservation.status !== 'cancelled') {
      logger.warn('[API /emails/send-cancellation] Réservation non annulée', {
        reservationId: payload.reservationId,
        status: reservation.status,
      });
      return NextResponse.json({ success: false, error: 'La réservation n\'est pas annulée' }, { status: 422 });
    }

    // 7. Déterminer l'email et le nom du destinataire
    const profileData = Array.isArray(reservation.profiles)
      ? reservation.profiles[0]
      : reservation.profiles;

    const recipientEmail = reservation.guest_email ?? profileData?.email;
    const recipientFirstName = reservation.guest_first_name ?? profileData?.first_name ?? '';
    const recipientLastName = reservation.guest_last_name ?? profileData?.last_name ?? '';
    const recipientFullName =
      `${recipientFirstName} ${recipientLastName}`.trim() || 'Cher professionnel';

    if (!recipientEmail) {
      logger.warn('[API /emails/send-cancellation] Aucun email destinataire trouvé', {
        reservationId: payload.reservationId,
      });
      return NextResponse.json({ success: false, error: 'Email destinataire introuvable' }, { status: 422 });
    }

    // 8. Récupérer les infos du manager Derviche (depuis shows.derviche_manager_id)
    const slots = reservation.slots as ReservationWithDetails['slots'];
    const show = slots.shows;
    const venue = slots.venues;
    const company = show.companies;

    let managerName: string | null = null;
    let managerEmail: string | null = null;
    let managerPhone: string | null = null;

    if (show.derviche_manager_id) {
      const { data: managerProfile } = await adminClient
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', show.derviche_manager_id)
        .maybeSingle();

      if (managerProfile) {
        managerName =
          `${managerProfile.first_name ?? ''} ${managerProfile.last_name ?? ''}`.trim() || null;
        managerEmail = managerProfile.email ?? null;
        managerPhone = (managerProfile as { phone?: string | null }).phone ?? null;
      }
    }

    // 9. Envoyer l'email d'annulation au professionnel
    const cancellationData: ReservationCancellationEmailData = {
      to: recipientEmail,
      guestFullName: recipientFullName,
      reservationId: reservation.id,
      showTitle: show.title,
      showSlug: show.slug,
      companyName: company?.name ?? '',
      slotDateFormatted: formatDateFr(slots.date),
      slotTimeFormatted: formatTimeFr(slots.time),
      venueName: venue?.name ?? '',
      venueCity: venue?.city ?? '',
      numPlaces: reservation.num_places,
      cancellationReason: reservation.cancellation_reason,
      managerName,
      managerEmail,
      managerPhone,
    };

    const emailResult = await sendReservationCancellationEmail(cancellationData);

    if (!emailResult.success) {
      logger.error('[API /emails/send-cancellation] Échec envoi email pro', {
        reservationId: payload.reservationId,
        error: emailResult.error,
      });
      // On continue pour tenter les notifications admin
    }

    // 10. Vérifier les préférences de notification + envoyer au manager uniquement
    const { data: notifPrefData } = await adminClient
      .from('app_settings')
      .select('value')
      .eq('key', 'email_notification_cancellation')
      .maybeSingle();

    const isBooleanSettingTrue = (val: unknown): boolean =>
      val === true || val === 'true' || String(val) === 'true';

    const notifEnabled = isBooleanSettingTrue(notifPrefData?.value);

    // 11. Notifier uniquement le manager Derviche lié au spectacle
    if (notifEnabled && managerEmail) {
      const managerFullName = managerName ?? managerEmail;

      const notifData: AdminNotificationEmailData = {
        to: managerEmail,
        adminName: managerFullName,
        eventType: 'cancellation',
        guestFullName: recipientFullName,
        guestEmail: recipientEmail,
        guestStructure: reservation.guest_structure,
        showTitle: show.title,
        slotDateFormatted: formatDateFr(slots.date),
        slotTimeFormatted: formatTimeFr(slots.time),
        venueName: venue?.name ?? '',
        numPlaces: reservation.num_places,
        reservationId: reservation.id,
        cancellationReason: reservation.cancellation_reason,
      };

      await sendAdminNotificationEmail(notifData).catch((err) => {
        logger.error('[API /emails/send-cancellation] Erreur notif manager', {
          managerEmail,
          err,
        });
      });
    } else if (notifEnabled && !managerEmail) {
      logger.warn('[API /emails/send-cancellation] Notification activée mais aucun manager assigné au spectacle', {
        showTitle: show.title,
        reservationId: payload.reservationId,
      });
    }

    // 12. Supprimer l'événement Google Calendar (non-bloquant)
    try {
      const isBoolTrue = (v: unknown) => v === true || v === 'true';

      const { data: calPref } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'google_calendar_enabled')
        .maybeSingle();

      if (isBoolTrue(calPref?.value) && reservation.google_calendar_event_id) {
        const { data: notifPref } = await adminClient
          .from('app_settings')
          .select('value')
          .eq('key', 'google_calendar_notify_on_cancellation')
          .maybeSingle();

        await deleteCalendarEvent(
          reservation.google_calendar_event_id,
          isBoolTrue(notifPref?.value)
        );
      }
    } catch (calErr) {
      logger.error('[API /emails/send-cancellation] Exception Calendar (non-bloquant)', { calErr });
    }

    // 13. Créer la notification admin en base (badge sidebar)
    // Non-bloquant : createAdminNotification gère ses propres erreurs
    await createAdminNotification({
      type: 'cancellation',
      reservation_id: reservation.id,
      professional_name: recipientFullName,
      show_title: show.title,
      slot_date: `${slots.date}T${slots.time}`,
      message: `${recipientFullName} a annulé sa réservation pour « ${show.title} »`,
    });

    return NextResponse.json({
      success: emailResult.success,
      messageId: emailResult.messageId,
    });
  } catch (err) {
    logger.error('[API /emails/send-cancellation] Exception', { err });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
