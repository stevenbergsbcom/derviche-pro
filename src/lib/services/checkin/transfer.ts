/**
 * Fonctions Transfer pour le service Check-in
 * Derviche Diffusion
 *
 * Gestion du transfert de réservations entre créneaux.
 *
 * Ce fichier ré-exporte les sous-modules :
 * - transfer-execution.ts : Mutation DB (transfert effectif)
 * - transfer-validation.ts : Récupération des créneaux cibles
 */

export { transferReservation } from './transfer-execution';
export { getTransferTargetSlots } from './transfer-validation';
