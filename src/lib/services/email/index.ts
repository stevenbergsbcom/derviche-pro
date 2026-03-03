/**
 * Service Email — Point d'entrée
 * Derviche Diffusion
 *
 * Envoie les emails transactionnels via Resend.
 * Lit la configuration depuis app_settings (DB)
 * et les contenus depuis email_templates (DB).
 *
 * Sécurité : Ce module ne doit être importé que côté serveur (API routes).
 *
 * Structure :
 *   email/
 *   ├── index.ts              ← ce fichier (fonctions send...())
 *   ├── types.ts              ← interfaces de données
 *   ├── config.ts             ← getEmailConfig()
 *   ├── html-helpers.ts       ← escapeHtml, extractFirstName, build*Block
 *   ├── fallbacks.ts          ← getFallbackTemplate()
 *   └── builders/
 *       ├── confirmation.ts
 *       ├── cancellation.ts
 *       ├── modification.ts
 *       └── admin-notification.ts
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import {
  getEmailTemplate,
  resolveTemplateVariables,
  type EmailTemplateVariables,
} from '@/lib/services/email-templates';

import { getEmailConfig } from './config';
import { getFallbackTemplate } from './fallbacks';
import { buildConfirmationHtml }      from './builders/confirmation';
import { buildCancellationHtml }      from './builders/cancellation';
import { buildModificationHtml }      from './builders/modification';
import { buildAdminNotificationHtml } from './builders/admin-notification';
import type {
  ReservationConfirmationEmailData,
  ReservationCancellationEmailData,
  ReservationModificationEmailData,
  AdminNotificationEmailData,
  SendEmailResult,
} from './types';

// ─── Re-exports publics (pour la compatibilité des imports existants) ───────
export type {
  ManagerContact,
  ReservationConfirmationEmailData,
  ReservationCancellationEmailData,
  ReservationModificationEmailData,
  AdminNotificationEmailData,
  SendEmailResult,
} from './types';

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

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
    const [config, tplResult] = await Promise.all([
      getEmailConfig(),
      getEmailTemplate('reservation_confirmation'),
    ]);
    if (tplResult.error) logger.warn('[email] Fallback confirmation', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('reservation_confirmation');
    const html     = buildConfirmationHtml(data, config, template, appUrl);
    const subject  = resolveTemplateVariables(template.subject, {
      spectacle: data.showTitle, organisation: config.organizationName,
    });

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend confirmation', { error });
      return { success: false, error: error.message };
    }
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
  if (!apiKey) {
    logger.error('[email] RESEND_API_KEY manquante');
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const [config, tplResult] = await Promise.all([
      getEmailConfig(),
      getEmailTemplate('reservation_cancellation'),
    ]);
    if (tplResult.error) logger.warn('[email] Fallback annulation', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('reservation_cancellation');
    const html     = buildCancellationHtml(data, config, template);
    const subject  = resolveTemplateVariables(template.subject, {
      spectacle: data.showTitle, organisation: config.organizationName,
    });

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend annulation', { error });
      return { success: false, error: error.message };
    }
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
  if (!apiKey) {
    logger.error('[email] RESEND_API_KEY manquante');
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const [config, tplResult] = await Promise.all([
      getEmailConfig(),
      getEmailTemplate('reservation_modification'),
    ]);
    if (tplResult.error) logger.warn('[email] Fallback modification', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('reservation_modification');
    const html     = buildModificationHtml(data, config, template, appUrl);
    const subject  = resolveTemplateVariables(template.subject, {
      spectacle: data.showTitle, organisation: config.organizationName,
    });

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend modification', { error });
      return { success: false, error: error.message };
    }
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
  if (!apiKey) {
    logger.error('[email] RESEND_API_KEY manquante');
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const [config, tplResult] = await Promise.all([
      getEmailConfig(),
      getEmailTemplate('admin_notification'),
    ]);
    if (tplResult.error) logger.warn('[email] Fallback admin_notification', { error: tplResult.error });
    const template = tplResult.data ?? getFallbackTemplate('admin_notification');
    const html     = buildAdminNotificationHtml(data, config, template, appUrl);

    // Variables disponibles dans le sujet : {{spectacle}}, {{organisation}}, {{prénom}}, {{nom}}, {{événement}}
    const eventLabels: Record<typeof data.eventType, string> = {
      new_reservation: 'Nouvelle réservation',
      cancellation:    'Annulation',
      modification:    'Modification',
    };
    const rawSubjectVars: EmailTemplateVariables = {
      spectacle:    data.showTitle,
      organisation: config.organizationName,
      prénom:       data.guestFullName.trim().split(' ')[0] ?? data.guestFullName,
      nom:          data.guestFullName,
      événement:    eventLabels[data.eventType],
    };
    const subject = resolveTemplateVariables(template.subject, rawSubjectVars);

    const { data: result, error } = await new Resend(apiKey).emails.send({
      from: `${config.fromName} <${config.fromAddress}>`,
      to: data.to,
      replyTo: config.replyTo,
      subject,
      html,
    });

    if (error) {
      logger.error('[email] Erreur Resend notif admin', { error });
      return { success: false, error: error.message };
    }
    logger.info('[email] Notif admin envoyée', { messageId: result?.id, eventType: data.eventType, reservationId: data.reservationId });
    return { success: true, messageId: result?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[email] Exception sendAdminNotificationEmail', { message });
    return { success: false, error: message };
  }
}
