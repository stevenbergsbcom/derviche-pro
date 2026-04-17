/**
 * Builder HTML — Rappel H-4
 * Derviche Diffusion
 *
 * Email envoyé 4 heures avant la représentation.
 * Ton : enthousiaste, "c'est bientôt !".
 * Couleur : derviche blue (#1e3a5f) — cohérence avec la confirmation.
 */

import {
  resolveTemplateVariables,
  textToHtml,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';
import type { EmailConfig } from '../config';
import type { ReminderEmailData } from '../reminders/types';
import {
  escapeHtml,
  extractFirstName,
  buildContactBlock,
  buildInfoBlock,
  buildSignatureBlock,
  buildCtaBlock,
  buildFooterRow,
  buildVenueLines,
  orgContactFromConfig,
  isSafeUrl,
} from '../html-helpers';

export function buildReminder4hHtml(
  data: ReminderEmailData,
  config: EmailConfig,
  template: EmailTemplate,
  appUrl: string
): string {
  const internalShowUrl = `${appUrl}/spectacle/${data.showSlug}`;
  // Toggle show_derviche_site_link : CTA vers la page marketing si URL valide,
  // sinon fallback sur la fiche publique interne. Libellé reste `cta_text`.
  const useDervicheSite =
    template.show_derviche_site_link && isSafeUrl(data.dervisheSiteUrl);
  const showUrl = useDervicheSite ? data.dervisheSiteUrl! : internalShowUrl;
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const rawVars: EmailTemplateVariables = {
    prénom:       extractFirstName(data.guestFullName),
    nom:          data.guestFullName,
    spectacle:    data.showTitle,
    date:         data.slotDateFormatted,
    heure:        data.slotTimeFormatted,
    lieu:         data.venueName,
    organisation: config.organizationName,
  };
  const htmlVars: EmailTemplateVariables = {
    prénom:       escapeHtml(extractFirstName(data.guestFullName)),
    nom:          escapeHtml(data.guestFullName),
    spectacle:    escapeHtml(data.showTitle),
    date:         escapeHtml(data.slotDateFormatted),
    heure:        escapeHtml(data.slotTimeFormatted),
    lieu:         escapeHtml(data.venueName),
    organisation: escapeHtml(config.organizationName),
  };

  const resolvedSubject     = resolveTemplateVariables(template.subject,      rawVars);
  const resolvedHeaderTitle = resolveTemplateVariables(template.header_title, rawVars);
  const resolvedIntro       = textToHtml(resolveTemplateVariables(template.intro_text, htmlVars));
  const resolvedBody        = textToHtml(resolveTemplateVariables(template.body_text,  htmlVars));
  const resolvedInfo        = resolveTemplateVariables(template.info_text,   htmlVars);
  const resolvedSalutation  = resolveTemplateVariables(template.salutation,  rawVars);
  const resolvedCtaText     = resolveTemplateVariables(template.cta_text,    rawVars);

  const safeOrgName       = escapeHtml(config.organizationName);
  const safeHeaderTitle   = escapeHtml(resolvedHeaderTitle);
  const safeShowTitle     = escapeHtml(data.showTitle);
  const safeCompanyName   = escapeHtml(data.companyName);
  const venueLines        = buildVenueLines(
    data.venueName,
    data.venueCity,
    data.venueAddress,
    data.venuePostalCode,
  );
  const safeDateFormatted = escapeHtml(data.slotDateFormatted);
  const safeTimeFormatted = escapeHtml(data.slotTimeFormatted);
  const safeSalutation    = escapeHtml(resolvedSalutation);
  const safeCtaText       = escapeHtml(resolvedCtaText);
  const safeSignature     = escapeHtml(config.signature);
  const safeFooterText    = escapeHtml(config.footerText);

  // Couleur thème H-4 : derviche blue (cohérence avec email de confirmation)
  const headerBg      = '#1e3a5f';
  const accentColor   = '#1e3a5f';
  const subtitleColor = '#c9a84c'; // or derviche

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
          <td style="background-color:${headerBg};padding:32px 40px;text-align:center;">
            <p style="margin:0;color:${subtitleColor};font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">${safeOrgName}</p>
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
                <p style="margin:0;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1px;">Spectacle</p>
                <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${safeShowTitle}</p>
                <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeCompanyName}</p>
              </td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1px;">Date &amp; heure</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeDateFormatted}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">à ${safeTimeFormatted}</p>
                  </td>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                    ${venueLines}
                  </td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:16px 24px;">
                <p style="margin:0;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1px;">Places réservées</p>
                <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${placesLabel}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        ${buildCtaBlock(safeCtaText, showUrl)}
        ${bodyBlock}
        ${buildInfoBlock(resolvedInfo, '#1e3a5f', '#eef2f7', '#c5d3e8')}
        ${buildContactBlock(template, data.managerName, data.managerEmail, data.managerPhone)}
        ${buildSignatureBlock(safeSalutation, safeSignature)}
        ${buildFooterRow(safeFooterText, orgContactFromConfig(config))}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
