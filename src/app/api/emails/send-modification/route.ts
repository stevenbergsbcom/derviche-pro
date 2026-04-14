/**
 * API Route - Envoi d'email de modification de créneau
 * POST /api/emails/send-modification
 *
 * Stratégie : le client envoie le reservationId + le newSlotId.
 * Le serveur récupère l'ancien créneau (depuis la réservation avant update),
 * le nouveau créneau, et envoie l'email au pro + notif manager si activée.
 *
 * L'envoi est non-bloquant : un échec email ne fait pas échouer la modification.
 *
 * Sécurité :
 * - Rate limiting : 20 req / 1h par IP (anti-spam emails)
 * - Validation du payload entrant (Zod)
 * - Vérification que l'utilisateur connecté est propriétaire de la réservation
 *   (ou admin/super-admin)
 * - La clé API Resend reste côté serveur
 * - Vérification des préférences de notification admin avant envoi
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  sendReservationModificationEmail,
  sendAdminNotificationEmail,
  type ReservationModificationEmailData,
  type AdminNotificationEmailData,
} from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { updateCalendarEvent } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSystem } from '@/lib/services/logs';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import type { UserRole } from '@/types/database';
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api';

// ============================================
// VALIDATION SCHEMA
// ============================================

const sendModificationSchema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
  oldSlotId: z.string().uuid('ID de créneau invalide'),
  syncCalendar: z.boolean().optional().default(true),
});

type SendModificationPayload = z.infer<typeof sendModificationSchema>;

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
  guest_structure: string | null;
  comments: string | null;
  google_calendar_event_id: string | null;
  user_id: string | null;
  profiles: { email: string; first_name: string | null; last_name: string | null } | null;
  slots: {
    id: string;
    date: string;
    time: string;
    venues: { name: string; city: string } | null;
    shows: {
      title: string;
      slug: string;
      duration_minutes: number | null;
      derviche_manager_id: string | null;
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

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting (anti-spam emails)
    const rl = await checkRateLimit('emails', request);
    if (!rl.success) {
      void logSystem('rate_limit_blocked', 'warning', {
        route: '/api/emails/send-modification',
        identifier: rl.identifier,
        limit: rl.limit,
      });
      return rateLimitResponse(rl);
    }

    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendModificationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn('[API /emails/send-modification] Payload invalide', {
        errors: parseResult.error.flatten(),
      });
      return errorResponse('Données invalides');
    }

    const payload: SendModificationPayload = parseResult.data;

    // 2. Vérifier l'authentification
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      logger.warn('[API /emails/send-modification] Utilisateur non authentifié');
      return unauthorizedResponse();
    }

    // 3. Client service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /emails/send-modification] SUPABASE_SERVICE_ROLE_KEY manquant');
      return serverErrorResponse('Configuration serveur manquante');
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Récupérer la réservation avec le NOUVEAU créneau (déjà mis à jour en DB)
    const { data: reservationRaw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
        num_places,
        status,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_structure,
        comments,
        google_calendar_event_id,
        user_id,
        profiles:user_id (
          email,
          first_name,
          last_name
        ),
        slots!inner (
          id,
          date,
          time,
          hosted_by_id,
          venues (
            name,
            city
          ),
          shows!inner (
            title,
            slug,
            duration_minutes,
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
      logger.warn('[API /emails/send-modification] Réservation introuvable', {
        reservationId: payload.reservationId,
      });
      return notFoundResponse('Réservation introuvable');
    }

    const reservation = reservationRaw as unknown as ReservationWithDetails;

    // 5. Vérifier l'autorisation (propriétaire ou admin)
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = userRoleData?.role as UserRole | undefined;
    const isFullAdmin = userRole === 'super-admin' || userRole === 'admin';
    const isOwner = reservation.user_id === user.id;

    if (!isFullAdmin && !isOwner && userRole !== 'externe') {
      logger.warn('[API /emails/send-modification] Accès refusé', {
        reservationId: payload.reservationId,
        userId: user.id,
      });
      return forbiddenResponse('Accès refusé');
    }

    // 5b. Si externe : vérifier qu'il est assigné au spectacle via slots.hosted_by_id
    if (userRole === 'externe' && !isOwner) {
      const slotsData = reservation.slots as ReservationWithDetails['slots'];
      const hostedById = (slotsData as unknown as { hosted_by_id: string | null }).hosted_by_id;

      if (hostedById !== user.id) {
        logger.warn('[API /emails/send-modification] Externe non assigné à ce spectacle', {
          userId: user.id,
          reservationId: payload.reservationId,
        });
        return forbiddenResponse('Accès refusé');
      }
    }

    // 6. Récupérer l'ANCIEN créneau (avant modification)
    const { data: oldSlotRaw, error: oldSlotError } = await adminClient
      .from('slots')
      .select('id, date, time, venues(name, city)')
      .eq('id', payload.oldSlotId)
      .maybeSingle();

    if (oldSlotError || !oldSlotRaw) {
      logger.warn('[API /emails/send-modification] Ancien créneau introuvable', {
        oldSlotId: payload.oldSlotId,
      });
      return notFoundResponse('Ancien créneau introuvable');
    }

    const oldSlot = oldSlotRaw as unknown as SlotDetails;

    // 7. Déterminer le destinataire
    const profileData = Array.isArray(reservation.profiles)
      ? reservation.profiles[0]
      : reservation.profiles;

    const recipientEmail = reservation.guest_email ?? profileData?.email;
    const recipientFirstName = reservation.guest_first_name ?? profileData?.first_name ?? '';
    const recipientLastName = reservation.guest_last_name ?? profileData?.last_name ?? '';
    const recipientFullName =
      `${recipientFirstName} ${recipientLastName}`.trim() || 'Cher professionnel';

    if (!recipientEmail) {
      logger.warn('[API /emails/send-modification] Aucun email destinataire', {
        reservationId: payload.reservationId,
      });
      return errorResponse('Email destinataire introuvable', 422);
    }

    // 8. Récupérer le manager Derviche
    const slots = reservation.slots as ReservationWithDetails['slots'];
    const show = slots.shows;
    const newVenue = slots.venues;
    const company = show.companies;

    let managerName: string | null = null;
    let managerEmail: string | null = null;
    let managerPhone: string | null = null;

    // Requête unique pour toutes les infos du manager
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

    // 9. Envoyer l'email de modification au professionnel

    const modificationData: ReservationModificationEmailData = {
      to: recipientEmail,
      guestFullName: recipientFullName,
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
      numPlaces: reservation.num_places,
      managerName:  managerName,
      managerEmail: managerEmail,
      managerPhone: managerPhone,
    };

    const emailResult = await sendReservationModificationEmail(modificationData);

    if (!emailResult.success) {
      logger.error('[API /emails/send-modification] Échec envoi email pro', {
        reservationId: payload.reservationId,
        error: emailResult.error,
      });
    }

    // 10. Vérifier les préférences de notification + notifier les destinataires configurés
    const isBooleanSettingTrue = (val: unknown): boolean =>
      val === true || val === 'true' || String(val) === 'true';

    const { data: notifSettings } = await adminClient
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'email_notification_modification',
        'email_notification_send_to_manager',
        'email_notification_custom_recipient',
      ]);

    const settingsMap = Object.fromEntries(
      (notifSettings ?? []).map((s) => [s.key, s.value])
    );

    const notifEnabled = isBooleanSettingTrue(settingsMap.email_notification_modification);
    const sendToManager = isBooleanSettingTrue(settingsMap.email_notification_send_to_manager ?? true);
    const customRecipient = typeof settingsMap.email_notification_custom_recipient === 'string'
      ? settingsMap.email_notification_custom_recipient.trim()
      : '';

    if (notifEnabled && (sendToManager || customRecipient)) {
      const baseNotifData: Omit<AdminNotificationEmailData, 'to' | 'adminName'> = {
        eventType: 'modification',
        guestFullName: recipientFullName,
        guestEmail: recipientEmail,
        guestStructure: reservation.guest_structure,
        showTitle: show.title,
        slotDateFormatted: formatDateFr(slots.date),
        slotTimeFormatted: formatTimeFr(slots.time),
        venueName: newVenue?.name ?? '',
        numPlaces: reservation.num_places,
        reservationId: reservation.id,
      };

      if (sendToManager && managerEmail) {
        await sendAdminNotificationEmail({
          ...baseNotifData,
          to: managerEmail,
          adminName: managerName ?? managerEmail,
        }).catch((err) => {
          logger.error('[API /emails/send-modification] Erreur notif manager', { managerEmail, err });
        });
      }

      if (customRecipient) {
        await sendAdminNotificationEmail({
          ...baseNotifData,
          to: customRecipient,
          adminName: 'Administrateur',
        }).catch((err) => {
          logger.error('[API /emails/send-modification] Erreur notif adresse personnalisée', { customRecipient, err });
        });
      }
    }

    // 11. Mettre à jour l'événement Google Calendar (non-bloquant)
    if (payload.syncCalendar) {
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
            .eq('key', 'google_calendar_notify_on_modification')
            .maybeSingle();

          await updateCalendarEvent(
            reservation.google_calendar_event_id,
            {
              showTitle:             show.title,
              guestFullName:         recipientFullName,
              guestStructure:        reservation.guest_structure,
              guestEmail:            recipientEmail,
              reservationId:         reservation.id,
              guestComment:          reservation.comments,
              managerName,
              managerPhone,
              managerEmail,
              numPlaces:             reservation.num_places,
              slotDate:              slots.date,
              slotTime:              slots.time,
              durationMinutes:       show.duration_minutes,
              venueName:             newVenue?.name ?? '',
              venueCity:             newVenue?.city ?? '',
              sendEmailNotification: isBoolTrue(notifPref?.value),
            }
          );
        }
      } catch (calErr) {
        logger.error('[API /emails/send-modification] Exception Calendar (non-bloquant)', { calErr });
      }
    }

    // 12. Créer la notification admin en base (badge sidebar)
    // Non-bloquant : createAdminNotification gère ses propres erreurs
    await createAdminNotification({
      type: 'modification',
      reservation_id: reservation.id,
      professional_name: recipientFullName,
      show_title: show.title,
      slot_date: `${slots.date}T${slots.time}`,
      message: `${recipientFullName} a modifié son créneau pour « ${show.title} »`,
    });

    return successResponse({
      success: emailResult.success,
      messageId: emailResult.messageId,
    });
  } catch (err) {
    logger.error('[API /emails/send-modification] Exception', { err });
    return serverErrorResponse();
  }
}
