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
  signature: string;
  footerText: string;
}

// ============================================
// HELPERS INTERNES
// ============================================

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
      signature: settings['email_signature'] ?? "L'équipe Derviche Diffusion",
      footerText: settings['email_footer_text'] ?? 'Derviche Diffusion — contact@derviche-pro.fr',
    };
  } catch (err) {
    logger.error('[email] Exception getEmailConfig', { err });
    // Retourner les valeurs par défaut en cas d'erreur
    return {
      fromName: 'Derviche Diffusion',
      fromAddress: 'reservations@derviche-pro.fr',
      replyTo: 'contact@derviche-pro.fr',
      confirmationSubject: 'Votre réservation est confirmée — Derviche Diffusion',
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
              <p style="margin:8px 0 0 0;font-size:28px;font-weight:700;color:#1e3a5f;letter-spacing:3px;">${data.reservationCode}</p>
            </td>
          </tr>

          <!-- Message de bienvenue -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                Bonjour <strong>${data.guestFullName}</strong>,
              </p>
              <p style="margin:12px 0 0 0;color:#374151;font-size:15px;line-height:1.6;">
                Votre réservation pour <strong>${data.showTitle}</strong> a bien été enregistrée.
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
                    <p style="margin:6px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${data.showTitle}</p>
                    <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${data.companyName}</p>
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
                          <p style="margin:6px 0 0 0;font-size:14px;color:#111827;font-weight:600;">${data.venueName}</p>
                          <p style="margin:2px 0 0 0;font-size:14px;color:#6b7280;">${data.venueCity}</p>
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
                <strong>${config.signature}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${config.footerText}</p>
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
      logger.error('[email] Erreur Resend', { error });
      return { success: false, error: error.message };
    }

    logger.info('[email] Confirmation envoyée', {
      messageId: result?.id,
      reservationId: data.reservationId,
      // Ne pas logger l'email pour la vie privée
    });

    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendReservationConfirmationEmail', { message });
    return { success: false, error: message };
  }
}
