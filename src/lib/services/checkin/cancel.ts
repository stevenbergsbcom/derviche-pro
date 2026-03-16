/**
 * Fonctions Cancel pour le service Check-in
 * Derviche Diffusion
 *
 * Annulation et r\u00e9activation de r\u00e9servations depuis l'interface de check-in (PWA).
 *
 * Ce fichier est un barrel re-export. La logique est d\u00e9coup\u00e9e en :
 * - cancel-validation.ts : Validation et v\u00e9rification des permissions
 * - cancel-execution.ts  : Mutations DB (annulation, r\u00e9activation, logging)
 */

// Validation
export {
  validateCancelReservation,
  validateReactivateReservation,
} from './cancel-validation';
export type {
  CancelValidationResult,
  ReactivateValidationResult,
} from './cancel-validation';

// Execution
export {
  cancelReservationFromPWA,
  reactivateReservation,
} from './cancel-execution';
