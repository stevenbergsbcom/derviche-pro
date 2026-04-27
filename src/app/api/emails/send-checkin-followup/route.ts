/**
 * API Route — Email post-checkin
 * POST /api/emails/send-checkin-followup
 *
 * Envoie un email de suivi après pointage d'un invité :
 * remerciement (présent), coup de cœur, presse, suivi absence.
 *
 * Enregistre l'envoi dans checkin_followup_emails pour afficher
 * "Déjà envoyé le XX/XX" dans l'UI du CheckinDrawer.
 *
 * Sécurité :
 * - Rate limiting : 20 req / 1h par IP (anti-spam emails)
 * - Authentification requise
 * - Rôles autorisés : admin, super-admin, externe, company
 * - Externe : uniquement les réservations de ses spectacles assignés (hosted_by_id)
 * - Company : uniquement les réservations des spectacles de leur compagnie
 *
 * Refacto S198 : factorisation via `@/lib/services/email-routes`.
 */

import type { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendCheckinFollowupEmail } from '@/lib/services/email';
import { isSafeUrl } from '@/lib/services/email/html-helpers';
import { formatDuration } from '@/lib/services/email/builders/simple';
import { logger } from '@/lib/logger';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import type { CheckinFollowupTemplateKey } from '@/types/email-templates';
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
  loadManager,
  loadUserRole,
  authorizeEmailRouteAccess,
} from '@/lib/services/email-routes';

// ============================================
// VALIDATION
// ============================================

const CHECKIN_FOLLOWUP_KEYS: [
  CheckinFollowupTemplateKey,
  ...CheckinFollowupTemplateKey[]
] = [
  'checkin_thank_you',
  'checkin_loved',
  'checkin_press',
  'checkin_followup_absent',
];

const schema = z.object({
  reservationId: z.string().uuid('ID de réservation invalide'),
  templateKey: z.enum(CHECKIN_FOLLOWUP_KEYS),
});

// ============================================
// TYPES INTERNES
// ============================================

interface ReservationForFollowup {
  id: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_structure: string | null;
  user_id: string | null;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  slots: {
    date: string;
    time: string;
    hosted_by_id: string | null;
    shows: {
      title: string;
      slug: string;
      short_description: string | null;
      duration_minutes: number | null;
      folder_url: string | null;
      teaser_url: string | null;
      captation_url: string | null;
      photo_folder_url: string | null;
      derviche_site_url: string | null;
      derviche_manager_id: string | null;
      company_id: string | null;
      companies: { name: string } | null;
      show_target_audience_mapping: {
        target_audiences: { name: string } | null;
      }[];
    };
    venues: {
      name: string;
      city: string;
      address: string | null;
      postal_code: string | null;
    } | null;
  };
}

const ROUTE = '[API /emails/send-checkin-followup]';

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting
    const limited = await withEmailRateLimit(
      request,
      '/api/emails/send-checkin-followup',
    );
    if (limited) return limited;

    // 1. Validation payload
    const rawBody: unknown = await request.json();
    const parseResult = schema.safeParse(rawBody);
    if (!parseResult.success) {
      return errorResponse('Données invalides');
    }
    const { reservationId, templateKey } = parseResult.data;

    // 2. Authentification
    const userClient = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    // 3. Admin client + chargement réservation complète
    const adminClient = createAdminClient();

    const { data: raw, error: reservationError } = await adminClient
      .from('reservations')
      .select(`
        id,
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
          hosted_by_id,
          shows!inner (
            title,
            slug,
            short_description,
            duration_minutes,
            folder_url,
            teaser_url,
            captation_url,
            photo_folder_url,
            derviche_site_url,
            derviche_manager_id,
            company_id,
            companies:company_id ( name ),
            show_target_audience_mapping (
              target_audiences ( name )
            )
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

    const reservation = raw as unknown as ReservationForFollowup;
    const slots = reservation.slots;
    const show = slots.shows;
    const venue = slots.venues;

    // 4. Autorisation — full-admin ou externe assigné ou company de la compagnie
    const userRole = await loadUserRole(adminClient, user.id);
    const accessDenied = await authorizeEmailRouteAccess(
      adminClient,
      {
        userId: user.id,
        userRole,
        reservationUserId: reservation.user_id,
        hostedById: slots.hosted_by_id,
        showCompanyId: show.company_id,
      },
      { allowFullAdmin: true, allowExterne: true, allowCompany: true },
      ROUTE,
    );
    if (accessDenied) return accessDenied;

    // 5. Destinataire
    const recipient = resolveRecipient(reservation);
    if (!recipient) {
      logger.warn(`${ROUTE} Aucun email destinataire`, { reservationId });
      return errorResponse('Email destinataire introuvable', 422);
    }

    // 6. Manager Derviche
    const manager = await loadManager(adminClient, show.derviche_manager_id);

    // 7. Variables enrichies (publics cibles + durée)
    const companyName = show.companies?.name ?? '';

    const targetAudienceRows = show.show_target_audience_mapping ?? [];
    const targetAudiences =
      targetAudienceRows
        .map((m) => m.target_audiences?.name)
        .filter((n): n is string => Boolean(n))
        .join(', ') || null;

    const durationFormatted = formatDuration(show.duration_minutes);

    // 8. Envoi de l'email
    const emailResult = await sendCheckinFollowupEmail(
      {
        to: recipient.email,
        guestFullName: recipient.fullName,
        guestStructure: reservation.guest_structure,
        reservationId: reservation.id,
        showTitle: show.title,
        showSlug: show.slug,
        companyName,
        synopsis: show.short_description,
        durationFormatted,
        targetAudiences,
        // Filtrage sécurité : n'accepter que les URLs http(s) pour éviter les
        // injections javascript: dans le HTML de l'email.
        folderUrl: isSafeUrl(show.folder_url) ? show.folder_url : null,
        teaserUrl: isSafeUrl(show.teaser_url) ? show.teaser_url : null,
        captationUrl: isSafeUrl(show.captation_url) ? show.captation_url : null,
        photoFolderUrl: isSafeUrl(show.photo_folder_url) ? show.photo_folder_url : null,
        dervisheSiteUrl: isSafeUrl(show.derviche_site_url) ? show.derviche_site_url : null,
        slotDateFormatted: formatDateFr(slots.date),
        slotTimeFormatted: formatTimeFr(slots.time),
        venueName: venue?.name ?? '',
        venueCity: venue?.city ?? '',
        venueAddress: venue?.address ?? null,
        venuePostalCode: venue?.postal_code ?? null,
        managerName: manager.name,
        managerEmail: manager.email,
        managerPhone: manager.phone,
      },
      templateKey,
    );

    if (!emailResult.success) {
      logger.error(`${ROUTE} Échec envoi`, {
        reservationId,
        templateKey,
        error: emailResult.error,
      });
      return serverErrorResponse(emailResult.error ?? 'Erreur envoi email');
    }

    // 9. Enregistrer l'envoi dans checkin_followup_emails (anti-doublon)
    const { error: upsertError } = await adminClient
      .from('checkin_followup_emails')
      .upsert(
        {
          reservation_id: reservationId,
          template_key: templateKey,
          sent_by: user.id,
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'reservation_id,template_key' },
      );

    if (upsertError) {
      // Bloquant : l'email est envoyé mais le tracking a échoué.
      // On le signale au client pour éviter la désync UI/BDD.
      logger.error(`${ROUTE} Erreur upsert tracking`, {
        reservationId,
        templateKey,
        error: upsertError.message,
      });
      return serverErrorResponse("Email envoyé mais erreur d'enregistrement du suivi");
    }

    logger.info(`${ROUTE} Succès`, {
      reservationId,
      templateKey,
      messageId: emailResult.messageId,
    });

    return successResponse({ messageId: emailResult.messageId });
  } catch (err) {
    logger.error(`${ROUTE} Exception`, { err });
    return serverErrorResponse();
  }
}
