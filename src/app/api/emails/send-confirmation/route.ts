/**
 * API Route - Envoi d'email de confirmation de réservation
 * POST /api/emails/send-confirmation
 *
 * Appelée côté client après une réservation réussie.
 * L'envoi est non-bloquant : un échec email ne fait pas échouer la réservation.
 *
 * Sécurité :
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
    // 1. Parser et valider le body
    const rawBody: unknown = await request.json();
    const parseResult = sendConfirmationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn('[API /emails/send-confirmation] Payload invalide', {
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      );
    }

    const payload: SendConfirmationPayload = parseResult.data;

    // 2. Vérifier que la réservation existe et que l'email correspond
    // On utilise le service role pour bypasser les RLS (lecture sécurisée côté serveur)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /emails/send-confirmation] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: reservation, error: reservationError } = await adminClient
      .from('reservations')
      .select('id, guest_email, user_id, profiles:user_id(email)')
      .eq('id', payload.reservationId)
      .maybeSingle();

    if (reservationError || !reservation) {
      logger.warn('[API /emails/send-confirmation] Réservation introuvable', {
        reservationId: payload.reservationId,
      });
      // 200 intentionnel : on ne révèle pas si la réservation existe
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 200 });
    }

    // Vérifier que l'email correspond à la réservation (guest_email ou email du compte)
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
      // 200 intentionnel : on ne révèle pas le motif du refus
      return NextResponse.json({ success: false, error: 'Email invalide' }, { status: 200 });
    }

    // 3. Envoyer l'email de confirmation au professionnel
    // Récupérer le manager Derviche pour le bloc contact
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
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'envoi" },
        { status: 200 } // 200 intentionnel : la réservation est déjà créée
      );
    }

    // 4. Notifier le manager Derviche lié au spectacle (si préférence activée)
    try {
      const { data: notifPrefData } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'email_notification_new_reservation')
        .maybeSingle();

      const isBooleanSettingTrue = (val: unknown): boolean =>
        val === true || val === 'true' || String(val) === 'true';

      const notifEnabled = isBooleanSettingTrue(notifPrefData?.value);

      if (notifEnabled) {
        // Récupérer le derviche_manager_id depuis le spectacle via la réservation
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

            const notifData: AdminNotificationEmailData = {
              to: managerProfile.email,
              adminName: managerFullName,
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

            await sendAdminNotificationEmail(notifData).catch((err) => {
              logger.error('[API /emails/send-confirmation] Erreur notif manager', {
                managerEmail: managerProfile.email,
                err,
              });
            });
          }
        } else {
          logger.warn('[API /emails/send-confirmation] Notification activée mais aucun manager assigné au spectacle', {
            showTitle: payload.showTitle,
            reservationId: payload.reservationId,
          });
        }
      }
    } catch (notifErr) {
      // La notif manager ne doit jamais bloquer la réponse
      logger.error('[API /emails/send-confirmation] Exception notif manager (non-bloquant)', { notifErr });
    }

    // 5. Créer l'événement Google Calendar (non-bloquant)
    try {
      const { data: calPref } = await adminClient
        .from('app_settings')
        .select('value')
        .eq('key', 'google_calendar_enabled')
        .maybeSingle();

      const isBoolTrue = (v: unknown) => v === true || v === 'true';

      if (isBoolTrue(calPref?.value)) {
        // Fetch données brutes du créneau (date ISO, heure, durée)
        const { data: slotRaw } = await adminClient
          .from('reservations')
          .select(`
            guest_structure,
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
            showTitle:            payload.showTitle,
            guestFullName:        payload.guestFullName,
            guestStructure:       (slotRaw as { guest_structure?: string | null } | null)?.guest_structure ?? null,
            guestEmail:           payload.to,
            reservationId:        payload.reservationId,
            numPlaces:            payload.numPlaces,
            slotDate:             slot.date,
            slotTime:             slot.time,
            durationMinutes:      slot.shows.duration_minutes,
            venueName:            payload.venueName,
            venueCity:            payload.venueCity,
            sendEmailNotification: true,
          });

          if (calResult.success) {
            // Stocker l'eventId pour pouvoir le modifier/supprimer plus tard
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

    // 6. Créer la notification admin en base (badge sidebar)
    // Non-bloquant : createAdminNotification gère ses propres erreurs
    await createAdminNotification({
      type: 'new_reservation',
      reservation_id: payload.reservationId,
      professional_name: payload.guestFullName,
      show_title: payload.showTitle,
      slot_date: null, // Date formatée uniquement disponible dans ce contexte
      message: `${payload.guestFullName} a réservé ${payload.numPlaces} place(s) pour « ${payload.showTitle} »`,
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    logger.error('[API /emails/send-confirmation] Exception', { err });
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
