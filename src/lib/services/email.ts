/**
 * Service Email - Envoi d'emails transactionnels via Resend
 * Derviche Diffusion
 *
 * Lit la configuration expéditeur depuis app_settings (DB)
 * et les contenus texte depuis la table email_templates (DB).
 *
 * Sécurité : Ce service ne doit être appelé que côté serveur (API routes).
 */

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  getEmailTemplate,
  resolveTemplateVariables,
  textToHtml,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';

// ============================================
// TYPES
// ============================================

/** Infos de contact du manager Derviche assigné au spectacle */
export interface ManagerContact {
  managerName?: string | null;
  managerEmail?: string | null;
  managerPhone?: string | null;
}

export interface ReservationConfirmationEmailData extends ManagerContact {
  to: string;
  guestFullName: string;
  reservationCode: string;
  reservationId: string;
  showTitle: string;
  showSlug: string;
  companyName: string;
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  venueCity: string;
  numPlaces: number;
}

export interface ReservationCancellationEmailData extends ManagerContact {
  to: string;
  guestFullName: string;
  reservationId: string;
  showTitle: string;
  showSlug: string;
  companyName: string;
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  venueCity: string;
  numPlaces: number;
  cancellationReason?: string | null;
}

export interface ReservationModificationEmailData extends ManagerContact {
  to: string;
  guestFullName: string;
  reservationId: string;
  showTitle: string;
  showSlug: string;
  companyName: string;
  oldSlotDateFormatted: string;
  oldSlotTimeFormatted: string;
  newSlotDateFormatted: string;
  newSlotTimeFormatted: string;
  venueName: string;
  venueCity: string;
  numPlaces: number;
}

export interface AdminNotificationEmailData {
  to: string;
  adminName: string;
  eventType: 'new_reservation' | 'cancellation' | 'modification';
  guestFullName: string;
  guestEmail: string;
  guestStructure?: string | null;
  showTitle: string;
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  numPlaces: number;
  reservationId: string;
  cancellationReason?: string | null;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// CONFIG EMAIL (depuis app_settings)
// ============================================

interface EmailConfig {
  fromName: string;
  fromAddress: string;
  replyTo: string;
  catalogueUrl: string;
  signature: string;
  footerText: string;
  organizationName: string;
}

// ============================================
// HELPERS INTERNES
// ============================================

function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function extractFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0] ?? fullName;
}

async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const supabase = await createClient();
    const keys = [
      'email_from_name',
      'email_from_address',
      'email_reply_to',
      'email_catalogue_url',
      'email_signature',
      'email_footer_text',
      'organization_name',
    ];

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      logger.error('[email] Erreur lecture app_settings', { error: error.message });
    }

    const settings: Record<string, string> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      if (typeof row.value === 'string') settings[row.key] = row.value;
    });

    return {
      fromName:         settings['email_from_name']      ?? 'Derviche Diffusion',
      fromAddress:      settings['email_from_address']   ?? 'reservations@derviche-pro.fr',
      replyTo:          settings['email_reply_to']       ?? 'contact@derviche-pro.fr',
      // ⚠️ Mettre à jour la clé email_catalogue_url en DB vers derviche-pro.fr/catalogue
      catalogueUrl:     settings['email_catalogue_url']  ?? 'https://derviche-pro.vercel.app/catalogue',
      signature:        settings['email_signature']      ?? "L'équipe Derviche Diffusion",
      footerText:       settings['email_footer_text']    ?? 'Derviche Diffusion — contact@derviche-pro.fr',
      organizationName: settings['organization_name']    ?? 'Derviche Diffusion',
    };
  } catch (err) {
    logger.error('[email] Exception getEmailConfig', { err });
    return {
      fromName:         'Derviche Diffusion',
      fromAddress:      'reservations@derviche-pro.fr',
      replyTo:          'contact@derviche-pro.fr',
      catalogueUrl:     'https://derviche-pro.vercel.app/catalogue',
      signature:        "L'équipe Derviche Diffusion",
      footerText:       'Derviche Diffusion — contact@derviche-pro.fr',
      organizationName: 'Derviche Diffusion',
    };
  }
}

// ============================================
// BLOCS HTML PARTAGÉS
// ============================================

/**
 * Bloc contact manager — conditionnel (show_contact_block + données présentes).
 */
function buildContactBlock(
  template: EmailTemplate,
  managerName: string | null | undefined,
  managerEmail: string | null | undefined,
  managerPhone: string | null | undefined
): string {
  if (!template.show_contact_block) return '';

  const safeName  = escapeHtml(managerName);
  const safeEmail = escapeHtml(managerEmail);
  const safePhone = escapeHtml(managerPhone);
  const safeTitle = escapeHtml(template.contact_block_title);

  if (!safeName && !safeEmail && !safePhone) return '';

  return `
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <div style="background-color:#faf9f6;border:1px solid #e5e0d0;border-radius:8px;padding:16px 20px;">
                <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">${safeTitle}</p>
                ${safeName  ? `<p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${safeName}</p>` : ''}
                ${safeEmail ? `<p style="margin:4px 0 0 0;font-size:13px;color:#374151;">✉ <a href="mailto:${safeEmail}" style="color:#1e3a5f;text-decoration:none;">${safeEmail}</a></p>` : ''}
                ${safePhone ? `<p style="margin:4px 0 0 0;font-size:13px;color:#374151;">📞 ${safePhone}</p>` : ''}
              </div>
            </td>
          </tr>`;
}

/**
 * Bloc info 📧 — conditionnel (info_text non vide).
 */
function buildInfoBlock(
  resolvedInfoText: string,
  accentColor = '#1d4ed8',
  bgColor = '#eff6ff',
  borderColor = '#bfdbfe'
): string {
  if (!resolvedInfoText.trim()) return '';
  return `
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <div style="background-color:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:${accentColor};line-height:1.5;">📧 ${resolvedInfoText}</p>
              </div>
            </td>
          </tr>`;
}

/**
 * Bloc signature avec salutation optionnelle.
 */
function buildSignatureBlock(safeSalutation: string, safeSignature: string): string {
  if (safeSalutation) {
    return `
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                ${safeSalutation}<br />
                <strong>${safeSignature}</strong>
              </p>
            </td>
          </tr>`;
  }
  if (safeSignature) {
    return `
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                <strong>${safeSignature}</strong>
              </p>
            </td>
          </tr>`;
  }
  return '';
}

/**
 * Bloc CTA conditionnel.
 * @param href  URL du bouton
 * @param color Couleur de fond du bouton (hex)
 */
function buildCtaBlock(safeCtaText: string, href: string, color = '#1e3a5f'): string {
  if (!safeCtaText) return '';
  return `
          <tr>
            <td style="padding:24px 40px 0 40px;text-align:center;">
              <a href="${href}"
                style="display:inline-block;background-color:${color};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                ${safeCtaText}
              </a>
            </td>
          </tr>`;
}

/**
 * Ligne footer commune à tous les emails.
 */
function buildFooterRow(safeFooterText: string): string {
  return `
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${safeFooterText}</p>
            </td>
          </tr>`;
}

// ============================================
// BUILDERS HTML
// ============================================

function buildConfirmationHtml(
  data: ReservationConfirmationEmailData,
  config: EmailConfig,
  template: EmailTemplate,
  appUrl: string
): string {
  const showUrl     = `${appUrl}/spectacle/${data.showSlug}`;
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const rawVars: EmailTemplateVariables = {
    prénom: extractFirstName(data.guestFullName), nom: data.guestFullName,
    spectacle: data.showTitle, date: data.slotDateFormatted, heure: data.slotTimeFormatted,
    lieu: data.venueName, code: data.reservationCode, organisation: config.organizationName,
  };
  const htmlVars: EmailTemplateVariables = {
    prénom: escapeHtml(extractFirstName(data.guestFullName)), nom: escapeHtml(data.guestFullName),
    spectacle: escapeHtml(data.showTitle), date: escapeHtml(data.slotDateFormatted),
    heure: escapeHtml(data.slotTimeFormatted), lieu: escapeHtml(data.venueName),
    code: escapeHtml(data.reservationCode), organisation: escapeHtml(config.organizationName),
  };

  const resolvedSubject     = resolveTemplateVariables(template.subject,      rawVars);
  const resolvedHeaderTitle = resolveTemplateVariables(template.header_title, rawVars);
  const resolvedIntro       = textToHtml(resolveTemplateVariables(template.intro_text, htmlVars));
  const resolvedBody        = textToHtml(resolveTemplateVariables(template.body_text,  htmlVars));
  const resolvedInfo        = resolveTemplateVariables(template.info_text,  htmlVars);
  const resolvedSalutation  = resolveTemplateVariables(template.salutation, rawVars);
  const resolvedCtaText     = resolveTemplateVariables(template.cta_text,   rawVars);

  const safeOrgName     = escapeHtml(config.organizationName);
  const safeHeaderTitle = escapeHtml(resolvedHeaderTitle);
  const safeShowTitle   = escapeHtml(data.showTitle);
  const safeCompanyName = escapeHtml(data.companyName);
  const safeVenueName   = escapeHtml(data.venueName);
  const safeVenueCity   = escapeHtml(data.venueCity);
  const safeCode             = escapeHtml(data.reservationCode);
  const safeDateFormatted    = escapeHtml(data.slotDateFormatted);
  const safeTimeFormatted    = escapeHtml(data.slotTimeFormatted);
  const safeSalutation       = escapeHtml(resolvedSalutation);
  const safeCtaText          = escapeHtml(resolvedCtaText);
  const safeSignature        = escapeHtml(config.signature);
  const safeFooterText       = escapeHtml(config.footerText);

  const codeBlock = template.show_reservation_code ? `
          <tr>
            <td style="padding:28px 40px 0 40px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;">Code de réservation</p>
              <p style="margin:8px 0 0 0;font-size:28px;font-weight:700;color:#1e3a5f;letter-spacing:3px;">${safeCode}</p>
            </td>
          </tr>` : '';

  const bodyBlock = resolvedBody ? `
          <tr>
            <td style="padding:12px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${resolvedBody}</p>
            </td>
          </tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${escapeHtml(resolvedSubject)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background-color:#1e3a5f;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">${safeOrgName}</p>
            <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">${safeHeaderTitle}</h1>
          </td>
        </tr>

        ${codeBlock}

        <tr>
          <td style="padding:24px 40px 0 40px;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${resolvedIntro}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
              <tr><td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Spectacle</p>
                <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${safeShowTitle}</p>
                <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeCompanyName}</p>
              </td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Date &amp; heure</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeDateFormatted}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">à ${safeTimeFormatted}</p>
                  </td>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeVenueName}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeVenueCity}</p>
                  </td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:16px 24px;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Places réservées</p>
                <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${placesLabel}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        ${buildCtaBlock(safeCtaText, showUrl)}
        ${bodyBlock}
        ${buildInfoBlock(resolvedInfo)}
        ${buildContactBlock(template, data.managerName, data.managerEmail, data.managerPhone)}
        ${buildSignatureBlock(safeSalutation, safeSignature)}
        ${buildFooterRow(safeFooterText)}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildCancellationHtml(
  data: ReservationCancellationEmailData,
  config: EmailConfig,
  template: EmailTemplate
): string {
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const rawVars: EmailTemplateVariables = {
    prénom: extractFirstName(data.guestFullName), nom: data.guestFullName,
    spectacle: data.showTitle, date: data.slotDateFormatted, heure: data.slotTimeFormatted,
    lieu: data.venueName, organisation: config.organizationName,
  };
  const htmlVars: EmailTemplateVariables = {
    prénom: escapeHtml(extractFirstName(data.guestFullName)), nom: escapeHtml(data.guestFullName),
    spectacle: escapeHtml(data.showTitle), date: escapeHtml(data.slotDateFormatted),
    heure: escapeHtml(data.slotTimeFormatted), lieu: escapeHtml(data.venueName),
    organisation: escapeHtml(config.organizationName),
  };

  const resolvedSubject     = resolveTemplateVariables(template.subject,      rawVars);
  const resolvedHeaderTitle = resolveTemplateVariables(template.header_title, rawVars);
  const resolvedIntro       = textToHtml(resolveTemplateVariables(template.intro_text, htmlVars));
  const resolvedBody        = textToHtml(resolveTemplateVariables(template.body_text,  htmlVars));
  const resolvedInfo        = resolveTemplateVariables(template.info_text,  htmlVars);
  const resolvedSalutation  = resolveTemplateVariables(template.salutation, rawVars);
  const resolvedCtaText     = resolveTemplateVariables(template.cta_text,   rawVars);

  const safeOrgName            = escapeHtml(config.organizationName);
  const safeHeaderTitle        = escapeHtml(resolvedHeaderTitle);
  const safeShowTitle          = escapeHtml(data.showTitle);
  const safeCompanyName        = escapeHtml(data.companyName);
  const safeVenueName          = escapeHtml(data.venueName);
  const safeVenueCity          = escapeHtml(data.venueCity);
  const safeCancellationReason = escapeHtml(data.cancellationReason);
  const safeDateFormatted      = escapeHtml(data.slotDateFormatted);
  const safeTimeFormatted      = escapeHtml(data.slotTimeFormatted);
  const safeSalutation         = escapeHtml(resolvedSalutation);
  const safeCtaText            = escapeHtml(resolvedCtaText);
  const safeSignature          = escapeHtml(config.signature);
  const safeFooterText         = escapeHtml(config.footerText);

  const reasonBlock = safeCancellationReason ? `
              <tr><td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Motif d'annulation</p>
                <p style="margin:6px 0 0 0;font-size:14px;color:#374151;">${safeCancellationReason}</p>
              </td></tr>` : '';

  const bodyBlock = resolvedBody ? `
          <tr><td style="padding:12px 40px 0 40px;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${resolvedBody}</p>
          </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${escapeHtml(resolvedSubject)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background-color:#7f1d1d;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#fca5a5;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">${safeOrgName}</p>
            <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">${safeHeaderTitle}</h1>
          </td>
        </tr>

        <tr><td style="padding:28px 40px 0 40px;">
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${resolvedIntro}</p>
        </td></tr>

        <tr>
          <td style="padding:24px 40px 0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
              <tr><td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Spectacle annulé</p>
                <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${safeShowTitle}</p>
                <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeCompanyName}</p>
              </td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Date &amp; heure</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeDateFormatted}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">à ${safeTimeFormatted}</p>
                  </td>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeVenueName}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeVenueCity}</p>
                  </td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:16px 24px;${safeCancellationReason ? 'border-bottom:1px solid #e5e7eb;' : ''}">
                <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Places annulées</p>
                <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${placesLabel}</p>
              </td></tr>
              ${reasonBlock}
            </table>
          </td>
        </tr>

        ${buildCtaBlock(safeCtaText, config.catalogueUrl)}
        ${bodyBlock}
        ${buildInfoBlock(resolvedInfo, '#7f1d1d', '#fef2f2', '#fecaca')}
        ${buildContactBlock(template, data.managerName, data.managerEmail, data.managerPhone)}
        ${buildSignatureBlock(safeSalutation, safeSignature)}
        ${buildFooterRow(safeFooterText)}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildModificationHtml(
  data: ReservationModificationEmailData,
  config: EmailConfig,
  template: EmailTemplate,
  appUrl: string
): string {
  const showUrl     = `${appUrl}/spectacle/${data.showSlug}`;
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const rawVars: EmailTemplateVariables = {
    prénom: extractFirstName(data.guestFullName), nom: data.guestFullName,
    spectacle: data.showTitle, date: data.newSlotDateFormatted, heure: data.newSlotTimeFormatted,
    lieu: data.venueName, organisation: config.organizationName,
  };
  const htmlVars: EmailTemplateVariables = {
    prénom: escapeHtml(extractFirstName(data.guestFullName)), nom: escapeHtml(data.guestFullName),
    spectacle: escapeHtml(data.showTitle), date: escapeHtml(data.newSlotDateFormatted),
    heure: escapeHtml(data.newSlotTimeFormatted), lieu: escapeHtml(data.venueName),
    organisation: escapeHtml(config.organizationName),
  };

  const resolvedSubject     = resolveTemplateVariables(template.subject,      rawVars);
  const resolvedHeaderTitle = resolveTemplateVariables(template.header_title, rawVars);
  const resolvedIntro       = textToHtml(resolveTemplateVariables(template.intro_text, htmlVars));
  const resolvedBody        = textToHtml(resolveTemplateVariables(template.body_text,  htmlVars));
  const resolvedInfo        = resolveTemplateVariables(template.info_text,  htmlVars);
  const resolvedSalutation  = resolveTemplateVariables(template.salutation, rawVars);
  const resolvedCtaText     = resolveTemplateVariables(template.cta_text,   rawVars);

  const safeOrgName     = escapeHtml(config.organizationName);
  const safeHeaderTitle = escapeHtml(resolvedHeaderTitle);
  const safeShowTitle   = escapeHtml(data.showTitle);
  const safeCompanyName = escapeHtml(data.companyName);
  const safeVenueName   = escapeHtml(data.venueName);
  const safeVenueCity   = escapeHtml(data.venueCity);
  const safeOldDate    = escapeHtml(data.oldSlotDateFormatted);
  const safeOldTime    = escapeHtml(data.oldSlotTimeFormatted);
  const safeNewDate    = escapeHtml(data.newSlotDateFormatted);
  const safeNewTime    = escapeHtml(data.newSlotTimeFormatted);
  const safeSalutation = escapeHtml(resolvedSalutation);
  const safeCtaText    = escapeHtml(resolvedCtaText);
  const safeSignature  = escapeHtml(config.signature);
  const safeFooterText = escapeHtml(config.footerText);

  const bodyBlock = resolvedBody ? `
          <tr><td style="padding:12px 40px 0 40px;">
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${resolvedBody}</p>
          </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${escapeHtml(resolvedSubject)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background-color:#1e40af;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#bfdbfe;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">${safeOrgName}</p>
            <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">${safeHeaderTitle}</h1>
          </td>
        </tr>

        <tr><td style="padding:28px 40px 0 40px;">
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${resolvedIntro}</p>
        </td></tr>

        <tr><td style="padding:24px 40px 0 40px;">
          <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Ancien créneau</p>
          <div style="background-color:#f3f4f6;border-radius:8px;border:1px solid #e5e7eb;padding:14px 18px;">
            <p style="margin:0;font-size:14px;color:#9ca3af;text-decoration:line-through;">${safeOldDate} à ${safeOldTime}</p>
          </div>
        </td></tr>

        <tr>
          <td style="padding:12px 40px 0 40px;">
            <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Nouveau créneau</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;overflow:hidden;">
              <tr><td style="padding:20px 24px;border-bottom:1px solid #bfdbfe;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Spectacle</p>
                <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${safeShowTitle}</p>
                <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeCompanyName}</p>
              </td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid #bfdbfe;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Date &amp; heure</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeNewDate}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">à ${safeNewTime}</p>
                  </td>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeVenueName}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeVenueCity}</p>
                  </td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:16px 24px;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Places réservées</p>
                <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${placesLabel}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        ${buildCtaBlock(safeCtaText, showUrl)}
        ${bodyBlock}
        ${buildInfoBlock(resolvedInfo)}
        ${buildContactBlock(template, data.managerName, data.managerEmail, data.managerPhone)}
        ${buildSignatureBlock(safeSalutation, safeSignature)}
        ${buildFooterRow(safeFooterText)}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminNotificationHtml(
  data: AdminNotificationEmailData,
  config: EmailConfig,
  template: EmailTemplate,
  appUrl: string
): string {
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const rawVars: EmailTemplateVariables = {
    spectacle: data.showTitle, organisation: config.organizationName,
  };

  const resolvedHeaderPrefix = resolveTemplateVariables(template.header_title, rawVars);
  const resolvedCtaText      = resolveTemplateVariables(template.cta_text,     rawVars);

  const eventStyles = {
    new_reservation: { title: 'Nouvelle réservation',     color: '#166534', bgColor: '#f0fdf4', borderColor: '#bbf7d0', icon: '✅' },
    cancellation:    { title: 'Annulation de réservation', color: '#7f1d1d', bgColor: '#fef2f2', borderColor: '#fecaca', icon: '❌' },
    modification:    { title: 'Modification de réservation', color: '#1e40af', bgColor: '#eff6ff', borderColor: '#bfdbfe', icon: '✏️' },
  };

  const style     = eventStyles[data.eventType];
  const detailUrl = `${appUrl}/admin/reservations?reservationId=${data.reservationId}`;

  const safeOrgName             = escapeHtml(config.organizationName);
  const safeHeaderPrefix        = escapeHtml(resolvedHeaderPrefix);
  const safeCtaText             = escapeHtml(resolvedCtaText);
  const safeGuestFullName       = escapeHtml(data.guestFullName);
  const safeGuestEmail          = escapeHtml(data.guestEmail);
  const safeGuestStructure      = escapeHtml(data.guestStructure);
  const safeShowTitle           = escapeHtml(data.showTitle);
  const safeVenueName           = escapeHtml(data.venueName);
  const safeSlotDateFormatted   = escapeHtml(data.slotDateFormatted);
  const safeSlotTimeFormatted   = escapeHtml(data.slotTimeFormatted);
  const safeCancellationReason  = escapeHtml(data.cancellationReason);
  const safeFooterText          = escapeHtml(config.footerText);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${style.icon} ${style.title} — ${safeOrgName}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <tr>
          <td style="background-color:#1e3a5f;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">${safeHeaderPrefix} — ${safeOrgName}</p>
            <h1 style="margin:10px 0 0 0;color:#ffffff;font-size:20px;font-weight:700;">${style.icon} ${style.title}</h1>
          </td>
        </tr>

        <tr><td style="padding:24px 40px 0 40px;">
          <div style="background-color:${style.bgColor};border:1px solid ${style.borderColor};border-radius:8px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:${style.color};text-transform:uppercase;letter-spacing:1px;">Professionnel</p>
            <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${safeGuestFullName}</p>
            <p style="margin:2px 0 0 0;font-size:13px;color:#6b7280;">${safeGuestEmail}</p>
            ${safeGuestStructure ? `<p style="margin:2px 0 0 0;font-size:13px;color:#6b7280;">${safeGuestStructure}</p>` : ''}
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Spectacle</p>
              <p style="margin:4px 0 0 0;font-size:14px;font-weight:600;color:#111827;">${safeShowTitle}</p>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
              <table width="100%"><tr>
                <td width="50%">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Date &amp; heure</p>
                  <p style="margin:4px 0 0 0;font-size:13px;color:#111827;">${safeSlotDateFormatted} à ${safeSlotTimeFormatted}</p>
                </td>
                <td width="50%">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                  <p style="margin:4px 0 0 0;font-size:13px;color:#111827;">${safeVenueName}</p>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:16px 20px;${data.cancellationReason ? 'border-bottom:1px solid #e5e7eb;' : ''}">
              <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Places</p>
              <p style="margin:4px 0 0 0;font-size:13px;color:#111827;font-weight:600;">${placesLabel}</p>
            </td></tr>
            ${safeCancellationReason ? `
            <tr><td style="padding:16px 20px;background-color:#fef2f2;">
              <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Motif d'annulation</p>
              <p style="margin:4px 0 0 0;font-size:13px;color:#374151;">${safeCancellationReason}</p>
            </td></tr>` : ''}
          </table>
        </td></tr>

        ${buildCtaBlock(safeCtaText, detailUrl)}

        <tr>
          <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">Notification automatique — ${safeFooterText}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================
// FALLBACK TEMPLATE
// ============================================

function getFallbackTemplate(key: string): EmailTemplate {
  const defaults: Record<string, Partial<EmailTemplate>> = {
    reservation_confirmation: {
      header_title: 'Réservation confirmée ✓',
      subject: 'Votre réservation est confirmée — {{organisation}}',
      intro_text: 'Bonjour {{prénom}},\n\nVotre réservation pour {{spectacle}} a bien été enregistrée. Nous vous attendons avec plaisir !',
      body_text: '', info_text: 'Conservez cet email — il vous servira de justificatif le jour de la représentation.',
      salutation: 'À très bientôt,', cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion', show_contact_block: true, show_reservation_code: true,
    },
    reservation_cancellation: {
      header_title: 'Réservation annulée',
      subject: 'Annulation de votre réservation — {{organisation}}',
      intro_text: 'Bonjour {{prénom}},\n\nL\'annulation de votre réservation pour {{spectacle}} a bien été prise en compte.',
      body_text: 'Vous souhaitez découvrir d\'autres spectacles ? Consultez notre catalogue en ligne.', info_text: '',
      salutation: 'Cordialement,', cta_text: 'Voir le catalogue →',
      contact_block_title: 'Votre contact Derviche Diffusion', show_contact_block: true, show_reservation_code: false,
    },
    reservation_modification: {
      header_title: 'Créneau modifié ✓',
      subject: 'Modification de votre réservation — {{spectacle}}',
      intro_text: 'Bonjour {{prénom}},\n\nVotre réservation pour {{spectacle}} a bien été mise à jour avec le nouveau créneau ci-dessous.',
      body_text: '', info_text: 'Conservez cet email — il vous servira de justificatif le jour de la représentation.',
      salutation: 'À très bientôt,', cta_text: 'Voir le spectacle →',
      contact_block_title: 'Votre contact Derviche Diffusion', show_contact_block: true, show_reservation_code: false,
    },
    admin_notification: {
      header_title: 'Notification Admin', subject: '[{{organisation}}] {{spectacle}}',
      intro_text: '', body_text: '', info_text: '',
      salutation: '', cta_text: 'Voir dans l\'admin →',
      contact_block_title: '', show_contact_block: false, show_reservation_code: false,
    },
  };

  return {
    id: 'fallback', template_key: key as EmailTemplate['template_key'], name: key,
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    ...defaults[key],
  } as EmailTemplate;
}

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

export async function sendReservationConfirmationEmail(
  data: ReservationConfirmationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr';
  if (!apiKey) { logger.error('[email] RESEND_API_KEY manquante'); return { success: false, error: 'Configuration email manquante' }; }

  try {
    const [config, tplResult] = await Promise.all([getEmailConfig(), getEmailTemplate('reservation_confirmation')]);
    if (tplResult.error) logger.warn('[email] Fallback confirmation', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('reservation_confirmation');
    const html     = buildConfirmationHtml(data, config, template, appUrl);
    const subject  = resolveTemplateVariables(template.subject, { spectacle: data.showTitle, organisation: config.organizationName });

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`, to: data.to, replyTo: config.replyTo, subject, html,
    });

    if (error) { logger.error('[email] Erreur Resend confirmation', { error }); return { success: false, error: error.message }; }
    logger.info('[email] Confirmation envoyée', { messageId: result?.id, reservationId: data.reservationId });
    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendReservationConfirmationEmail', { message });
    return { success: false, error: message };
  }
}

export async function sendReservationCancellationEmail(
  data: ReservationCancellationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { logger.error('[email] RESEND_API_KEY manquante'); return { success: false, error: 'Configuration email manquante' }; }

  try {
    const [config, tplResult] = await Promise.all([getEmailConfig(), getEmailTemplate('reservation_cancellation')]);
    if (tplResult.error) logger.warn('[email] Fallback annulation', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('reservation_cancellation');
    const html     = buildCancellationHtml(data, config, template);
    const subject  = resolveTemplateVariables(template.subject, { spectacle: data.showTitle, organisation: config.organizationName });

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`, to: data.to, replyTo: config.replyTo, subject, html,
    });

    if (error) { logger.error('[email] Erreur Resend annulation', { error }); return { success: false, error: error.message }; }
    logger.info('[email] Annulation envoyée', { messageId: result?.id, reservationId: data.reservationId });
    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendReservationCancellationEmail', { message });
    return { success: false, error: message };
  }
}

export async function sendReservationModificationEmail(
  data: ReservationModificationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr';
  if (!apiKey) { logger.error('[email] RESEND_API_KEY manquante'); return { success: false, error: 'Configuration email manquante' }; }

  try {
    const [config, tplResult] = await Promise.all([getEmailConfig(), getEmailTemplate('reservation_modification')]);
    if (tplResult.error) logger.warn('[email] Fallback modification', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('reservation_modification');
    const html     = buildModificationHtml(data, config, template, appUrl);
    const subject  = resolveTemplateVariables(template.subject, { spectacle: data.showTitle, organisation: config.organizationName });

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`, to: data.to, replyTo: config.replyTo, subject, html,
    });

    if (error) { logger.error('[email] Erreur Resend modification', { error }); return { success: false, error: error.message }; }
    logger.info('[email] Modification envoyée', { messageId: result?.id, reservationId: data.reservationId });
    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendReservationModificationEmail', { message });
    return { success: false, error: message };
  }
}

export async function sendAdminNotificationEmail(
  data: AdminNotificationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr';
  if (!apiKey) { logger.error('[email] RESEND_API_KEY manquante'); return { success: false, error: 'Configuration email manquante' }; }

  try {
    const [config, tplResult] = await Promise.all([getEmailConfig(), getEmailTemplate('admin_notification')]);
    if (tplResult.error) logger.warn('[email] Fallback admin_notification', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('admin_notification');
    const html     = buildAdminNotificationHtml(data, config, template, appUrl);

    // Sujet lu depuis le template DB (comme les autres emails)
    // Variables disponibles : {{spectacle}}, {{organisation}}
    const rawSubjectVars: EmailTemplateVariables = {
      spectacle: data.showTitle,
      organisation: config.organizationName,
    };
    const subject = resolveTemplateVariables(template.subject, rawSubjectVars);

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`, to: data.to, replyTo: config.replyTo, subject, html,
    });

    if (error) { logger.error('[email] Erreur Resend notif admin', { error }); return { success: false, error: error.message }; }
    logger.info('[email] Notif admin envoyée', { messageId: result?.id, eventType: data.eventType, reservationId: data.reservationId });
    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendAdminNotificationEmail', { message });
    return { success: false, error: message };
  }
}
