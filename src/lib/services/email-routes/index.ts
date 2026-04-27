/**
 * email-routes — helpers partagés pour les routes API d'envoi d'emails
 * Derviche Diffusion
 *
 * Factorise les patterns répétés dans les 5 routes /api/emails/send-* :
 *   - Rate-limit (emails)                  → rate-limit.ts
 *   - Chargement role + manager + recipient → reservation-loader.ts
 *   - Autorisation (owner/admin/externe/company) → authorization.ts
 *   - Envoi des notifs manager + custom    → admin-notifications.ts
 *   - Synchronisation Google Calendar      → calendar-sync.ts
 *
 * Les routes restent responsables de :
 *   - Validation Zod du payload entrant
 *   - Query principale vers la DB (select, joins)
 *   - Composition des données pour l'envoi de l'email principal
 *   - Création des notifications admin in-app (createAdminNotification)
 */

export { withEmailRateLimit } from './rate-limit';
export {
  resolveRecipient,
  resolveProfile,
  loadManager,
  loadUserRole,
} from './reservation-loader';
export { authorizeEmailRouteAccess } from './authorization';
export {
  sendAdminNotificationsForEvent,
  type AdminNotificationEventSettingKey,
} from './admin-notifications';
export {
  maybeCreateCalendarEvent,
  maybeUpdateCalendarEvent,
  maybeDeleteCalendarEvent,
} from './calendar-sync';
export type {
  AdminClient,
  AuthorizeContext,
  EmailRouteAuthOptions,
  EmailRecipient,
  ManagerInfo,
  ResolvedUserRole,
} from './types';
