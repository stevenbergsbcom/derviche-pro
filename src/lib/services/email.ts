/**
 * Service Email - Envoi d'emails transactionnels via Resend
 * Derviche Diffusion
 *
 * Lit la configuration expéditeur depuis app_settings (DB)
 * et utilise la clé API Resend depuis les variables d'environnement.
 *
 * Sécurité : Ce service ne doit être appelé que côté serveur (API routes).
 */

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface ReservationConfirmationEmailData {
  /** Email du destinataire */
  to: string;
  /** Prénom et nom du destinataire */
  guestFullName: string;
  /** Code de réservation (ex: DD-A7F3K9) */
  reservationCode: string;
  /** ID de la réservation */
  reservationId: string;
  /** Titre du spectacle */
  showTitle: string;
  /** Slug du spectacle */
  showSlug: string;
  /** Nom de la compagnie */
  companyName: string;
  /** Date formatée (ex: Mardi 15 janvier 2026) */
  slotDateFormatted: string;
  /** Heure formatée (ex: 11h00) */
  slotTimeFormatted: string;
  /** Nom du lieu */
  venueName: string;
  /** Ville du lieu */
  venueCity: string;
  /** Nombre de places */
  numPlaces: number;
}

export interface ReservationCancellationEmailData {
  /** Email du destinataire */
  to: string;
  /** Prénom et nom du destinataire */
  guestFullName: string;
  /** ID de la réservation */
  reservationId: string;
  /** Titre du spectacle */
  showTitle: string;
  /** Slug du spectacle */
  showSlug: string;
  /** Nom de la compagnie */
  companyName: string;
  /** Date formatée (ex: Mardi 15 janvier 2026) */
  slotDateFormatted: string;
  /** Heure formatée (ex: 11h00) */
  slotTimeFormatted: string;
  /** Nom du lieu */
  venueName: string;
  /** Ville du lieu */
  venueCity: string;
  /** Nombre de places */
  numPlaces: number;
  /** Motif d'annulation (optionnel) */
  cancellationReason?: string | null;
  /** Contact du manager Derviche (optionnel) */
  managerName?: string | null;
  /** Email du manager Derviche (optionnel) */
  managerEmail?: string | null;
  /** Téléphone du manager Derviche (optionnel) */
  managerPhone?: string | null;
}

/** Données pour la notification email admin */
export interface AdminNotificationEmailData {
  /** Email de l'admin destinataire */
  to: string;
  /** Prénom/nom de l'admin */
  adminName: string;
  /** Type d'événement */
  eventType: 'new_reservation' | 'cancellation' | 'modification';
  /** Prénom et nom du pro */
  guestFullName: string;
  /** Email du pro */
  guestEmail: string;
  /** Structure/organisation du pro */
  guestStructure?: string | null;
  /** Titre du spectacle */
  showTitle: string;
  /** Date formatée */
  slotDateFormatted: string;
  /** Heure formatée */
  slotTimeFormatted: string;
  /** Nom du lieu */
  venueName: string;
  /** Nombre de places */
  numPlaces: number;
  /** ID réservation */
  reservationId: string;
  /** Motif d'annulation (uniquement pour eventType = 'cancellation') */
  cancellationReason?: string | null;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Paramètres email lus depuis app_settings */
interface EmailConfig {
  fromName: string;
  fromAddress: string;
  replyTo: string;
  confirmationSubject: string;
  cancellationSubject: string;
  catalogueUrl: string;
  signature: string;
  footerText: string;
}

// ============================================
// HELPERS INTERNES
// ============================================

/**
 * Échappe les caractères HTML pour éviter les injections dans les templates email
 */
function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Lire la configuration email depuis app_settings
 * Utilise des valeurs par défaut si les clés ne sont pas en DB
 */
async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const supabase = await createClient();
    const keys = [
      'email_from_name',
      'email_from_address',
      'email_reply_to',
      'email_confirmation_subject',
      'email_cancellation_subject',
      'email_catalogue_url',
      'email_signature',
      'email_footer_text',
    ];

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      logger.error('[email] Erreur lecture app_settings', { error: error.message });
    }

    // Transformer en objet clé-valeur
    const settings: Record<string, string> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      if (typeof row.value === 'string') {
        settings[row.key] = row.value;
      }
    });

    return {
      fromName: settings['email_from_name'] ?? 'Derviche Diffusion',
      fromAddress: settings['email_from_address'] ?? 'reservations@derviche-pro.fr',
      replyTo: settings['email_reply_to'] ?? 'contact@derviche-pro.fr',
      confirmationSubject:
        settings['email_confirmation_subject'] ??
        'Votre réservation est confirmée — Derviche Diffusion',
      cancellationSubject:
        settings['email_cancellation_subject'] ??
        'Annulation de votre réservation — Derviche Diffusion',
      // ⚠️ À mettre à jour lors de la configuration du custom domaine derviche-pro.fr
      catalogueUrl:
        settings['email_catalogue_url'] ?? 'https://derviche-pro.vercel.app/catalogue',
      signature: settings['email_signature'] ?? "L'équipe Derviche Diffusion",
      footerText: settings['email_footer_text'] ?? 'Derviche Diffusion — contact@derviche-pro.fr',
    };
  } catch (err) {
    logger.error('[email] Exception getEmailConfig', { err });
    return {
      fromName: 'Derviche Diffusion',
      fromAddress: 'reservations@derviche-pro.fr',
      replyTo: 'contact@derviche-pro.fr',
      confirmationSubject: 'Votre réservation est confirmée — Derviche Diffusion',
      cancellationSubject: 'Annulation de votre réservation — Derviche Diffusion',
      catalogueUrl: 'https://derviche-pro.vercel.app/catalogue',
      signature: "L'équipe Derviche Diffusion",
      footerText: 'Derviche Diffusion — contact@derviche-pro.fr',
    };
  }
}

/**
 * Générer le HTML de l'email de confirmation
 */
function buildConfirmationHtml(
  data: ReservationConfirmationEmailData,
  config: EmailConfig,
  appUrl: string
): string {
  const showUrl = `${appUrl}/spectacle/${data.showSlug}`;
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';
  const safeGuestFullName = escapeHtml(data.guestFullName);
  const safeShowTitle = escapeHtml(data.showTitle);
  const safeCompanyName = escapeHtml(data.companyName);
  const safeVenueName = escapeHtml(data.venueName);
  const safeVenueCity = escapeHtml(data.venueCity);
  const safeSignature = escapeHtml(config.signature);
  const safeFooterText = escapeHtml(config.footerText);
  const safeReservationCode = escapeHtml(data.reservationCode);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.confirmationSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- En-tête bleu Derviche -->
          <tr>
            <td style="background-color:#1e3a5f;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Derviche Diffusion</p>
              <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">Réservation confirmée ✓</h1>
            </td>
          </tr>

          <!-- Code de réservation -->
          <tr>
            <td style="padding:28px 40px 0 40px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;">Code de réservation</p>
              <p style="margin:8px 0 0 0;font-size:28px;font-weight:700;color:#1e3a5f;letter-spacing:3px;">${safeReservationCode}</p>
            </td>
          </tr>

          <!-- Message de bienvenue -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                Bonjour <strong>${safeGuestFullName}</strong>,
              </p>
              <p style="margin:12px 0 0 0;color:#374151;font-size:15px;line-height:1.6;">
                Votre réservation pour <strong>${safeShowTitle}</strong> a bien été enregistrée.
                Nous vous attendons avec plaisir !
              </p>
            </td>
          </tr>

          <!-- Carte récapitulatif -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Spectacle</p>
                    <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${safeShowTitle}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeCompanyName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Date & heure</p>
                          <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${data.slotDateFormatted}</p>
                          <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">à ${data.slotTimeFormatted}</p>
                        </td>
                        <td width="50%" style="vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                          <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeVenueName}</p>
                          <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeVenueCity}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Places réservées</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${placesLabel}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bouton CTA -->
          <tr>
            <td style="padding:24px 40px 0 40px;text-align:center;">
              <a href="${showUrl}"
                style="display:inline-block;background-color:#1e3a5f;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                Voir le spectacle →
              </a>
            </td>
          </tr>

          <!-- Info spams -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.5;">
                  📧 Conservez cet email — il vous servira de justificatif le jour de la représentation.
                  Pensez à vérifier vos spams si vous ne l'avez pas reçu immédiatement.
                </p>
              </div>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:28px 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                À très bientôt,<br />
                <strong>${safeSignature}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${safeFooterText}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Générer le HTML de l'email d'annulation
 */
function buildCancellationHtml(
  data: ReservationCancellationEmailData,
  config: EmailConfig
): string {
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';
  const safeGuestFullName = escapeHtml(data.guestFullName);
  const safeShowTitle = escapeHtml(data.showTitle);
  const safeCompanyName = escapeHtml(data.companyName);
  const safeVenueName = escapeHtml(data.venueName);
  const safeVenueCity = escapeHtml(data.venueCity);
  const safeCancellationReason = escapeHtml(data.cancellationReason);
  const safeManagerName = escapeHtml(data.managerName);
  const safeManagerEmail = escapeHtml(data.managerEmail);
  const safeManagerPhone = escapeHtml(data.managerPhone);
  const safeSignature = escapeHtml(config.signature);
  const safeFooterText = escapeHtml(config.footerText);

  // Bloc contact manager (affiché seulement si les infos sont disponibles)
  const hasManagerContact = data.managerName || data.managerEmail || data.managerPhone;
  const managerBlock = hasManagerContact
    ? `
          <!-- Contact manager -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <div style="background-color:#faf9f6;border:1px solid #e5e0d0;border-radius:8px;padding:16px 20px;">
                <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Votre contact Derviche Diffusion</p>
                ${safeManagerName ? `<p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${safeManagerName}</p>` : ''}
                ${safeManagerEmail ? `<p style="margin:4px 0 0 0;font-size:13px;color:#374151;">✉ <a href="mailto:${safeManagerEmail}" style="color:#1e3a5f;text-decoration:none;">${safeManagerEmail}</a></p>` : ''}
                ${safeManagerPhone ? `<p style="margin:4px 0 0 0;font-size:13px;color:#374151;">📞 ${safeManagerPhone}</p>` : ''}
              </div>
            </td>
          </tr>`
    : '';

  // Bloc motif (affiché seulement si un motif est fourni)
  const reasonBlock = safeCancellationReason
    ? `
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Motif d'annulation</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#374151;">${safeCancellationReason}</p>
                  </td>
                </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.cancellationSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- En-tête rouge annulation -->
          <tr>
            <td style="background-color:#7f1d1d;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#fca5a5;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Derviche Diffusion</p>
              <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:24px;font-weight:700;">Réservation annulée</h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                Bonjour <strong>${safeGuestFullName}</strong>,
              </p>
              <p style="margin:12px 0 0 0;color:#374151;font-size:15px;line-height:1.6;">
                L'annulation de votre réservation pour <strong>${safeShowTitle}</strong> a bien été prise en compte.
              </p>
            </td>
          </tr>

          <!-- Carte récapitulatif -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Spectacle annulé</p>
                    <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${safeShowTitle}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeCompanyName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Date & heure</p>
                          <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${data.slotDateFormatted}</p>
                          <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">à ${data.slotTimeFormatted}</p>
                        </td>
                        <td width="50%" style="vertical-align:top;">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                          <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${safeVenueName}</p>
                          <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${safeVenueCity}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;${data.cancellationReason ? '' : ''}border-bottom:${data.cancellationReason ? '1px solid #e5e7eb' : 'none'};">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Places annulées</p>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${placesLabel}</p>
                  </td>
                </tr>
                ${reasonBlock}
              </table>
            </td>
          </tr>

          <!-- CTA re-réserver -->
          <tr>
            <td style="padding:24px 40px 0 40px;text-align:center;">
              <p style="margin:0 0 12px 0;color:#6b7280;font-size:14px;">Vous souhaitez découvrir d'autres spectacles ?</p>
              <a href="${config.catalogueUrl}"
                style="display:inline-block;background-color:#1e3a5f;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                Voir le catalogue →
              </a>
            </td>
          </tr>

          ${managerBlock}

          <!-- Signature -->
          <tr>
            <td style="padding:28px 40px ${hasManagerContact ? '0' : '28px'} 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                Cordialement,<br />
                <strong>${safeSignature}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${safeFooterText}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Générer le HTML de la notification email admin
 */
function buildAdminNotificationHtml(
  data: AdminNotificationEmailData,
  config: EmailConfig,
  appUrl: string
): string {
  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';

  const eventLabels = {
    new_reservation: { title: 'Nouvelle réservation', color: '#166534', bgColor: '#f0fdf4', borderColor: '#bbf7d0', icon: '✅' },
    cancellation: { title: 'Annulation de réservation', color: '#7f1d1d', bgColor: '#fef2f2', borderColor: '#fecaca', icon: '❌' },
    modification: { title: 'Modification de réservation', color: '#1e40af', bgColor: '#eff6ff', borderColor: '#bfdbfe', icon: '✏️' },
  };

  const eventStyle = eventLabels[data.eventType];
  const adminReservationsUrl = `${appUrl}/admin/reservations?reservationId=${data.reservationId}`;
  const safeAdminName = escapeHtml(data.adminName);
  const safeGuestFullName = escapeHtml(data.guestFullName);
  const safeGuestEmail = escapeHtml(data.guestEmail);
  const safeGuestStructure = escapeHtml(data.guestStructure);
  const safeShowTitle = escapeHtml(data.showTitle);
  const safeVenueName = escapeHtml(data.venueName);
  const safeCancellationReason = escapeHtml(data.cancellationReason);
  const safeFooterText = escapeHtml(config.footerText);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eventStyle.icon} ${eventStyle.title} — Derviche Diffusion</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- En-tête -->
          <tr>
            <td style="background-color:#1e3a5f;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Notification Admin — Derviche Diffusion</p>
              <h1 style="margin:10px 0 0 0;color:#ffffff;font-size:20px;font-weight:700;">${eventStyle.icon} ${eventStyle.title}</h1>
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <div style="background-color:${eventStyle.bgColor};border:1px solid ${eventStyle.borderColor};border-radius:8px;padding:16px 20px;margin-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0;font-size:11px;font-weight:700;color:${eventStyle.color};text-transform:uppercase;letter-spacing:1px;">Professionnel</p>
                      <p style="margin:4px 0 0 0;font-size:15px;font-weight:600;color:#111827;">${safeGuestFullName}</p>
                      <p style="margin:2px 0 0 0;font-size:13px;color:#6b7280;">${safeGuestEmail}</p>
                      ${safeGuestStructure ? `<p style="margin:2px 0 0 0;font-size:13px;color:#6b7280;">${safeGuestStructure}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Spectacle</p>
                    <p style="margin:4px 0 0 0;font-size:14px;font-weight:600;color:#111827;">${safeShowTitle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%">
                      <tr>
                        <td width="50%">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Date & heure</p>
                          <p style="margin:4px 0 0 0;font-size:13px;color:#111827;">${data.slotDateFormatted} à ${data.slotTimeFormatted}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Lieu</p>
                          <p style="margin:4px 0 0 0;font-size:13px;color:#111827;">${safeVenueName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;${data.cancellationReason ? 'border-bottom:1px solid #e5e7eb;' : ''}">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;">Places</p>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#111827;font-weight:600;">${placesLabel}</p>
                  </td>
                </tr>
                ${safeCancellationReason ? `
                <tr>
                  <td style="padding:16px 20px;background-color:#fef2f2;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;">Motif d'annulation</p>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#374151;">${safeCancellationReason}</p>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Bouton admin -->
          <tr>
            <td style="padding:20px 40px 28px 40px;text-align:center;">
              <a href="${adminReservationsUrl}"
                style="display:inline-block;background-color:#1e3a5f;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
                Voir dans l'admin →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">Notification automatique — ${safeFooterText}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Envoyer un email de confirmation de réservation
 * À appeler uniquement côté serveur (API routes)
 */
export async function sendReservationConfirmationEmail(
  data: ReservationConfirmationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr';

  if (!apiKey) {
    logger.error('[email] RESEND_API_KEY manquante');
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const config = await getEmailConfig();
    const html = buildConfirmationHtml(data, config, appUrl);
    const resend = new Resend(apiKey);

    const { data: result, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject: config.confirmationSubject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend confirmation', { error });
      return { success: false, error: error.message };
    }

    logger.info('[email] Confirmation envoyée', {
      messageId: result?.id,
      reservationId: data.reservationId,
    });

    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendReservationConfirmationEmail', { message });
    return { success: false, error: message };
  }
}

/**
 * Envoyer un email d'annulation de réservation
 * À appeler uniquement côté serveur (API routes)
 */
export async function sendReservationCancellationEmail(
  data: ReservationCancellationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.error('[email] RESEND_API_KEY manquante');
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const config = await getEmailConfig();
    const html = buildCancellationHtml(data, config);
    const resend = new Resend(apiKey);

    const { data: result, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject: config.cancellationSubject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend annulation', { error });
      return { success: false, error: error.message };
    }

    logger.info('[email] Annulation envoyée', {
      messageId: result?.id,
      reservationId: data.reservationId,
    });

    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendReservationCancellationEmail', { message });
    return { success: false, error: message };
  }
}

/**
 * Envoyer une notification email à un admin
 * À appeler uniquement côté serveur (API routes)
 */
export async function sendAdminNotificationEmail(
  data: AdminNotificationEmailData
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr';

  if (!apiKey) {
    logger.error('[email] RESEND_API_KEY manquante');
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const config = await getEmailConfig();
    const html = buildAdminNotificationHtml(data, config, appUrl);
    const resend = new Resend(apiKey);

    const eventLabels = {
      new_reservation: 'Nouvelle réservation',
      cancellation: 'Annulation',
      modification: 'Modification',
    };

    const subject = `[DD] ${eventLabels[data.eventType]} — ${data.guestFullName} pour ${data.showTitle}`;

    const { data: result, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend notification admin', { error });
      return { success: false, error: error.message };
    }

    logger.info('[email] Notification admin envoyée', {
      messageId: result?.id,
      eventType: data.eventType,
      reservationId: data.reservationId,
    });

    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendAdminNotificationEmail', { message });
    return { success: false, error: message };
  }
}
