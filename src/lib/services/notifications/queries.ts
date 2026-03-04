/**
 * Queries — Service Notifications Admin
 * Derviche Diffusion
 *
 * Fonctions CRUD pour admin_notifications, admin_notification_reads,
 * et admin_notification_dismissals.
 *
 * Deux contextes d'appel :
 *   1. createAdminNotification() — appelé depuis les routes /api/emails/*
 *      → utilise le service role (INSERT non accessible aux authenticated, par design RLS)
 *   2. Toutes les autres fonctions
 *      → client serveur SSR (session cookie admin)
 *      → appelés depuis /api/admin/notifications/*
 *
 * Architecture "dismiss par timestamp" :
 *   - admin_notification_dismissals : une ligne par admin avec dismissed_at
 *   - On affiche uniquement les notifs créées APRÈS dismissed_at
 *   - Simple, pas d'upsert batch, pas de policy UPDATE complexe
 */

import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type {
  AdminNotification,
  CreateNotificationData,
  GetNotificationsResult,
  NotificationType,
  UnreadCountResult,
} from './types';

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_PAGE_LIMIT = 20;

// ============================================
// CLIENT SERVICE ROLE (write-only, côté serveur)
// ============================================

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[notifications/queries] Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes'
    );
  }

  return createSupabaseServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================
// TYPE INTERMÉDIAIRE (réponse brute Supabase)
// ============================================

interface RawNotificationRow {
  id: string;
  type: string;
  reservation_id: string | null;
  professional_name: string;
  show_title: string;
  slot_date: string | null;
  message: string;
  created_at: string;
  /** LEFT JOIN reads — tableau vide = non lu par l'admin courant */
  reads: Array<{ notification_id: string }>;
}

// ============================================
// HELPERS
// ============================================

/** Transforme une ligne brute en AdminNotification typée */
function transformRow(row: RawNotificationRow): AdminNotification {
  return {
    id:                row.id,
    type:              row.type as NotificationType,
    reservation_id:    row.reservation_id,
    professional_name: row.professional_name,
    show_title:        row.show_title,
    slot_date:         row.slot_date,
    message:           row.message,
    created_at:        row.created_at,
    // is_read = true si une ligne existe dans reads pour cet admin (RLS filtre par uid)
    is_read: row.reads.length > 0,
  };
}

/**
 * Récupère le dismissed_at de l'admin courant (ou null si jamais vidé).
 * Utilisé pour filtrer les notifications antérieures au dernier "Vider".
 */
async function getDismissedAt(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('admin_notification_dismissals')
    .select('dismissed_at')
    .single();

  if (error || !data) return null;
  return data.dismissed_at as string;
}

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
    const { count: unreadCount } = await getAdminUnreadCount();

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
 * Retourne le nombre de notifications non lues pour l'admin courant.
 * Tient compte du dismissed_at : ignore les notifs antérieures au dernier "Vider".
 */
export async function getAdminUnreadCount(): Promise<UnreadCountResult> {
  try {
    const supabase = await createServerClient();

    // Timestamp du dernier "Vider"
    const dismissedAt = await getDismissedAt(supabase);

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
// DISMISS ALL — nouvelle architecture timestamp
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
