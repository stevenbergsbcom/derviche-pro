/**
 * API Route — Aperçu HTML d'un template email
 * GET /api/admin/email-templates/[key]/preview
 *
 * Génère un rendu HTML d'un template avec des données fictives,
 * en utilisant les VRAIS builders — rendu identique aux emails envoyés.
 *
 * Les valeurs du formulaire peuvent être passées en query string
 * pour prévisualiser les modifications avant sauvegarde.
 *
 * Accès : admin + super-admin uniquement
 */

import { createClient } from '@/lib/supabase/server';
import { getEmailConfig } from '@/lib/services/email/config';
import { buildConfirmationHtml }    from '@/lib/services/email/builders/confirmation';
import { buildCancellationHtml }    from '@/lib/services/email/builders/cancellation';
import { buildModificationHtml }    from '@/lib/services/email/builders/modification';
import { buildAdminNotificationHtml } from '@/lib/services/email/builders/admin-notification';
import { buildReminder7dHtml }      from '@/lib/services/email/builders/reminder-7d';
import { buildReminder2dHtml }      from '@/lib/services/email/builders/reminder-2d';
import { buildReminder12hHtml }     from '@/lib/services/email/builders/reminder-12h';
import { buildSimpleHtml }          from '@/lib/services/email/builders/simple';
import { logger } from '@/lib/logger';
import type { EmailTemplate, EmailTemplateKey } from '@/types/email-templates';
import type {
  ReservationConfirmationEmailData,
  ReservationCancellationEmailData,
  ReservationModificationEmailData,
  AdminNotificationEmailData,
  CheckinFollowupEmailData,
} from '@/lib/services/email/types';
import type { ReminderEmailData } from '@/lib/services/email/reminders/types';

// ============================================
// TYPES
// ============================================

interface RouteContext {
  params: Promise<{ key: string }>;
}

// ============================================
// DONNÉES FICTIVES POUR LA PREVIEW
// ============================================

const MOCK_CONFIRMATION: ReservationConfirmationEmailData = {
  to: 'marie.dupont@theatre-ville.fr',
  guestFullName: 'Marie Dupont',
  reservationCode: 'RES-2026-0042',
  reservationId: 'preview-id',
  showTitle: 'Le Bal des Âmes',
  showSlug: 'le-bal-des-ames',
  companyName: 'Compagnie des Miroirs',
  slotDateFormatted: 'mercredi 15 avril 2026',
  slotTimeFormatted: '19h30',
  venueName: 'Théâtre de la Ville',
  venueCity: 'Bordeaux',
  numPlaces: 2,
  managerName: 'Sophie Lefèvre',
  managerEmail: 'sophie@derviche-pro.fr',
  managerPhone: '06 12 34 56 78',
};

const MOCK_CANCELLATION: ReservationCancellationEmailData = {
  to: 'marie.dupont@theatre-ville.fr',
  guestFullName: 'Marie Dupont',
  reservationId: 'preview-id',
  showTitle: 'Le Bal des Âmes',
  showSlug: 'le-bal-des-ames',
  companyName: 'Compagnie des Miroirs',
  slotDateFormatted: 'mercredi 15 avril 2026',
  slotTimeFormatted: '19h30',
  venueName: 'Théâtre de la Ville',
  venueCity: 'Bordeaux',
  numPlaces: 2,
  cancellationReason: 'Indisponibilité imprévue',
  managerName: 'Sophie Lefèvre',
  managerEmail: 'sophie@derviche-pro.fr',
  managerPhone: '06 12 34 56 78',
};

const MOCK_MODIFICATION: ReservationModificationEmailData = {
  to: 'marie.dupont@theatre-ville.fr',
  guestFullName: 'Marie Dupont',
  reservationId: 'preview-id',
  showTitle: 'Le Bal des Âmes',
  showSlug: 'le-bal-des-ames',
  companyName: 'Compagnie des Miroirs',
  oldSlotDateFormatted: 'mardi 14 avril 2026',
  oldSlotTimeFormatted: '14h00',
  newSlotDateFormatted: 'mercredi 15 avril 2026',
  newSlotTimeFormatted: '19h30',
  venueName: 'Théâtre de la Ville',
  venueCity: 'Bordeaux',
  numPlaces: 2,
  managerName: 'Sophie Lefèvre',
  managerEmail: 'sophie@derviche-pro.fr',
  managerPhone: '06 12 34 56 78',
};

const MOCK_ADMIN_NOTIFICATION: AdminNotificationEmailData = {
  to: 'manager@derviche-pro.fr',
  adminName: 'Sophie Lefèvre',
  eventType: 'new_reservation',
  guestFullName: 'Marie Dupont',
  guestEmail: 'marie.dupont@theatre-ville.fr',
  guestStructure: 'Théâtre de la Ville — Bordeaux',
  showTitle: 'Le Bal des Âmes',
  slotDateFormatted: 'mercredi 15 avril 2026',
  slotTimeFormatted: '19h30',
  venueName: 'Théâtre de la Ville',
  numPlaces: 2,
  reservationId: 'preview-id',
  cancellationReason: null,
};

// ============================================
// VALIDATION
// ============================================

const VALID_KEYS: EmailTemplateKey[] = [
  'reservation_confirmation',
  'reservation_cancellation',
  'reservation_modification',
  'admin_notification',
  'reminder_7d',
  'reminder_2d',
  'reminder_12h',
  'checkin_thank_you',
  'checkin_loved',
  'checkin_press',
  'checkin_followup_absent',
];

/** Mock pour les 4 templates post-checkin */
const MOCK_CHECKIN_FOLLOWUP: CheckinFollowupEmailData = {
  to: 'marie.dupont@theatre-ville.fr',
  guestFullName: 'Marie Dupont',
  guestStructure: 'Théâtre de la Ville — Bordeaux',
  reservationId: 'preview-id',
  showTitle: 'Le Bal des Âmes',
  companyName: 'Compagnie des Miroirs',
  synopsis: 'Un voyage poétique et musical entre deux mondes, où les vivants et les morts se croisent le temps d\'une nuit.',
  durationFormatted: '1h20',
  targetAudiences: 'Tout public, À partir de 12 ans',
  slotDateFormatted: 'mercredi 15 avril 2026',
  slotTimeFormatted: '19h30',
  venueName: 'Théâtre de la Ville',
  venueCity: 'Bordeaux',
  managerName: 'Sophie Lefèvre',
  managerEmail: 'sophie@derviche-pro.fr',
  managerPhone: '06 12 34 56 78',
};

/** Mock partagé pour les 3 templates de rappel */
const MOCK_REMINDER: ReminderEmailData = {
  to: 'marie.dupont@theatre-ville.fr',
  guestFullName: 'Marie Dupont',
  reservationCode: 'DD-AB12CD',
  reservationId: 'preview-id',
  showTitle: 'Le Bal des Âmes',
  showSlug: 'le-bal-des-ames',
  companyName: 'Compagnie des Miroirs',
  slotDateFormatted: 'mercredi 15 avril 2026',
  slotTimeFormatted: '19h30',
  venueName: 'Théâtre de la Ville',
  venueCity: 'Bordeaux',
  numPlaces: 2,
  managerName: 'Sophie Lefèvre',
  managerEmail: 'sophie@derviche-pro.fr',
  managerPhone: '06 12 34 56 78',
};

function isValidKey(key: string): key is EmailTemplateKey {
  return VALID_KEYS.includes(key as EmailTemplateKey);
}

// ============================================
// MAPPING query params → EmailTemplate
// ============================================

function buildTemplateFromParams(
  q: URLSearchParams,
  key: EmailTemplateKey
): EmailTemplate {
  return {
    id: 'preview',
    template_key: key,
    name: key,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    header_title:          q.get('header_title')          ?? '',
    subject:               q.get('subject')               ?? '',
    salutation:            q.get('salutation')            ?? '',
    intro_text:            q.get('intro_text')            ?? '',
    body_text:             q.get('body_text')             ?? '',
    info_text:             q.get('info_text')             ?? '',
    cta_text:              q.get('cta_text')              ?? '',
    contact_block_title:   q.get('contact_block_title')   ?? '',
    show_contact_block:    q.get('show_contact_block')    === 'true',
    show_reservation_code: q.get('show_reservation_code') === 'true',
    is_simple_style:       q.get('is_simple_style')       === 'true',
  };
}

// ============================================
// GÉNÉRATION HTML via les vrais builders
// ============================================

function generatePreviewHtml(
  template: EmailTemplate,
  config: Awaited<ReturnType<typeof getEmailConfig>>,
  appUrl: string
): string {
  switch (template.template_key) {
    case 'reservation_confirmation':
      return buildConfirmationHtml(MOCK_CONFIRMATION, config, template, appUrl);
    case 'reservation_cancellation':
      return buildCancellationHtml(MOCK_CANCELLATION, config, template);
    case 'reservation_modification':
      return buildModificationHtml(MOCK_MODIFICATION, config, template, appUrl);
    case 'admin_notification':
      return buildAdminNotificationHtml(MOCK_ADMIN_NOTIFICATION, config, template, appUrl);
    case 'reminder_7d':
      return buildReminder7dHtml(MOCK_REMINDER, config, template, appUrl);
    case 'reminder_2d':
      return buildReminder2dHtml(MOCK_REMINDER, config, template, appUrl);
    case 'reminder_12h':
      return buildReminder12hHtml(MOCK_REMINDER, config, template, appUrl);
    // Post-checkin (S144) : style sobre
    case 'checkin_thank_you':
    case 'checkin_loved':
    case 'checkin_press':
    case 'checkin_followup_absent':
      return buildSimpleHtml(MOCK_CHECKIN_FOLLOWUP, config, template);
    default: {
      // Sécurité : ne devrait jamais arriver grâce à isValidKey()
      const _exhaustive: never = template.template_key;
      throw new Error(`Template non supporté : ${String(_exhaustive)}`);
    }
  }
}

// ============================================
// BANNIÈRE DE PREVIEW (injectée dans le <body>)
// ============================================

function injectPreviewBanner(html: string): string {
  const banner = `
  <div style="background:#fef3c7;border-bottom:2px solid #f59e0b;padding:10px 20px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#92400e;">
    ⚠️ <strong>Aperçu avec données fictives</strong> — Les variables sont remplacées par des exemples. Le rendu est identique à l'email réellement envoyé.
  </div>`;
  return html.replace(
    /(<body[^>]*>)/,
    `$1${banner}`
  );
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { key } = await context.params;

    if (!isValidKey(key)) {
      return new Response(`Clé invalide : ${key}`, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Non authentifié', { status: 401 });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = roleData?.role;
    if (role !== 'super-admin' && role !== 'admin') {
      return new Response('Droits insuffisants', { status: 403 });
    }

    const url    = new URL(request.url);
    const q      = url.searchParams;
    const appUrl = `${url.protocol}//${url.host}`;

    // Charger la config email depuis app_settings (même source que les vrais envois)
    const config = await getEmailConfig();

    let template: EmailTemplate;

    if (q.has('subject')) {
      // Preview live depuis le formulaire admin (avant sauvegarde)
      template = buildTemplateFromParams(q, key);
    } else {
      // Preview du template sauvegardé en DB
      const { data: dbTemplate, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', key)
        .single();

      if (error || !dbTemplate) {
        logger.error('[preview] Template introuvable', { key });
        return new Response('Template introuvable', { status: 404 });
      }

      // Mapping explicite depuis la forme Supabase vers EmailTemplate
      // (évite des champs undefined si le schéma DB diverge)
      template = {
        id:                    dbTemplate.id                    ?? 'unknown',
        template_key:          dbTemplate.template_key          as EmailTemplateKey,
        name:                  dbTemplate.name                  ?? '',
        is_active:             dbTemplate.is_active             ?? true,
        created_at:            dbTemplate.created_at            ?? '',
        updated_at:            dbTemplate.updated_at            ?? '',
        header_title:          dbTemplate.header_title          ?? '',
        subject:               dbTemplate.subject               ?? '',
        intro_text:            dbTemplate.intro_text            ?? '',
        body_text:             dbTemplate.body_text             ?? '',
        info_text:             dbTemplate.info_text             ?? '',
        salutation:            dbTemplate.salutation            ?? '',
        cta_text:              dbTemplate.cta_text              ?? '',
        contact_block_title:   dbTemplate.contact_block_title   ?? '',
        show_contact_block:    dbTemplate.show_contact_block    ?? false,
        show_reservation_code: dbTemplate.show_reservation_code ?? false,
        is_simple_style:       dbTemplate.is_simple_style       ?? false,
      };
    }

    const rawHtml   = generatePreviewHtml(template, config, appUrl);
    const finalHtml = injectPreviewBanner(rawHtml);

    return new Response(finalHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[preview] Exception', { message });
    return new Response('Erreur serveur', { status: 500 });
  }
}
