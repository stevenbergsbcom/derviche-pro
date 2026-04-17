/**
 * Builder HTML — Confirmation de réservation
 * Derviche Diffusion
 */

import {
  resolveTemplateVariables,
  textToHtml,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';
import type { EmailConfig } from '../config';
import type { ReservationConfirmationEmailData } from '../types';
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

export function buildConfirmationHtml(
  data: ReservationConfirmationEmailData,
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
  // `isSafeUrl` agit comme type guard, mais le narrowing ne survit pas à
  // travers `useDervicheSite` (variable intermédiaire). Le `!` est donc
  // requis pour TS — il est sûr grâce au `&&` qui précède.
  const ctaUrl = useDervicheSite ? data.dervisheSiteUrl! : internalShowUrl;
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
  // Libellé unique du CTA : cta_text s'applique peu importe l'URL (interne vs externe).
  const resolvedCtaText     = resolveTemplateVariables(template.cta_text, rawVars);

  // Bloc « Gérer ma réservation » (optionnel, conditionnel compte/guest).
  const manageBlock = buildManageReservationBlock({
    template,
    data,
    config,
    appUrl,
    htmlVars,
    rawVars,
  });

  const safeOrgName      = escapeHtml(config.organizationName);
  const safeHeaderTitle  = escapeHtml(resolvedHeaderTitle);
  const safeShowTitle    = escapeHtml(data.showTitle);
  const safeCompanyName  = escapeHtml(data.companyName);
  const venueLines = buildVenueLines(
    data.venueName,
    data.venueCity,
    data.venueAddress,
    data.venuePostalCode,
  );
  const safeCode         = escapeHtml(data.reservationCode);
  const safeDateFormatted = escapeHtml(data.slotDateFormatted);
  const safeTimeFormatted = escapeHtml(data.slotTimeFormatted);
  const safeSalutation   = escapeHtml(resolvedSalutation);
  const safeCtaText      = escapeHtml(resolvedCtaText);
  const safeSignature    = escapeHtml(config.signature);
  const safeFooterText   = escapeHtml(config.footerText);

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
                    ${venueLines}
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

        ${buildCtaBlock(safeCtaText, ctaUrl)}
        ${manageBlock}
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

// ============================================
// BLOC « GÉRER MA RÉSERVATION » (optionnel)
// ============================================

interface ManageReservationContext {
  template: EmailTemplate;
  data: ReservationConfirmationEmailData;
  config: EmailConfig;
  appUrl: string;
  htmlVars: EmailTemplateVariables;
  rawVars: EmailTemplateVariables;
}

/**
 * Construit un bloc conditionnel affiché sous le CTA principal :
 *   • Compte pro → bouton secondaire vers /professional/reservations.
 *   • Guest      → paragraphe + bouton mailto pré-rempli.
 *
 * Retourne une chaîne vide si le toggle est désactivé ou si aucune adresse
 * de contact n'est disponible pour les guests.
 */
function buildManageReservationBlock(ctx: ManageReservationContext): string {
  if (!ctx.template.show_manage_reservation_link) return '';

  const isGuest = ctx.data.userId === null;

  // ── Compte pro ──
  if (!isGuest) {
    const labelRaw = resolveTemplateVariables(
      ctx.template.manage_reservation_link_text,
      ctx.rawVars,
    );
    const safeLabel = escapeHtml(labelRaw);
    const href = `${ctx.appUrl}/professional/reservations`;
    // Gris anthracite pour distinguer du CTA primaire bleu.
    return buildCtaBlock(safeLabel, href, '#4b5563');
  }

  // ── Guest ──
  const contactEmail =
    ctx.data.managerEmail ||
    ctx.config.organizationContactEmail ||
    ctx.config.replyTo;

  if (!contactEmail) return '';

  const messageRaw = resolveTemplateVariables(
    ctx.template.guest_contact_message,
    ctx.htmlVars,
  );
  const message = textToHtml(messageRaw);

  const subject = `Modification réservation ${ctx.data.reservationCode}`;
  const body =
    `Bonjour,\n\n` +
    `Je souhaite modifier ou annuler ma réservation :\n` +
    `- Code : ${ctx.data.reservationCode}\n` +
    `- Spectacle : ${ctx.data.showTitle}\n` +
    `- Date : ${ctx.data.slotDateFormatted} à ${ctx.data.slotTimeFormatted}\n\n` +
    `Merci,\n${ctx.data.guestFullName}`;

  const mailto =
    `mailto:${encodeURIComponent(contactEmail)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  return `
        <tr>
          <td style="padding:16px 40px 0 40px;">
            <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${message}</p>
          </td>
        </tr>
        ${buildCtaBlock('Nous contacter', mailto, '#4b5563')}`;
}
