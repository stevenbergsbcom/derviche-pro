/**
 * Builder HTML — Modification de créneau
 * Derviche Diffusion
 */

import {
  resolveTemplateVariables,
  textToHtml,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';
import type { EmailConfig } from '../config';
import type { ReservationModificationEmailData } from '../types';
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

export function buildModificationHtml(
  data: ReservationModificationEmailData,
  config: EmailConfig,
  template: EmailTemplate,
  appUrl: string
): string {
  const internalShowUrl = `${appUrl}/spectacle/${data.showSlug}`;
  // Si le template active show_derviche_site_link ET que l'URL marketing est
  // valide (http/https), le CTA pointe vers dervichediffusion.com au lieu de
  // la fiche publique interne. Le libellé reste `cta_text` dans les deux cas.
  const useDervicheSite =
    template.show_derviche_site_link && isSafeUrl(data.dervisheSiteUrl);
  const showUrl = useDervicheSite ? data.dervisheSiteUrl! : internalShowUrl;
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const rawVars: EmailTemplateVariables = {
    prénom: extractFirstName(data.guestFullName), nom: data.guestFullName,
    spectacle: data.showTitle, date: data.newSlotDateFormatted, heure: data.newSlotTimeFormatted,
    lieu: data.venueName, ville: data.venueCity,
    adresse: data.venueAddress ?? '', code_postal: data.venuePostalCode ?? '',
    organisation: config.organizationName,
  };
  const htmlVars: EmailTemplateVariables = {
    prénom: escapeHtml(extractFirstName(data.guestFullName)), nom: escapeHtml(data.guestFullName),
    spectacle: escapeHtml(data.showTitle), date: escapeHtml(data.newSlotDateFormatted),
    heure: escapeHtml(data.newSlotTimeFormatted), lieu: escapeHtml(data.venueName),
    ville: escapeHtml(data.venueCity),
    adresse: escapeHtml(data.venueAddress ?? ''),
    code_postal: escapeHtml(data.venuePostalCode ?? ''),
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
  const venueLines      = buildVenueLines(
    data.venueName,
    data.venueCity,
    data.venueAddress,
    data.venuePostalCode,
  );
  const safeOldDate     = escapeHtml(data.oldSlotDateFormatted);
  const safeOldTime     = escapeHtml(data.oldSlotTimeFormatted);
  const safeNewDate     = escapeHtml(data.newSlotDateFormatted);
  const safeNewTime     = escapeHtml(data.newSlotTimeFormatted);
  const safeSalutation  = escapeHtml(resolvedSalutation);
  const safeCtaText     = escapeHtml(resolvedCtaText);
  const safeSignature   = escapeHtml(config.signature);
  const safeFooterText  = escapeHtml(config.footerText);

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
                    ${venueLines}
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
        ${buildFooterRow(safeFooterText, orgContactFromConfig(config))}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
