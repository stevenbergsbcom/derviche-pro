/**
 * Index — Service Google Calendar
 * Derviche Diffusion
 *
 * Point d'entrée unique pour l'intégration Google Calendar.
 * Importer depuis '@/lib/services/google-calendar'.
 */

export { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './queries';
export { checkGoogleCalendarTokenHealth } from './health';
export { getGoogleRedirectUri, CALENDAR_SCOPE } from './auth';
export type { CalendarEventData, CalendarResult } from './types';
export type { GoogleCalendarHealthResult } from './health';
