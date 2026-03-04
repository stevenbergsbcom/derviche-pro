/**
 * Queries — Service Notifications Admin
 * Derviche Diffusion
 *
 * Fonctions CRUD pour la table admin_notifications et admin_notification_reads.
 *
 * Deux contextes d'appel :
 *   1. createNotification() — appelé depuis les routes /api/emails/*
 *      → utilise le service role (INSERT non accessible aux authenticated, par design RLS)
 *   2. getNotifications(), getUnreadCount(), markAsRead(), markAllAsRead()
 *      → utilisent le client serveur SSR (session cookie admin)
 *      → appelés uniquement depuis /api/admin/notifications/*
 *
 * Sécurité :
 *   - createNotification() : service role, jamais exposé côté client
 *   - Toutes les lectures : protégées par RLS (is_admin_or_super)
 *   - admin_notification_reads : RLS filtre automatiquement par auth.uid()
 *     → is_read = true si une ligne existe pour (notification_id, current_user)
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
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

/** Ligne brute retournée par Supabase avec JOIN reads */
interface RawNotificationRow {
  id: string;
  type: string;
  reservation_id: string | null;
  professional_name: string;
  show_title: string;
  slot_date: string | null;
  message: string;
  created_at: string;
  /** Présent si LEFT JOIN — tableau vide = non lu par l'admin courant */
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
    // is_read = true si au moins une ligne existe dans reads pour cet admin
    // La RLS filtre automatiquement reads par user_id = auth.uid()
    is_read:           row.reads.length > 0,
  };
}

// ============================================
// CREATE — service role
// ============================================

/**
 * Crée une notification admin suite à un événement réservation.
 * Non-bloquant : une erreur de création ne doit jamais faire échouer l'email.
 *
 * À appeler depuis les routes /api/emails/* après un envoi réussi.
 *
 * @example
 * // Dans send-confirmation/route.ts, après l'envoi email :
 * await createAdminNotification({
 *   type: 'new_reservation',
 *   reservation_id: payload.reservationId,
 *   professional_name: payload.guestFullName,
 *   show_title: payload.showTitle,
 *   slot_date: slotIsoDate,
 *   message: `${payload.guestFullName} a réservé ${payload.numPlaces} place(s) pour ${payload.showTitle}`,
 * });
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
// READ — client serveur SSR (session admin)
// ============================================

/**
 * Récupère les notifications paginées avec le statut lu/non-lu
 * pour l'admin courant.
 *
 * Le JOIN avec admin_notification_reads est automatiquement filtré
 * par RLS (user_id = auth.uid()) : reads.length > 0 ↔ lu par cet admin.
 *
 * @param page - Numéro de page (1-indexed)
 * @param limit - Nombre de notifications par page (défaut : 20)
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

    // Fetch paginé avec count + LEFT JOIN reads (filtré par RLS)
    const { data, error, count } = await supabase
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

    if (error) {
      logger.error('[notifications/queries] Erreur getAdminNotifications', {
        error: error.message,
        page,
        limit,
      });
      return defaultResult;
    }

    const total = count ?? 0;
    const notifications = (data as unknown as RawNotificationRow[]).map(transformRow);

    // Compter les non-lus sur toutes les notifications (pas seulement la page courante)
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
 * Retourne uniquement le nombre de notifications non lues pour l'admin courant.
 * Utilisé par le badge de la sidebar (polling léger).
 */
export async function getAdminUnreadCount(): Promise<UnreadCountResult> {
  try {
    const supabase = await createServerClient();

    // Total de notifications
    const { count: totalCount, error: totalError } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      logger.error('[notifications/queries] Erreur getAdminUnreadCount total', {
        error: totalError.message,
      });
      return { count: 0 };
    }

    // Notifications lues par l'admin courant
    const { count: readCount, error: readError } = await supabase
      .from('admin_notification_reads')
      .select('*', { count: 'exact', head: true });

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
// MARK AS READ — client serveur SSR
// ============================================

/**
 * Marque une notification comme lue pour l'admin courant.
 * Upsert silencieux : si déjà lu, ne fait rien (ON CONFLICT ignoré).
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
 * Marque toutes les notifications comme lues pour l'admin courant.
 * Récupère d'abord tous les IDs non lus, puis fait un upsert batch.
 * Non-bloquant : une erreur partielle est loggée mais ne fait pas échouer la réponse.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const supabase = await createServerClient();

    // 1. Récupérer tous les IDs de notifications
    const { data: allNotifs, error: allError } = await supabase
      .from('admin_notifications')
      .select('id');

    if (allError || !allNotifs || allNotifs.length === 0) {
      if (allError) {
        logger.error('[notifications/queries] Erreur markAllAsRead - fetch IDs', {
          error: allError.message,
        });
      }
      return;
    }

    // 2. Upsert batch — ignoreDuplicates évite les erreurs sur les déjà-lus
    const rows = allNotifs.map((n) => ({
      notification_id: n.id,
      user_id: userId,
    }));

    const { error: upsertError } = await supabase
      .from('admin_notification_reads')
      .upsert(rows, {
        onConflict: 'notification_id,user_id',
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
