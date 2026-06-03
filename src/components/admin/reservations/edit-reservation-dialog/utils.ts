/**
 * Utilitaires pour EditReservationDialog
 * Derviche Diffusion - Session 111
 */

import { isValidEmail } from '@/lib/constants/validation';
import { formatDateFr, formatDateTimeFr } from '../reservation-helpers';
import { VALIDATION_MESSAGES, UNLIMITED_CAPACITY } from './constants';
import type { AdminReservation, UpdateReservationData, AvailableSlot } from './types';

// Réexport des fonctions de formatage pour usage dans les composants
export { formatDateFr, formatDateTimeFr };

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise les données du formulaire à partir d'une réservation existante
 *
 * S174 + Session B — `crmId` et `crmStructureId` ne sont inclus QUE pour les
 * résas guest (`userId === null`). Pour les résas avec compte, on volontairement
 * omet ces champs pour que la mutation `updateReservation` n'écrive PAS dans
 * `reservations.crm_id` / `reservations.crm_structure_id` :
 *  - la source de vérité est `profiles.crm_id` / `profiles.crm_structure_id`
 *    (affichée en lecture seule dans le dialog),
 *  - on évite d'écraser une éventuelle future valeur dénormalisée.
 */
export function initializeFormData(reservation: AdminReservation): UpdateReservationData {
  const isGuest = reservation.userId === null;
  return {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    email: reservation.email,
    phone: reservation.phone,
    emailSecondary: reservation.emailSecondary,
    phoneSecondary: reservation.phoneSecondary,
    address: reservation.address,
    postalCode: reservation.postalCode,
    city: reservation.city,
    organization: reservation.organization,
    function: reservation.function,
    afcNumber: reservation.afcNumber,
    // S174 + Session B — exposés uniquement pour les résas guest (cf. doc ci-dessus)
    ...(isGuest
      ? {
          crmId: reservation.crmId,
          crmStructureId: reservation.crmStructureId,
        }
      : {}),
    numPlaces: reservation.numPlaces,
    slotId: reservation.slotId,
    specialRequests: reservation.specialRequests,
    checkinComment: reservation.checkinComment,
    checkinVenueNotes: reservation.checkinVenueNotes,
    checkinInternalNotes: reservation.checkinInternalNotes,
  };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valide les données du formulaire et retourne les erreurs
 */
export function validateFormData(formData: UpdateReservationData | null): string[] {
  const errors: string[] = [];
  
  if (!formData) {
    errors.push(VALIDATION_MESSAGES.formNotInitialized);
    return errors;
  }
  
  if (!formData.firstName?.trim()) {
    errors.push(VALIDATION_MESSAGES.firstNameRequired);
  }
  
  if (!formData.lastName?.trim()) {
    errors.push(VALIDATION_MESSAGES.lastNameRequired);
  }
  
  if (!formData.email?.trim()) {
    errors.push(VALIDATION_MESSAGES.emailRequired);
  } else if (!isValidEmail(formData.email)) {
    errors.push(VALIDATION_MESSAGES.emailInvalid);
  }
  
  if (!formData.numPlaces || formData.numPlaces < 1) {
    errors.push(VALIDATION_MESSAGES.numPlacesMin);
  }
  
  if (!formData.slotId) {
    errors.push(VALIDATION_MESSAGES.slotRequired);
  }
  
  return errors;
}

// ============================================
// FORMATAGE CRÉNEAUX
// ============================================

/**
 * Vérifie si un créneau a une capacité illimitée
 */
export function isUnlimitedCapacity(capacity: number): boolean {
  return capacity >= UNLIMITED_CAPACITY;
}

/**
 * Formate l'affichage de la capacité disponible
 */
export function formatAvailableCapacity(slot: AvailableSlot): string {
  return isUnlimitedCapacity(slot.capacity) ? '∞' : String(slot.remainingCapacity);
}

/**
 * Formate l'option d'un créneau pour le Select
 */
export function formatSlotOption(slot: AvailableSlot): string {
  const available = formatAvailableCapacity(slot);
  const venueName = slot.venue?.name || 'Lieu ?';
  return `${formatDateFr(slot.date)} ${slot.time} — ${venueName} (${available} dispo)`;
}

// ============================================
// HELPERS DIALOG
// ============================================

/**
 * Construit la description du dialog à partir de la réservation
 */
export function buildDialogDescription(reservation: AdminReservation | null): string {
  if (!reservation?.slot) return '';
  
  const showTitle = reservation.slot.show?.title || '';
  const date = reservation.slot.date ? formatDateFr(reservation.slot.date) : '';
  const time = reservation.slot.time || '';
  
  return `${showTitle} — ${date} à ${time}`;
}
