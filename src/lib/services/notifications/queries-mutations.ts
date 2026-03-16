/**
 * Queries Mutations — Service Notifications Admin
 * Derviche Diffusion
 *
 * Fonctions d'écriture : création, marquage lu, vidage (dismiss).
 *
 * Deux contextes d'appel :
 *   1. createAdminNotification() — utilise le service role
 *      (INSERT non accessible aux authenticated, par design RLS)
 *   2. Toutes les autres fonctions — client serveur SSR (session cookie admin)
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { CreateNotificationData } from './types';
import { getDismissedAt, getServiceClient } from './queries-helpers';

// ============================================
// CREATE — service role
// ============================================

/**
 * Crée une notification admin suite à un événement réservation.
 * Non-bloquant : une erreur ne fait jamais échouer l'email appelant.
 */
export async function createAdminNotification(
  data: CreateNotificationData
): Promise<void> {
  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        type:              data.type,
        reservation_id:    data.reservation_id ?? null,
        professional_name: data.professional_name,
        show_title:        data.show_title,
        slot_date:         data.slot_date ?? null,
        message:           data.message,
      });

    if (error) {
      logger.error('[notifications/queries] Erreur createAdminNotification', {
        error: error.message,
        type: data.type,
        reservation_id: data.reservation_id,
      });
    }
  } catch (err) {
    logger.error('[notifications/queries] Exception createAdminNotification', {
      err,
      type: data.type,
    });
  }
}

// ============================================
// MARK AS READ
// ============================================

/**
 * Marque une notification comme lue pour l'admin courant.
 * Upsert silencieux (ignoreDuplicates si déjà lu).
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('admin_notification_reads')
      .upsert(
        { notification_id: notificationId, user_id: userId },
        { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
      );

    if (error) {
      logger.error('[notifications/queries] Erreur markNotificationAsRead', {
        error: error.message,
        notificationId,
      });
    }
  } catch (err) {
    logger.error('[notifications/queries] Exception markNotificationAsRead', {
      err,
      notificationId,
    });
  }
}

/**
 * Marque toutes les notifications visibles comme lues pour l'admin courant.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const supabase = await createServerClient();

    // Récupérer uniquement les IDs visibles (après dismissed_at)
    const dismissedAt = await getDismissedAt(supabase);

    let notifQuery = supabase
      .from('admin_notifications')
      .select('id');

    if (dismissedAt) {
      notifQuery = notifQuery.gt('created_at', dismissedAt);
    }

    const { data: allNotifs, error: allError } = await notifQuery;

    if (allError || !allNotifs || allNotifs.length === 0) {
      if (allError) {
        logger.error('[notifications/queries] Erreur markAllAsRead - fetch IDs', {
          error: allError.message,
        });
      }
      return;
    }

    const rows = allNotifs.map((n) => ({
      notification_id: n.id,
      user_id:         userId,
    }));

    const { error: upsertError } = await supabase
      .from('admin_notification_reads')
      .upsert(rows, {
        onConflict:       'notification_id,user_id',
        ignoreDuplicates: true,
      });

    if (upsertError) {
      logger.error('[notifications/queries] Erreur markAllAsRead - upsert', {
        error: upsertError.message,
        count: rows.length,
      });
    }
  } catch (err) {
    logger.error('[notifications/queries] Exception markAllAsRead', { err });
  }
}

// ============================================
// DISMISS ALL — architecture timestamp
// ============================================

/**
 * Masque toutes les notifications pour l'admin courant.
 * Enregistre dismissed_at = NOW() dans admin_notification_dismissals.
 * Les notifs créées AVANT ce timestamp deviennent invisibles pour cet admin.
 * Les notifs créées APRÈS restent visibles.
 * Les autres admins ne sont pas affectés.
 */
export async function dismissAllNotifications(userId: string): Promise<void> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('admin_notification_dismissals')
      .upsert(
        { user_id: userId, dismissed_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) {
      logger.error('[notifications/queries] Erreur dismissAllNotifications', {
        error: error.message,
        userId,
      });
    }
  } catch (err) {
    logger.error('[notifications/queries] Exception dismissAllNotifications', { err });
  }
}
