/**
 * Service Check-in - Point d'entrée principal
 * Derviche Diffusion
 * 
 * Ce fichier ré-exporte toutes les fonctionnalités du service check-in
 * pour maintenir la rétrocompatibilité avec les imports existants.
 * 
 * Structure du dossier :
 * - types.ts      : Interfaces et types
 * - constants.ts  : Constantes (ADMIN_ROLES, MAX_PLACES, etc.)
 * - guards.ts     : Type guards pour validation
 * - helpers.ts    : Fonctions utilitaires (formatage, dates)
 * - shows.ts      : Gestion des spectacles accessibles
 * - slots.ts      : Gestion des représentations
 * - reservations.ts : Gestion des réservations et check-in
 * - transfer.ts   : Transfert de réservations
 * - create.ts     : Création de réservations
 * - cancel.ts     : Annulation et réactivation
 */

// ============================================
// TYPES
// ============================================
export type {
  // Types de base
  CheckinShow,
  CheckinSlot,
  CheckinReservation,
  // Types de résultat
  CheckinShowsResult,
  CheckinSlotsResult,
  CheckinReservationsResult,
  // Options et paramètres
  GetSlotsOptions,
  UpdateCheckinParams,
  UpdateCheckinResult,
  UpdateGuestInfoParams,
  UpdateGuestInfoResult,
  // Création
  CreateCheckinReservationData,
  CreateCheckinReservationResult,
  DuplicateCheckResult,
  // Transfert
  TransferReservationParams,
  SlotCapacityInfo,
  TransferReservationResult,
  TransferTargetSlot,
  TransferTargetSlotsResult,
  // Annulation et réactivation
  CancelReservationParams,
  CancelReservationResult,
  ReactivateReservationParams,
  ReactivateReservationResult,
} from './types';

// ============================================
// CONSTANTES
// ============================================
export {
  DEFAULT_PAST_DAYS_LIMIT,
  ADMIN_ROLES,
  VALID_HOSTED_BY,
  MAX_PLACES,
} from './constants';

// ============================================
// TYPE GUARDS
// ============================================
export {
  isValidCompany,
  isValidVenue,
  isValidShow,
  isValidHostedBy,
  isValidRawSlot,
  isValidRpcResult,
} from './guards';

// ============================================
// HELPERS
// ============================================
export {
  formatSlotDate,
  formatSlotTime,
  isSlotToday,
  isSlotPast,
  groupSlotsByDate,
  getTodayISO,
  getDateDaysAgo,
} from './helpers';

// ============================================
// FONCTIONS SHOWS
// ============================================
export {
  getAccessibleShows,
  canAccessSlot,
} from './shows';

// ============================================
// FONCTIONS SLOTS
// ============================================
export {
  getAccessibleSlots,
  checkSlotCapacity,
} from './slots';

// ============================================
// FONCTIONS RESERVATIONS
// ============================================
export {
  getSlotReservations,
  updateCheckinStatus,
  updateGuestInfo,
} from './reservations';

// ============================================
// FONCTIONS TRANSFER
// ============================================
export {
  transferReservation,
  getTransferTargetSlots,
} from './transfer';

// ============================================
// FONCTIONS CREATE
// ============================================
export {
  createReservationFromCheckin,
  checkDuplicateEmail,
} from './create';

// ============================================
// FONCTIONS CANCEL
// ============================================
export {
  cancelReservationFromPWA,
  reactivateReservation,
} from './cancel';

// ============================================
// RECHERCHE GLOBALE
// ============================================
export type { GlobalSearchResult, GlobalSearchResults } from './search';
export { searchReservations } from './search';
