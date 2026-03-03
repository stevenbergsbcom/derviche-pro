/**
 * Helpers HTML — Service Email
 * Derviche Diffusion
 *
 * Utilitaires partagés par tous les builders :
 * - escapeHtml / extractFirstName
 * - blocs HTML réutilisables (contact, info, signature, CTA, footer)
 */

import type { EmailTemplate } from '@/types/email-templates';

// ============================================
// UTILS TEXTE
// ============================================

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function extractFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0] ?? fullName;
}

// ============================================
// BLOCS HTML PARTAGÉS
// ============================================

/**
 * Bloc contact manager — conditionnel (show_contact_block + données présentes).
 */
export function buildContactBlock(
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
export function buildInfoBlock(
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
export function buildSignatureBlock(safeSalutation: string, safeSignature: string): string {
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
 * @param safeCtaText Texte du bouton (déjà échappé)
 * @param href        URL du bouton
 * @param color       Couleur de fond du bouton (hex)
 */
export function buildCtaBlock(safeCtaText: string, href: string, color = '#1e3a5f'): string {
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
export function buildFooterRow(safeFooterText: string): string {
  return `
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${safeFooterText}</p>
            </td>
          </tr>`;
}
