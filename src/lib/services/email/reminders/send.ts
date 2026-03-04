/**
 * Send — Service Rappels Email
 * Derviche Diffusion
 *
 * Envoi unitaire d'un rappel pour une réservation.
 * Orchestre : template DB → builder HTML → Resend → log sent_notifications.
 */

import { Resend } from 'resend';
import { getEmailTemplate } from '@/lib/services/email-templates';
import { getEmailConfig } from '../config';
import { getFallbackTemplate } from '../fallbacks';
import { buildReminder7dHtml }  from '../builders/reminder-7d';
import { buildReminder2dHtml }  from '../builders/reminder-2d';
import { buildReminder12hHtml } from '../builders/reminder-12h';
import { tryClaimReminder, updateReminderMessageId, releaseReminderClaim } from './queries';
import { logger } from '@/lib/logger';
import type { ReminderType, ReminderEmailData, ReminderResult } from './types';

// ============================================
// HELPERS
// ============================================

/** Récupère le template depuis la DB, avec fallback si inaccessible */
async function resolveTemplate(templateKey: ReminderType) {
  const result = await getEmailTemplate(templateKey);
  if (result.data) return result.data;
  logger.warn(`[reminders/send] Template "${templateKey}" introuvable en DB, utilisation du fallback`);
  return getFallbackTemplate(templateKey);
}

/** Sélectionne le bon builder selon le type de rappel */
function buildHtml(
  type: ReminderType,
  data: ReminderEmailData,
  config: Awaited<ReturnType<typeof getEmailConfig>>,
  template: Awaited<ReturnType<typeof resolveTemplate>>,
  appUrl: string
): string {
  switch (type) {
    case 'reminder_7d':  return buildReminder7dHtml(data,  config, template, appUrl);
    case 'reminder_2d':  return buildReminder2dHtml(data,  config, template, appUrl);
    case 'reminder_12h': return buildReminder12hHtml(data, config, template, appUrl);
  }
}

// ============================================
// ENVOI UNITAIRE
// ============================================

/**
 * Envoie un email de rappel pour une réservation donnée.
 * En cas de succès, enregistre dans sent_notifications (anti-doublon).
 *
 * @param type - Type de rappel ('reminder_7d' | 'reminder_2d' | 'reminder_12h')
 * @param data - Données de la réservation et du professionnel
 * @returns ReminderResult avec success, messageId ou error
 */
export async function sendReminderEmail(
  type: ReminderType,
  data: ReminderEmailData
): Promise<ReminderResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logger.error('[reminders/send] RESEND_API_KEY manquant');
    return {
      reservationId: data.reservationId,
      email: data.to,
      success: false,
      error: 'RESEND_API_KEY manquant',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.vercel.app';

  try {
    // 1. Claim du slot avant envoi (optimistic lock anti race condition)
    //    Si une autre instance cron a déjà pris ce slot → on saute proprement.
    const claimed = await tryClaimReminder(data.reservationId, type, data.to);
    if (!claimed) {
      logger.info('[reminders/send] Slot déjà réclamé — envoi ignoré', {
        type, reservationId: data.reservationId,
      });
      // On retourne success:true car ce n'est pas une erreur — l'email sera/a été envoyé
      return {
        reservationId: data.reservationId,
        email: data.to,
        success: true,
        messageId: 'skipped-already-claimed',
      };
    }

    // 2. Récupérer config + template en parallèle
    const [config, template] = await Promise.all([
      getEmailConfig(),
      resolveTemplate(type),
    ]);

    // 3. Construire le HTML
    const html = buildHtml(type, data, config, template, appUrl);

    // 4. Résoudre le subject
    const subject = template.subject
      .replace(/\{\{prénom\}\}/g,      data.guestFullName.split(' ')[0] ?? '')
      .replace(/\{\{nom\}\}/g,          data.guestFullName)
      .replace(/\{\{spectacle\}\}/g,    data.showTitle)
      .replace(/\{\{date\}\}/g,         data.slotDateFormatted)
      .replace(/\{\{heure\}\}/g,        data.slotTimeFormatted)
      .replace(/\{\{lieu\}\}/g,         data.venueName)
      .replace(/\{\{organisation\}\}/g, config.organizationName);

    // 5. Envoyer via Resend
    const resend = new Resend(resendApiKey);
    const { data: resendData, error: resendError } = await resend.emails.send({
      from:    `${config.fromName} <${config.fromAddress}>`,
      replyTo: config.replyTo || undefined,
      to:      [data.to],
      subject,
      html,
    });

    if (resendError || !resendData?.id) {
      const errMsg = resendError?.message ?? 'Erreur Resend inconnue';
      logger.error('[reminders/send] Échec Resend — libération du slot', {
        type, reservationId: data.reservationId, email: data.to, error: errMsg,
      });
      // Libérer le claim pour permettre un retry au prochain cron
      await releaseReminderClaim(data.reservationId, type);
      return {
        reservationId: data.reservationId,
        email: data.to,
        success: false,
        error: errMsg,
      };
    }

    // 6. Mettre à jour le messageId Resend (remplace 'pending')
    await updateReminderMessageId(data.reservationId, type, resendData.id);

    logger.info('[reminders/send] Rappel envoyé', {
      type, reservationId: data.reservationId, email: data.to, messageId: resendData.id,
    });

    return {
      reservationId: data.reservationId,
      email: data.to,
      success: true,
      messageId: resendData.id,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Exception inconnue';
    logger.error('[reminders/send] Exception', {
      type,
      reservationId: data.reservationId,
      error: errMsg,
    });
    return {
      reservationId: data.reservationId,
      email: data.to,
      success: false,
      error: errMsg,
    };
  }
}
