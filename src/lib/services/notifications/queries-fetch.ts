/**
 * Queries Fetch — Service Notifications Admin
 * Derviche Diffusion
 *
 * Fonctions de lecture : liste paginée et compteur non-lus.
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { GetNotificationsResult, UnreadCountResult } from './types';
import {
  DEFAULT_PAGE_LIMIT,
  getDismissedAt,
  transformRow,
  type RawNotificationRow,
} from './queries-helpers';

// ============================================
// READ — client serveur SSR
// ============================================

/**
 * Récupère les notifications paginées pour l'admin courant.
 * Exclut les notifications créées avant son dernier dismissed_at.
 */
export async function getAdminNotifications(
  page = 1,
  limit = DEFAULT_PAGE_LIMIT
): Promise<GetNotificationsResult> {
  const defaultResult: GetNotificationsResult = {
    notifications: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
    unreadCount: 0,
  };

  try {
    const supabase = await createServerClient();
    const from = (page - 1) * limit;
    const to   = from + limit - 1;

    // Récupérer le timestamp du dernier "Vider" de cet admin
    const dismissedAt = await getDismissedAt(supabase);

    // Construction de la query avec filtre dismissed_at si présent
    let query = supabase
      .from('admin_notifications')
      .select(
        `
        id,
        type,
        reservation_id,
        professional_name,
        show_title,
        slot_date,
        message,
        created_at,
        reads:admin_notification_reads(notification_id)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filtrer : uniquement les notifs créées APRÈS le dernier "Vider"
    if (dismissedAt) {
      query = query.gt('created_at', dismissedAt);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('[notifications/queries] Erreur getAdminNotifications', {
        error: error.message,
        page,
        limit,
      });
      return defaultResult;
    }

    const total         = count ?? 0;
    const notifications = (data as unknown as RawNotificationRow[]).map(transformRow);
    // Passe dismissedAt déjà chargé pour éviter un double appel DB
    const { count: unreadCount } = await getAdminUnreadCount(dismissedAt);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  } catch (err) {
    logger.error('[notifications/queries] Exception getAdminNotifications', { err });
    return defaultResult;
  }
}

/**
 * Version optimisée (1 seul aller-retour DB) du compteur de non-lus.
 * Appelle la RPC `get_admin_unread_count` (migration 127) qui fait le calcul
 * côté SQL via anti-join. Utilisée par le polling léger du badge pour réduire
 * la consommation Fluid CPU (l'ancien chemin faisait ~4 requêtes).
 *
 * Fallback : si la RPC échoue (non déployée, erreur), on retombe sur
 * `getAdminUnreadCount()` classique pour ne jamais casser le badge.
 */
export async function getAdminUnreadCountFast(): Promise<UnreadCountResult> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('get_admin_unread_count');

    if (error) {
      logger.warn('[notifications/queries] RPC get_admin_unread_count échec — fallback', {
        error: error.message,
      });
      return getAdminUnreadCount();
    }

    return { count: typeof data === 'number' ? data : 0 };
  } catch (err) {
    logger.error('[notifications/queries] Exception getAdminUnreadCountFast — fallback', { err });
    return getAdminUnreadCount();
  }
}

/**
 * Retourne le nombre de notifications non lues pour l'admin courant.
 * Tient compte du dismissed_at : ignore les notifs antérieures au dernier "Vider".
 * @param cachedDismissedAt - Si déjà récupéré par l'appelant, évite un double appel DB
 */
export async function getAdminUnreadCount(
  cachedDismissedAt?: string | null
): Promise<UnreadCountResult> {
  try {
    const supabase = await createServerClient();

    // Réutilise le timestamp si fourni par l'appelant, sinon le charge
    const dismissedAt = cachedDismissedAt !== undefined
      ? cachedDismissedAt
      : await getDismissedAt(supabase);

    // Total des notifs visibles par cet admin (après dismissed_at si présent)
    let totalQuery = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true });

    if (dismissedAt) {
      totalQuery = totalQuery.gt('created_at', dismissedAt);
    }

    const { count: totalCount, error: totalError } = await totalQuery;

    if (totalError) {
      logger.error('[notifications/queries] Erreur getAdminUnreadCount total', {
        error: totalError.message,
      });
      return { count: 0 };
    }

    // Notifs lues par cet admin, uniquement parmi les notifs visibles
    // (créées après dismissed_at) — on joint avec admin_notifications pour filtrer
    let readQuery = supabase
      .from('admin_notification_reads')
      .select('notification_id, admin_notifications!inner(created_at)', {
        count: 'exact',
        head: true,
      });

    if (dismissedAt) {
      readQuery = readQuery.gt('admin_notifications.created_at', dismissedAt);
    }

    const { count: readCount, error: readError } = await readQuery;

    if (readError) {
      logger.error('[notifications/queries] Erreur getAdminUnreadCount reads', {
        error: readError.message,
      });
      return { count: 0 };
    }

    return { count: Math.max(0, (totalCount ?? 0) - (readCount ?? 0)) };
  } catch (err) {
    logger.error('[notifications/queries] Exception getAdminUnreadCount', { err });
    return { count: 0 };
  }
}
