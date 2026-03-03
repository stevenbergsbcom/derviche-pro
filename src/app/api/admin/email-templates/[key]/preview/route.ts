/**
 * API Route — Aperçu HTML d'un template email
 * GET /api/admin/email-templates/[key]/preview
 *
 * Génère un rendu HTML d'un template avec des données fictives.
 * Les valeurs du formulaire peuvent être passées en query string
 * pour prévisualiser les modifications avant sauvegarde.
 *
 * Accès : admin + super-admin uniquement
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { EmailTemplateKey } from '@/types/email-templates';

// ============================================
// TYPES
// ============================================

interface RouteContext {
  params: Promise<{ key: string }>;
}

interface PreviewData {
  header_title: string;
  salutation: string;
  intro_text: string;
  body_text: string;
  info_text: string;
  cta_text: string;
  contact_block_title: string;
  show_contact_block: boolean;
  show_reservation_code: boolean;
  subject: string;
}

// ============================================
// DONNÉES FICTIVES POUR LA PREVIEW
// ============================================

const PREVIEW_VARS: Record<string, string> = {
  '{{prénom}}':       'Marie',
  '{{nom}}':          'Dupont',
  '{{spectacle}}':    'Le Bal des Âmes',
  '{{date}}':         'mercredi 15 avril 2026',
  '{{heure}}':        '19h30',
  '{{lieu}}':         'Théâtre de la Ville',
  '{{organisation}}': 'Maison de la Culture de Bordeaux',
  '{{code}}':         'RES-2026-0042',
  '{{événement}}':    'Nouvelle réservation',
};

// Échappe tous les caractères spéciaux regex dans une chaîne.
// On utilise une callback pour éviter l'ambiguïté du pattern $& dans
// les chaînes de remplacement de String.prototype.replace().
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, (char) => `\\${char}`);
}

function resolvePreviewVars(text: string): string {
  if (!text) return '';
  return Object.entries(PREVIEW_VARS).reduce(
    (acc, [variable, value]) =>
      acc.replace(new RegExp(escapeRegExp(variable), 'g'), value),
    text
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtmlLines(text: string): string {
  if (!text) return '';
  return escapeHtml(text).replace(/\n/g, '<br />');
}

// ============================================
// VALIDATION
// ============================================

const VALID_KEYS: EmailTemplateKey[] = [
  'reservation_confirmation',
  'reservation_cancellation',
  'reservation_modification',
  'admin_notification',
];

function isValidKey(key: string): key is EmailTemplateKey {
  return VALID_KEYS.includes(key as EmailTemplateKey);
}

// ============================================
// GÉNÉRATION DU HTML
// ============================================

function generatePreviewHtml(data: PreviewData, templateKey: EmailTemplateKey): string {
  const headerTitle  = resolvePreviewVars(escapeHtml(data.header_title));
  const salutation   = resolvePreviewVars(escapeHtml(data.salutation));
  const introText    = resolvePreviewVars(textToHtmlLines(data.intro_text));
  const bodyText     = resolvePreviewVars(textToHtmlLines(data.body_text));
  const infoText     = resolvePreviewVars(textToHtmlLines(data.info_text));
  const ctaText      = resolvePreviewVars(escapeHtml(data.cta_text));
  const contactTitle = resolvePreviewVars(escapeHtml(data.contact_block_title));

  const isConfirmation = templateKey === 'reservation_confirmation';

  const summaryBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;border:1px solid #e0e0e0;margin:20px 0;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 10px;font-size:14px;color:#555;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Récapitulatif</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0;color:#333;font-size:14px;width:40%;font-weight:600;">Spectacle</td><td style="padding:6px 0;color:#333;font-size:14px;">Le Bal des Âmes</td></tr>
            <tr><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">Date</td><td style="padding:6px 0;color:#333;font-size:14px;">mercredi 15 avril 2026</td></tr>
            <tr><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">Heure</td><td style="padding:6px 0;color:#333;font-size:14px;">19h30</td></tr>
            <tr><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">Lieu</td><td style="padding:6px 0;color:#333;font-size:14px;">Théâtre de la Ville</td></tr>
            <tr><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">Places</td><td style="padding:6px 0;color:#333;font-size:14px;">2 place(s)</td></tr>
            ${isConfirmation && data.show_reservation_code
              ? `<tr><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">Code</td><td style="padding:6px 0;color:#333;font-size:14px;font-family:monospace;background:#eee;padding:2px 6px;border-radius:4px;">RES-2026-0042</td></tr>`
              : ''}
          </table>
        </td>
      </tr>
    </table>`;

  const infoBlock = infoText ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="padding:16px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;">
          <p style="margin:0;font-size:14px;color:#78350f;">${infoText}</p>
        </td>
      </tr>
    </table>` : '';

  const ctaBlock = ctaText ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;text-align:center;">
      <tr>
        <td align="center">
          <a href="#" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;">${ctaText}</a>
        </td>
      </tr>
    </table>` : '';

  const contactBlock = data.show_contact_block ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #e0e0e0;padding-top:20px;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1e3a5f;">${contactTitle || "Besoin d'aide ?"}</p>
          <p style="margin:0;font-size:13px;color:#555;">contact@derviche-pro.fr &bull; derviche-pro.fr</p>
        </td>
      </tr>
    </table>` : '';

  const signatureBlock = salutation
    ? `<p style="margin:24px 0 0;font-size:14px;color:#555;">${salutation}<br /><strong>L'équipe Derviche Diffusion</strong></p>`
    : `<p style="margin:24px 0 0;font-size:14px;color:#555;font-style:italic;"><strong>L'équipe Derviche Diffusion</strong></p>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aperçu email — ${headerTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; }
    .preview-banner { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 8px 16px; margin-bottom: 16px; font-size: 12px; color: #92400e; text-align: center; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="preview-banner">
    ⚠️ Aperçu avec données fictives — Les variables <code>{{prénom}}</code>, <code>{{spectacle}}</code>... sont remplacées par des exemples
  </div>
  <div class="email-wrapper">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a5f;">
      <tr>
        <td style="padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#a8c0d6;text-transform:uppercase;letter-spacing:1px;font-weight:500;">Derviche Diffusion</p>
          <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:700;">${headerTitle}</h1>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px;">
          ${introText  ? `<p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.6;">${introText}</p>` : ''}
          ${summaryBlock}
          ${infoBlock}
          ${bodyText   ? `<p style="margin:20px 0;font-size:15px;color:#333;line-height:1.6;">${bodyText}</p>` : ''}
          ${ctaBlock}
          ${signatureBlock}
          ${contactBlock}
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;border-top:1px solid #e0e0e0;">
      <tr>
        <td style="padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#888;">Derviche Diffusion — contact@derviche-pro.fr</p>
          <p style="margin:4px 0 0;font-size:11px;color:#aaa;">Vous recevez cet email car vous avez un compte sur derviche-pro.fr</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
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

    const url = new URL(request.url);
    const q   = url.searchParams;

    let previewData: PreviewData;

    if (q.has('subject')) {
      // Données depuis le formulaire (preview live)
      previewData = {
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
      };
    } else {
      // Données depuis la base de données (template sauvegardé)
      const { data: dbTemplate, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', key)
        .single();

      if (error || !dbTemplate) {
        logger.error('[preview] Template introuvable', { key });
        return new Response('Template introuvable', { status: 404 });
      }

      previewData = {
        header_title:          dbTemplate.header_title          ?? '',
        subject:               dbTemplate.subject               ?? '',
        salutation:            dbTemplate.salutation            ?? '',
        intro_text:            dbTemplate.intro_text            ?? '',
        body_text:             dbTemplate.body_text             ?? '',
        info_text:             dbTemplate.info_text             ?? '',
        cta_text:              dbTemplate.cta_text              ?? '',
        contact_block_title:   dbTemplate.contact_block_title   ?? '',
        show_contact_block:    dbTemplate.show_contact_block    ?? false,
        show_reservation_code: dbTemplate.show_reservation_code ?? false,
      };
    }

    const html = generatePreviewHtml(previewData, key);

    return new Response(html, {
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
