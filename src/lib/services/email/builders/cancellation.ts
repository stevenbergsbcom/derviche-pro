/**
 * Builder HTML — Annulation de réservation
 * Derviche Diffusion
 */

import {
  resolveTemplateVariables,
  textToHtml,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';
import type { EmailConfig } from '../config';
import type { ReservationCancellationEmailData } from '../types';
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
} from '../html-helpers';

export function buildCancellationHtml(
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
  const venueLines             = buildVenueLines(
    data.venueName,
    data.venueCity,
    data.venueAddress,
    data.venuePostalCode,
  );
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
                    ${venueLines}
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
        ${buildFooterRow(safeFooterText, orgContactFromConfig(config))}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
