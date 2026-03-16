/**
 * Fonctions Reservations pour le service Check-in
 * Derviche Diffusion
 *
 * Barrel re-export des sous-modules :
 * - reservations-fetch.ts : lecture des réservations d'un slot
 * - reservations-checkin.ts : mise à jour du statut check-in
 * - reservations-guest.ts : modification des infos guest
 */

export { getSlotReservations } from './reservations-fetch';
export { updateCheckinStatus } from './reservations-checkin';
export { updateGuestInfo } from './reservations-guest';
