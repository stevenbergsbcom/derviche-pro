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
 * - Authentification requise
 * - Rôles autorisés : admin, super-admin, externe, company
 * - Externe : uniquement les réservations de ses spectacles assignés (hosted_by_id)
 * - Company : uniquement les réservations des spectacles de leur compagnie
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendCheckinFollowupEmail } from '@/lib/services/email';
import { formatDuration } from '@/lib/services/email/builders/simple';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import type { UserRole } from '@/types/database';
import type { CheckinFollowupTemplateKey } from '@/types/email-templates';

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
  templateKey:   z.enum(CHECKIN_FOLLOWUP_KEYS),
});

// ============================================
// TYPES INTERNES
// ============================================

interface ReservationForFollowup {
  id: string;
  guest_first_name: string | null;
  guest_last_name:  string | null;
  guest_email:      string | null;
  guest_structure:  string | null;
  user_id:          string | null;
  profiles: {
    email:       string;
    first_name:  string | null;
    last_name:   string | null;
  } | null;
  slots: {
    date: string;
    time: string;
    hosted_by_id: string | null;
    shows: {
    title:               string;
    slug:                string;
    short_description:   string | null;
    duration_minutes:    number | null;
    folder_url:          string | null;
    teaser_url:          string | null;
    captation_url:       string | null;
    derviche_manager_id: string | null;
    company_id:          string | null;
      companies: { name: string } | null;
        show_target_audience_mapping: {
          target_audiences: { name: string } | null;
        }[];
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
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { reservationId, templateKey } = parseResult.data;

    // 2. Vérifier l'authentification
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Client service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /emails/send-checkin-followup] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json(
        { success: false, error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Vérifier le rôle
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = userRoleData?.role as UserRole | undefined;
    const isAuthorized =
      userRole === 'super-admin' ||
      userRole === 'admin' ||
      userRole === 'externe' ||
      userRole === 'company';

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 5. Récupérer la réservation complète avec données enrichies
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
            derviche_manager_id,
            company_id,
            companies:company_id ( name ),
            show_target_audience_mapping (
              target_audiences ( name )
            )
          ),
          venues ( name, city )
        )
      `)
      .eq('id', reservationId)
      .maybeSingle();

    if (reservationError || !raw) {
      logger.warn('[API /emails/send-checkin-followup] Réservation introuvable', { reservationId });
      return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 });
    }

    const reservation = raw as unknown as ReservationForFollowup;
    const slots  = reservation.slots;
    const show   = slots.shows;
    const venue  = slots.venues;

    // 6a. Sécurité externe : vérifier hosted_by_id
    if (userRole === 'externe' && slots.hosted_by_id !== user.id) {
      logger.warn('[API /emails/send-checkin-followup] Externe non assigné', {
        userId: user.id,
        reservationId,
      });
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 6b. Sécurité company : vérifier que le show appartient à leur compagnie
    if (userRole === 'company') {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      const userCompanyId = profile?.company_id ?? null;

      if (!userCompanyId || show.company_id !== userCompanyId) {
        logger.warn('[API /emails/send-checkin-followup] Company non autorisée', {
          userId: user.id,
          userCompanyId,
          showCompanyId: show.company_id,
          reservationId,
        });
        return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
      }
    }

    // 7. Déterminer le destinataire
    const profileData = Array.isArray(reservation.profiles)
      ? reservation.profiles[0]
      : reservation.profiles;

    const recipientEmail     = reservation.guest_email ?? profileData?.email;
    const recipientFirstName = reservation.guest_first_name ?? profileData?.first_name ?? '';
    const recipientLastName  = reservation.guest_last_name  ?? profileData?.last_name  ?? '';
    const recipientFullName  =
      `${recipientFirstName} ${recipientLastName}`.trim() || 'Cher professionnel';

    if (!recipientEmail) {
      logger.warn('[API /emails/send-checkin-followup] Aucun email destinataire', { reservationId });
      return NextResponse.json(
        { success: false, error: 'Email destinataire introuvable' },
        { status: 422 }
      );
    }

    // 8. Récupérer le manager Derviche
    let managerName:  string | null = null;
    let managerEmail: string | null = null;
    let managerPhone: string | null = null;

    if (show.derviche_manager_id) {
      const { data: mgr } = await adminClient
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', show.derviche_manager_id)
        .maybeSingle();

      if (mgr) {
        managerName  = `${mgr.first_name ?? ''} ${mgr.last_name ?? ''}`.trim() || null;
        managerEmail = mgr.email ?? null;
        managerPhone = (mgr as unknown as { phone?: string | null }).phone ?? null;
      }
    }

    // 9. Construire les variables enrichies
    const companyName = show.companies?.name ?? '';

    // Publics cibles : concaténer les noms
    const targetAudienceRows = show.show_target_audience_mapping ?? [];
    const targetAudiences = targetAudienceRows
      .map((m) => m.target_audiences?.name)
      .filter((n): n is string => Boolean(n))
      .join(', ') || null;

    // Durée formatée
    const durationFormatted = formatDuration(show.duration_minutes);

    // 10. Envoyer l'email
    const emailResult = await sendCheckinFollowupEmail(
      {
        to:               recipientEmail,
        guestFullName:    recipientFullName,
        guestStructure:   reservation.guest_structure,
        reservationId:    reservation.id,
        showTitle:        show.title,
        showSlug:         show.slug,
        companyName,
        synopsis:         show.short_description,
        durationFormatted,
        targetAudiences,
        folderUrl:         show.folder_url,
        teaserUrl:         show.teaser_url,
        captationUrl:      show.captation_url,
        slotDateFormatted: formatDateFr(slots.date),
        slotTimeFormatted: formatTimeFr(slots.time),
        venueName:         venue?.name ?? '',
        venueCity:         venue?.city ?? '',
        managerName,
        managerEmail,
        managerPhone,
      },
      templateKey
    );

    if (!emailResult.success) {
      logger.error('[API /emails/send-checkin-followup] Échec envoi', {
        reservationId,
        templateKey,
        error: emailResult.error,
      });
      return NextResponse.json(
        { success: false, error: emailResult.error ?? 'Erreur envoi email' },
        { status: 500 }
      );
    }

    // 11. Enregistrer l'envoi dans checkin_followup_emails
    // Upsert : met à jour sent_at si l'email avait déjà été envoyé (renvoi)
    const { error: upsertError } = await adminClient
      .from('checkin_followup_emails')
      .upsert(
        {
          reservation_id: reservationId,
          template_key:   templateKey,
          sent_by:        user.id,
          sent_at:        new Date().toISOString(),
        },
        { onConflict: 'reservation_id,template_key' }
      );

    if (upsertError) {
      // Bloquant : l'émail est envoyé mais le tracking a échoué — on le signale au client
      // pour éviter la désync UI / BDD
      logger.error('[API /emails/send-checkin-followup] Erreur upsert tracking', {
        reservationId,
        templateKey,
        error: upsertError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Email envoyé mais erreur d\u2019enregistrement du suivi' },
        { status: 500 }
      );
    }

    logger.info('[API /emails/send-checkin-followup] Succès', {
      reservationId,
      templateKey,
      messageId: emailResult.messageId,
    });

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
    });

  } catch (err) {
    logger.error('[API /emails/send-checkin-followup] Exception', { err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
