/**
 * Index — Service Google Calendar
 * Derviche Diffusion
 *
 * Point d'entrée unique pour l'intégration Google Calendar.
 * Importer depuis '@/lib/services/google-calendar'.
 */

export { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './queries';
export type { CalendarEventData, CalendarResult } from './types';
