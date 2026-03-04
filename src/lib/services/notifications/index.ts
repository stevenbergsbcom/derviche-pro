/**
 * Index — Service Notifications Admin
 * Derviche Diffusion
 */

export type {
  AdminNotification,
  CreateNotificationData,
  GetNotificationsResult,
  NotificationType,
  UnreadCountResult,
} from './types';

export { isNotificationType } from './types';

export {
  createAdminNotification,
  getAdminNotifications,
  getAdminUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './queries';
