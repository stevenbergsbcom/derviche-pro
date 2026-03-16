/**
 * Queries Claims — Service Rappels Email
 * Derviche Diffusion
 *
 * Optimistic lock (anti race condition) pour l'envoi de rappels.
 * Gère le cycle claim → update → release via la table sent_notifications.
 *
 * Sécurité : utilise le service role Supabase (bypass RLS).
 *   Ce module ne doit être appelé que depuis les routes /api/cron/*.
 */

import { logger } from '@/lib/logger';
import type { ReminderType } from './types';
import { getServiceClient } from './queries-utils';

// ============================================
// OPTIMISTIC LOCK — ANTI RACE CONDITION
// ============================================

/**
 * Tente de "réclamer" le slot d'un rappel avant l'envoi (optimistic lock).
 *
 * Insère une ligne dans sent_notifications avec email_provider_id = 'pending'.
 * Si une contrainte unique (reservation_id, type) existe, l'insert échoue
 * silencieusement → une autre instance a déjà pris ce slot → on saute l'envoi.
 *
 * Flux recommandé :
 *   1. tryClaimReminder() → false = déjà pris, true = on continue
 *   2. sendReminderEmail() → succès ou échec
 *   3. Si succès : updateReminderMessageId()
 *   4. Si échec  : releaseReminderClaim() (pour permettre un retry)
 *
 * @returns true si le slot a été réclamé, false si déjà pris
 */
export async function tryClaimReminder(
  reservationId: string,
  type: ReminderType,
  recipientEmail: string,
): Promise<boolean> {
  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from('sent_notifications')
      .insert({
        reservation_id:    reservationId,
        type,
        recipient_email:   recipientEmail,
        email_provider_id: 'pending', // Marqueur temporaire — remplacé après l'envoi
      });

    if (error) {
      // Code 23505 = unique_violation (PostgreSQL)
      // → une autre instance a déjà inséré cette ligne → on saute
      if (error.code === '23505') {
        logger.info('[reminders/queries] Slot déjà réclamé par une autre instance', {
          reservationId, type,
        });
        return false;
      }
      // Autre erreur DB : on saute aussi par sécurité
      logger.error('[reminders/queries] Erreur tryClaimReminder', {
        error: error.message, reservationId, type,
      });
      return false;
    }

    return true;
  } catch (err) {
    logger.error('[reminders/queries] Exception tryClaimReminder', { err, reservationId, type });
    return false;
  }
}

/**
 * Met à jour email_provider_id avec le vrai ID Resend après un envoi réussi.
 * Remplace la valeur temporaire 'pending' insérée par tryClaimReminder().
 */
export async function updateReminderMessageId(
  reservationId: string,
  type: ReminderType,
  messageId: string,
): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('sent_notifications')
      .update({ email_provider_id: messageId })
      .eq('reservation_id', reservationId)
      .eq('type', type);

    if (error) {
      // Non-bloquant : l'email est envoyé, seul le tracking est incomplet
      logger.warn('[reminders/queries] Erreur mise à jour messageId (non-bloquant)', {
        error: error.message, reservationId, type,
      });
    }
  } catch (err) {
    logger.warn('[reminders/queries] Exception updateReminderMessageId', { err, reservationId, type });
  }
}

/**
 * Libère un slot réclamé si l'envoi a échoué.
 * Supprime la ligne 'pending' pour permettre un retry lors du prochain cron.
 */
export async function releaseReminderClaim(
  reservationId: string,
  type: ReminderType,
): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('sent_notifications')
      .delete()
      .eq('reservation_id', reservationId)
      .eq('type', type)
      .eq('email_provider_id', 'pending');

    if (error) {
      logger.warn('[reminders/queries] Erreur releaseReminderClaim', {
        error: error.message, reservationId, type,
      });
    }
  } catch (err) {
    logger.warn('[reminders/queries] Exception releaseReminderClaim', { err, reservationId, type });
  }
}
