/**
 * Service des réservations pour l'espace professionnel
 * Permet à un programmateur connecté de consulter et annuler ses propres réservations
 *
 * @module pro-reservations
 */

// Types
export type {
  ProReservationStatus,
  ProReservationSlot,
  ProAvailableSlot,
  ProReservation,
  ProReservationResult,
  CancelResult,
  GuestReservation,
  GetGuestReservationsResult,
  ClaimReservationsResult,
  ProAvailableSlotsResult,
  ChangeSlotResult,
} from './types';

// Read/query functions
export { getMyReservations, getGuestReservations } from './list';

// Slot/availability queries
export { getProAvailableSlotsForShow } from './queries';

// Write functions
export { cancelMyReservation, changeMyReservationSlot, claimSelectedReservations } from './mutations';
