/**
 * Builder HTML — Style sobre (post-checkin)
 * Derviche Diffusion — S144
 *
 * Génère un email au style "email personnel" :
 * fond blanc, texte noir, pas de header coloré, pas de bouton CTA flashy.
 * Utilisé pour les 4 templates post-checkin (is_simple_style = true).
 */

import {
  resolveTemplateVariables,
  textToHtml,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';
import type { EmailConfig } from '../config';
import type { CheckinFollowupEmailData } from '../types';
import {
  escapeHtml,
  extractFirstName,
  isSafeUrl,
  buildContactBlock,
  buildSignatureBlock,
  buildFooterRow,
} from '../html-helpers';

// ============================================
// HELPERS LOCAUX
// ============================================

/**
 * Formate la durée en minutes vers un libellé lisible.
 * Ex: 75 → "1h15", 60 → "1h00", 45 → "45 min"
 */
function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h00` : `${h}h${String(m).padStart(2, '0')}`;
}

// Ré-export pour usage externe (route API)
export { formatDuration };

// ============================================
// BUILDER PRINCIPAL
// ============================================

export function buildSimpleHtml(
  data: CheckinFollowupEmailData,
  config: EmailConfig,
  template: EmailTemplate,
): string {
  // --- Variables brutes (pour sujet, salutation, header_title) ---
  const rawVars: EmailTemplateVariables = {
    prénom:        extractFirstName(data.guestFullName),
    nom:           data.guestFullName,
    structure:     data.guestStructure ?? '',
    spectacle:     data.showTitle,
    compagnie:     data.companyName,
    date:          data.slotDateFormatted,
    heure:         data.slotTimeFormatted,
    lieu:          data.venueName,
    ville:         data.venueCity,
    synopsis:      data.synopsis ?? '',
    durée:         data.durationFormatted ?? '',
    public_cible:  data.targetAudiences ?? '',
    organisation:  config.organizationName,
  };

  // --- Variables HTML-escapées (pour intro_text, body_text) ---
  const htmlVars: EmailTemplateVariables = {
    prénom:        escapeHtml(extractFirstName(data.guestFullName)),
    nom:           escapeHtml(data.guestFullName),
    structure:     escapeHtml(data.guestStructure ?? ''),
    spectacle:     escapeHtml(data.showTitle),
    compagnie:     escapeHtml(data.companyName),
    date:          escapeHtml(data.slotDateFormatted),
    heure:         escapeHtml(data.slotTimeFormatted),
    lieu:          escapeHtml(data.venueName),
    ville:         escapeHtml(data.venueCity),
    synopsis:      escapeHtml(data.synopsis ?? ''),
    durée:         escapeHtml(data.durationFormatted ?? ''),
    public_cible:  escapeHtml(data.targetAudiences ?? ''),
    organisation:  escapeHtml(config.organizationName),
  };

  // --- Liens optionnels (S149) ---
  // Chaque lien n'est rendu que si le switch est ON ET que l'URL est renseignée
  const appUrl = config.appUrl ?? '';

  const folderLinkBlock = (template.show_folder_link && isSafeUrl(data.folderUrl))
    ? `<tr><td style="padding:16px 0 0 0;">
        <a href="${escapeHtml(data.folderUrl)}" style="color:#1e3a5f;font-size:14px;">📂 ${escapeHtml(template.folder_link_text)}</a>
       </td></tr>`
    : '';

  const teaserLinkBlock = (template.show_teaser_link && isSafeUrl(data.teaserUrl))
    ? `<tr><td style="padding:16px 0 0 0;">
        <a href="${escapeHtml(data.teaserUrl)}" style="color:#1e3a5f;font-size:14px;">🎬 ${escapeHtml(template.teaser_link_text)}</a>
       </td></tr>`
    : '';

  const captationLinkBlock = (template.show_captation_link && isSafeUrl(data.captationUrl))
    ? `<tr><td style="padding:16px 0 0 0;">
        <a href="${escapeHtml(data.captationUrl)}" style="color:#1e3a5f;font-size:14px;">🎥 ${escapeHtml(template.captation_link_text)}</a>
       </td></tr>`
    : '';

  const bookingLinkBlock = (template.show_booking_link && isSafeUrl(appUrl))
    ? `<tr><td style="padding:16px 0 0 0;">
        <a href="${escapeHtml(appUrl)}/spectacle/${encodeURIComponent(data.showSlug)}" style="color:#1e3a5f;font-size:14px;">🎭 ${escapeHtml(template.booking_link_text)}</a>
       </td></tr>`
    : '';

  const hasLinks = folderLinkBlock || teaserLinkBlock || captationLinkBlock || bookingLinkBlock;
  const linksBlock = hasLinks
    ? `<tr><td style="padding:20px 0 0 0;border-top:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${folderLinkBlock}${teaserLinkBlock}${captationLinkBlock}${bookingLinkBlock}
        </table>
       </td></tr>`
    : '';

  // --- Résolution des champs template ---
  const resolvedSubject    = resolveTemplateVariables(template.subject,     rawVars);
  const resolvedIntro      = textToHtml(resolveTemplateVariables(template.intro_text,  htmlVars));
  const resolvedBody       = textToHtml(resolveTemplateVariables(template.body_text,   htmlVars));
  const resolvedSalutation = resolveTemplateVariables(template.salutation,  rawVars);

  const safeFooterText = escapeHtml(config.footerText);
  const safeSalutation = escapeHtml(resolvedSalutation);
  const safeSignature  = escapeHtml(config.signature);

  // --- Bloc corps optionnel ---
  const bodyBlock = resolvedBody.trim() ? `
          <tr>
            <td style="padding:16px 0 0 0;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">${resolvedBody}</p>
            </td>
          </tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(resolvedSubject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:#ffffff;padding:40px 0;">

          <!-- Corps principal -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Intro -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">${resolvedIntro}</p>
                  </td>
                </tr>

                ${bodyBlock}

                <!-- Liens optionnels (S149) -->
                ${linksBlock}

                <!-- Bloc contact manager (conditionnel) -->
                <tr>
                  <td style="padding:24px 0 0 0;">
                    ${buildContactBlock(template, data.managerName, data.managerEmail, data.managerPhone)}
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding:8px 0 0 0;">
                    ${buildSignatureBlock(safeSalutation, safeSignature)}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          ${buildFooterRow(safeFooterText)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
