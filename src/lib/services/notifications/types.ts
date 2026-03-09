/**
 * Types — Service Notifications Admin
 * Derviche Diffusion
 *
 * Types pour le système de notifications admin :
 * - badge non-lu dans la sidebar
 * - popover avec liste paginée
 * - marquage lu/non-lu individuel par admin
 */

// ============================================
// TYPES DE BASE
// ============================================

/** Type d'événement déclenchant une notification */
export type NotificationType =
  | 'new_reservation'
  | 'cancellation'
  | 'modification'
  | 'calendar_error';

// ============================================
// ENTITÉS
// ============================================

/**
 * Notification admin enrichie avec son statut de lecture
 * pour l'utilisateur courant.
 * `is_read` est calculé côté serveur via LEFT JOIN avec admin_notification_reads.
 */
export interface AdminNotification {
  id: string;
  type: NotificationType;
  reservation_id: string | null;
  professional_name: string;
  show_title: string;
  slot_date: string | null;
  message: string;
  created_at: string;
  /** true si l'admin courant a déjà lu cette notification */
  is_read: boolean;
}

// ============================================
// DONNÉES D'ENTRÉE
// ============================================

/**
 * Payload pour créer une nouvelle notification.
 * Appelé depuis les routes email après un événement réservation,
 * ou depuis le service Calendar en cas d'erreur.
 */
export interface CreateNotificationData {
  type: NotificationType;
  reservation_id?: string | null;
  professional_name: string;
  show_title: string;
  slot_date?: string | null;
  message: string;
}

// ============================================
// RÉSULTATS
// ============================================

/** Résultat paginé de getNotifications() */
export interface GetNotificationsResult {
  notifications: AdminNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

/** Résultat de getUnreadCount() */
export interface UnreadCountResult {
  count: number;
}

// ============================================
// TYPE GUARD
// ============================================

/** Vérifie qu'une chaîne est un NotificationType valide */
export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === 'string' &&
    ['new_reservation', 'cancellation', 'modification', 'calendar_error'].includes(value)
  );
}
