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
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  sendReservationConfirmationEmail,
  sendAdminNotificationEmail,
  type AdminNotificationEmailData,
} from '@/lib/services/email';
import { createAdminNotification } from '@/lib/services/notifications';
import { createCalendarEvent } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSystem } from '@/lib/services/logs';
import { errorResponse, successResponse, serverErrorResponse } from '@/lib/api';

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

type SendConfirmationPayload = z.infer<typeof sendConfirmationSchema>;

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting (anti-spam emails)
    const rl = await checkRateLimit('emails', request);
    if (!rl.success) {
      void logSystem('rate_limit_blocked', 'warning', {
        route: '/api/emails/send-confirmation',
        identifier: rl.identifier,
        limit: rl.limit,
      });
      return rateLimitResponse(rl);
    }

    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendConfirmationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn('[API /emails/send-confirmation] Payload invalide', {
        errors: parseResult.error.flatten(),
      });
      return errorResponse('Données invalides');
    }

    const payload: SendConfirmationPayload = parseResult.data;

    // 2. Vérifier que la réservation existe et que l'email correspond
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /emails/send-confirmation] SUPABASE_SERVICE_ROLE_KEY manquant');
      return serverErrorResponse('Configuration serveur manquante');
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: reservation, error: reservationError } = await adminClient
      .from('reservations')
      .select('id, guest_email, user_id, profiles:user_id(email), slots!inner(date, time)')
      .eq('id', payload.reservationId)
      .maybeSingle();

    if (reservationError || !reservation) {
      logger.warn('[API /emails/send-confirmation] Réservation introuvable', {
        reservationId: payload.reservationId,
      });
      return errorResponse('Réservation introuvable', 200);
    }

    const reservationEmail = reservation.guest_email;
    const profileEmail = Array.isArray(reservation.profiles)
      ? reservation.profiles[0]?.email
      : (reservation.profiles as { email?: string } | null)?.email;

    const emailMatch =
      reservationEmail?.toLowerCase() === payload.to.toLowerCase() ||
      profileEmail?.toLowerCase() === payload.to.toLowerCase();

    if (!emailMatch) {
      logger.warn('[API /emails/send-confirmation] Email ne correspond pas à la réservation', {
        reservationId: payload.reservationId,
      });
      return errorResponse('Email invalide', 200);
    }

    // 3. Créer la notification admin en base (badge sidebar) — non bloquant
    // Placé AVANT l'envoi email pour garantir la notification même si Resend échoue
    // slot_date doit être au format ISO (TIMESTAMPTZ) — pas la date formatée française
    const reservationSlot = (reservation as unknown as {
      slots: { date: string; time: string };
    }).slots;
    const slotDateIso = reservationSlot
      ? `${reservationSlot.date}T${reservationSlot.time}`
      : null;

    await createAdminNotification({
      type: 'new_reservation',
      reservation_id: payload.reservationId,
      professional_name: payload.guestFullName,
      show_title: payload.showTitle,
      slot_date: slotDateIso,
      message: `${payload.guestFullName} a réservé ${payload.numPlaces} place(s) pour « ${payload.showTitle} »`,
    });

    // 4. Récupérer le manager + Envoyer l'email de confirmation
    let confirmManagerName: string | null = null;
    let confirmManagerEmail: string | null = null;
    let confirmManagerPhone: string | null = null;

    try {
      const { data: showData } = await adminClient
        .from('reservations')
        .select('slots!inner(shows!inner(derviche_manager_id))')
        .eq('id', payload.reservationId)
        .maybeSingle();

      const managerId = (showData as unknown as {
        slots: { shows: { derviche_manager_id: string | null } };
      } | null)?.slots?.shows?.derviche_manager_id;

      if (managerId) {
        const { data: mgr } = await adminClient
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', managerId)
          .maybeSingle();

        if (mgr) {
          confirmManagerName  = `${mgr.first_name ?? ''} ${mgr.last_name ?? ''}`.trim() || null;
          confirmManagerEmail = mgr.email ?? null;
          confirmManagerPhone = (mgr as unknown as { phone?: string | null }).phone ?? null;
        }
      }
    } catch (mgrErr) {
      logger.warn('[API /emails/send-confirmation] Erreur récupération manager (non-bloquant)', { mgrErr });
    }

    const result = await sendReservationConfirmationEmail({
      ...payload,
      managerName:  confirmManagerName,
      managerEmail: confirmManagerEmail,
      managerPhone: confirmManagerPhone,
    });

    if (!result.success) {
      logger.error('[API /emails/send-confirmation] Échec envoi', {
        reservationId: payload.reservationId,
        error: result.error,
      });
      return errorResponse("Erreur lors de l'envoi", 200);
    }

    // 5. Notifier les destinataires configurés (si préférence activée)
    try {
      const isBooleanSettingTrue = (val: unknown): boolean =>
        val === true || val === 'true' || String(val) === 'true';

      // Lire les 3 settings en une seule requête
      const { data: notifSettings } = await adminClient
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'email_notification_new_reservation',
          'email_notification_send_to_manager',
          'email_notification_custom_recipient',
        ]);

      const settingsMap = Object.fromEntries(
        (notifSettings ?? []).map((s) => [s.key, s.value])
      );

      const notifEnabled = isBooleanSettingTrue(settingsMap.email_notification_new_reservation);
      const sendToManager = isBooleanSettingTrue(settingsMap.email_notification_send_to_manager ?? true);
      const customRecipient = typeof settingsMap.email_notification_custom_recipient === 'string'
        ? settingsMap.email_notification_custom_recipient.trim()
        : '';

      if (notifEnabled && (sendToManager || customRecipient)) {
        // Récupérer les détails de la réservation pour le contenu de l'email
        const { data: reservationDetails } = await adminClient
          .from('reservations')
          .select(`
            guest_structure,
            slots!inner (
              date,
              time,
              venues ( name ),
              shows!inner (
                title,
                derviche_manager_id
              )
            )
          `)
          .eq('id', payload.reservationId)
          .maybeSingle();

        const slots = (reservationDetails?.slots as unknown) as {
          date: string;
          time: string;
          venues: { name: string } | null;
          shows: { title: string; derviche_manager_id: string | null };
        } | null;

        // Construire les données communes de notification
        const baseNotifData: Omit<AdminNotificationEmailData, 'to' | 'adminName'> = {
          eventType: 'new_reservation',
          guestFullName: payload.guestFullName,
          guestEmail: payload.to,
          guestStructure: (reservationDetails as { guest_structure?: string | null } | null)?.guest_structure ?? null,
          showTitle: payload.showTitle,
          slotDateFormatted: payload.slotDateFormatted,
          slotTimeFormatted: payload.slotTimeFormatted,
          venueName: payload.venueName,
          numPlaces: payload.numPlaces,
          reservationId: payload.reservationId,
        };

        // Envoi au manager du spectacle
        if (sendToManager) {
          const managerId = slots?.shows?.derviche_manager_id;
          if (managerId) {
            const { data: managerProfile } = await adminClient
              .from('profiles')
              .select('email, first_name, last_name')
              .eq('id', managerId)
              .maybeSingle();

            if (managerProfile?.email) {
              const managerFullName =
                `${managerProfile.first_name ?? ''} ${managerProfile.last_name ?? ''}`.trim() ||
                managerProfile.email;

              await sendAdminNotificationEmail({
                ...baseNotifData,
                to: managerProfile.email,
                adminName: managerFullName,
              }).catch((err) => {
                logger.error('[API /emails/send-confirmation] Erreur notif manager', {
                  managerEmail: managerProfile.email,
                  err,
                });
              });
            }
          }
        }

        // Envoi à l'adresse personnalisée
        if (customRecipient) {
          await sendAdminNotificationEmail({
            ...baseNotifData,
            to: customRecipient,
            adminName: 'Administrateur',
          }).catch((err) => {
            logger.error('[API /emails/send-confirmation] Erreur notif adresse personnalisée', {
              customRecipient,
              err,
            });
          });
        }
      }
    } catch (notifErr) {
      logger.error('[API /emails/send-confirmation] Exception notif (non-bloquant)', { notifErr });
    }

    // 6. Créer l'événement Google Calendar (non-bloquant)
    try {
      const { data: calPref } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'google_calendar_enabled')
        .maybeSingle();

      const isBoolTrue = (v: unknown) => v === true || v === 'true';

      if (isBoolTrue(calPref?.value)) {
        const { data: slotRaw } = await adminClient
          .from('reservations')
          .select(`
            guest_structure,
            comments,
            slots!inner (
              date,
              time,
              shows!inner ( duration_minutes )
            )
          `)
          .eq('id', payload.reservationId)
          .maybeSingle();

        const slot = (slotRaw?.slots as unknown) as {
          date: string;
          time: string;
          shows: { duration_minutes: number | null };
        } | null;

        if (slot) {
          const calResult = await createCalendarEvent({
            showTitle:             payload.showTitle,
            guestFullName:         payload.guestFullName,
            guestStructure:        (slotRaw as { guest_structure?: string | null } | null)?.guest_structure ?? null,
            guestEmail:            payload.to,
            reservationId:         payload.reservationId,
            guestComment:          (slotRaw as { comments?: string | null } | null)?.comments ?? null,
            managerName:           confirmManagerName,
            managerPhone:          confirmManagerPhone,
            managerEmail:          confirmManagerEmail,
            numPlaces:             payload.numPlaces,
            slotDate:              slot.date,
            slotTime:              slot.time,
            durationMinutes:       slot.shows.duration_minutes,
            venueName:             payload.venueName,
            venueCity:             payload.venueCity,
            sendEmailNotification: true,
          });

          if (calResult.success) {
            await adminClient
              .from('reservations')
              .update({ google_calendar_event_id: calResult.eventId })
              .eq('id', payload.reservationId);
          }
        }
      }
    } catch (calErr) {
      logger.error('[API /emails/send-confirmation] Exception Calendar (non-bloquant)', { calErr });
    }

    return successResponse({ messageId: result.messageId });
  } catch (err) {
    logger.error('[API /emails/send-confirmation] Exception', { err });
    return serverErrorResponse();
  }
}
