/**
 * Queries — Service Notifications Admin
 * Derviche Diffusion
 *
 * Barrel re-export des sous-modules :
 *   - queries-fetch     : lecture (liste paginée, compteur non-lus)
 *   - queries-mutations : écriture (création, marquage lu, vidage)
 *   - queries-helpers   : helpers internes partagés
 */

export { getAdminNotifications, getAdminUnreadCount, getAdminUnreadCountFast } from './queries-fetch';

export {
  createAdminNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissAllNotifications,
} from './queries-mutations';
