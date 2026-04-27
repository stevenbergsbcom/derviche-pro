/**
 * Envoi des notifications email admin — routes email
 * Derviche Diffusion
 *
 * Factorise le bloc répété dans 3 routes email (confirmation, cancellation,
 * modification) :
 *   - Lecture des 3 settings app_settings liés à l'événement
 *   - Envoi de la notif au manager du spectacle (si activé)
 *   - Envoi de la notif à l'adresse personnalisée (si configurée)
 *   - Gestion non-bloquante des erreurs (catch → log warn/error)
 */

import { logger } from '@/lib/logger';
import {
  sendAdminNotificationEmail,
  type AdminNotificationEmailData,
} from '@/lib/services/email';
import type { AdminClient } from './types';

/** Clé du setting d'activation de la notification pour un événement donné. */
export type AdminNotificationEventSettingKey =
  | 'email_notification_new_reservation'
  | 'email_notification_cancellation'
  | 'email_notification_modification';

/**
 * Normalise les valeurs booléennes stockées dans app_settings.
 * Les settings peuvent être stockés comme string 'true' ou booléen true.
 */
const isBooleanSettingTrue = (val: unknown): boolean =>
  val === true || val === 'true' || String(val) === 'true';

/**
 * Envoie la notification email admin pour un événement donné.
 *
 * Non-bloquant : toutes les erreurs sont catchées et loggées, mais ne
 * remontent pas à l'appelant (ne doit jamais faire échouer la route).
 */
export async function sendAdminNotificationsForEvent(params: {
  adminClient: AdminClient;
  /** Clé du setting d'activation (ex: 'email_notification_new_reservation'). */
  eventSettingKey: AdminNotificationEventSettingKey;
  /** Données communes de la notification (sans destinataire). */
  baseNotifData: Omit<AdminNotificationEmailData, 'to' | 'adminName'>;
  /** Email du manager du spectacle (ou null si pas de manager). */
  managerEmail: string | null;
  /** Nom affiché du manager (fallback sur email si null). */
  managerName: string | null;
  /** Label utilisé dans les logs (ex: '[API /emails/send-confirmation]'). */
  routeLabel: string;
}): Promise<void> {
  const {
    adminClient,
    eventSettingKey,
    baseNotifData,
    managerEmail,
    managerName,
    routeLabel,
  } = params;

  try {
    const { data: notifSettings } = await adminClient
      .from('app_settings')
      .select('key, value')
      .in('key', [
        eventSettingKey,
        'email_notification_send_to_manager',
        'email_notification_custom_recipient',
      ]);

    const settingsMap = Object.fromEntries(
      (notifSettings ?? []).map((s) => [s.key, s.value]),
    );

    const notifEnabled = isBooleanSettingTrue(settingsMap[eventSettingKey]);
    // send_to_manager : default true si le setting n'existe pas
    const sendToManager = isBooleanSettingTrue(
      settingsMap.email_notification_send_to_manager ?? true,
    );
    const customRecipient =
      typeof settingsMap.email_notification_custom_recipient === 'string'
        ? settingsMap.email_notification_custom_recipient.trim()
        : '';

    if (!notifEnabled) return;
    if (!sendToManager && !customRecipient) return;

    // Notif manager
    if (sendToManager && managerEmail) {
      await sendAdminNotificationEmail({
        ...baseNotifData,
        to: managerEmail,
        adminName: managerName ?? managerEmail,
      }).catch((err) => {
        logger.error(`${routeLabel} Erreur notif manager`, { managerEmail, err });
      });
    }

    // Notif adresse personnalisée
    if (customRecipient) {
      await sendAdminNotificationEmail({
        ...baseNotifData,
        to: customRecipient,
        adminName: 'Administrateur',
      }).catch((err) => {
        logger.error(`${routeLabel} Erreur notif adresse personnalisée`, {
          customRecipient,
          err,
        });
      });
    }
  } catch (notifErr) {
    logger.error(`${routeLabel} Exception notif (non-bloquant)`, { notifErr });
  }
}
