/**
 * Index — Service Logs
 * Derviche Diffusion
 *
 * Point d'entrée unique pour le système de journalisation.
 * Importer depuis '@/lib/services/logs'.
 *
 * Toutes les fonctions sont non-bloquantes :
 * une erreur de log ne fait jamais échouer l'opération métier.
 */

export { logEmail, logCalendar, logSystem } from './queries';
export type {
  LogCategory,
  LogLevel,
  LogStatus,
  EmailAction,
  CalendarAction,
  EmailLogDetails,
  CalendarLogDetails,
  InsertLogParams,
} from './types';
