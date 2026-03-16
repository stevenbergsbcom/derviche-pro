/**
 * Queries — Service Rappels Email
 * Derviche Diffusion
 *
 * Barrel re-export des sous-modules queries.
 *
 * - queries-fetch   : sélection des réservations éligibles
 * - queries-claims  : optimistic lock (anti race condition)
 * - queries-utils   : client Supabase service role partagé
 */

export { getEligibleReservations } from './queries-fetch';
export {
  tryClaimReminder,
  updateReminderMessageId,
  releaseReminderClaim,
} from './queries-claims';
