/**
 * Builder HTML — Notification admin
 * Derviche Diffusion
 */

import {
  resolveTemplateVariables,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';
import type { EmailTemplate } from '@/types/email-templates';
import type { EmailConfig } from '../config';
import type { AdminNotificationEmailData } from '../types';
import { escapeHtml, buildCtaBlock } from '../html-helpers';

export function buildAdminNotificationHtml(
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
    new_reservation: { title: 'Nouvelle réservation',      color: '#166534', bgColor: '#f0fdf4', borderColor: '#bbf7d0', icon: '✅' },
    cancellation:    { title: 'Annulation de réservation',  color: '#7f1d1d', bgColor: '#fef2f2', borderColor: '#fecaca', icon: '❌' },
    modification:    { title: 'Modification de réservation', color: '#1e40af', bgColor: '#eff6ff', borderColor: '#bfdbfe', icon: '✏️' },
  };

  const style     = eventStyles[data.eventType];
  const detailUrl = `${appUrl}/admin/reservations?reservationId=${data.reservationId}`;

  const safeOrgName            = escapeHtml(config.organizationName);
  const safeHeaderPrefix       = escapeHtml(resolvedHeaderPrefix);
  const safeCtaText            = escapeHtml(resolvedCtaText);
  const safeGuestFullName      = escapeHtml(data.guestFullName);
  const safeGuestEmail         = escapeHtml(data.guestEmail);
  const safeGuestStructure     = escapeHtml(data.guestStructure);
  const safeShowTitle          = escapeHtml(data.showTitle);
  const safeVenueName          = escapeHtml(data.venueName);
  const safeSlotDateFormatted  = escapeHtml(data.slotDateFormatted);
  const safeSlotTimeFormatted  = escapeHtml(data.slotTimeFormatted);
  const safeCancellationReason = escapeHtml(data.cancellationReason);
  const safeFooterText         = escapeHtml(config.footerText);

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
          <td style="height:24px;"></td>
        </tr>
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
