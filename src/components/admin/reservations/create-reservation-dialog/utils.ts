/**
 * Utilitaires pour CreateReservationDialog
 * Derviche Diffusion - Session 104
 */

import type { CreateAdminReservationData } from '@/lib/services/admin-reservations';
import type { AvailableSlot } from './types';
import { EMAIL_REGEX } from '@/lib/constants/validation';
import { VALIDATION_MESSAGES, UNLIMITED_CAPACITY } from './constants';

// ============================================
// VALIDATION
// ============================================

/**
 * Valide le formulaire de création de réservation
 * @returns Liste des erreurs (vide si valide)
 */
export function validateReservationForm(
  formData: CreateAdminReservationData,
  selectedShowId: string,
  maxPlaces: number,
  availableSlots: AvailableSlot[]
): string[] {
  const errors: string[] = [];

  // Validation spectacle et créneau
  if (!selectedShowId) {
    errors.push(VALIDATION_MESSAGES.showRequired);
  }
  if (!formData.slotId) {
    errors.push(VALIDATION_MESSAGES.slotRequired);
  }

  // Validation informations personnelles
  if (!formData.firstName?.trim()) {
    errors.push(VALIDATION_MESSAGES.firstNameRequired);
  }
  if (!formData.lastName?.trim()) {
    errors.push(VALIDATION_MESSAGES.lastNameRequired);
  }
  if (!formData.email?.trim()) {
    errors.push(VALIDATION_MESSAGES.emailRequired);
  } else if (!EMAIL_REGEX.test(formData.email)) {
    errors.push(VALIDATION_MESSAGES.emailInvalid);
  }

  // Validation nombre de places
  if (!formData.numPlaces || formData.numPlaces < 1) {
    errors.push(VALIDATION_MESSAGES.numPlacesMin);
  } else if (formData.numPlaces > maxPlaces) {
    errors.push(VALIDATION_MESSAGES.numPlacesMax(maxPlaces));
  }

  // Vérifier la capacité disponible du créneau
  const selectedSlot = availableSlots.find(s => s.id === formData.slotId);
  if (selectedSlot && !isUnlimitedCapacity(selectedSlot.capacity)) {
    if (formData.numPlaces > selectedSlot.remainingCapacity) {
      errors.push(VALIDATION_MESSAGES.capacityInsufficient(selectedSlot.remainingCapacity));
    }
  }

  return errors;
}

// ============================================
// HELPERS CAPACITÉ
// ============================================

/**
 * Vérifie si une capacité est illimitée
 */
export function isUnlimitedCapacity(capacity: number): boolean {
  return capacity >= UNLIMITED_CAPACITY;
}

/**
 * Formate l'affichage de la capacité disponible
 */
export function formatAvailableCapacity(slot: AvailableSlot): string {
  if (isUnlimitedCapacity(slot.capacity)) {
    return '∞';
  }
  return String(slot.remainingCapacity);
}

/**
 * Vérifie si un créneau est complet
 */
export function isSlotFull(slot: AvailableSlot): boolean {
  if (isUnlimitedCapacity(slot.capacity)) {
    return false;
  }
  return slot.remainingCapacity <= 0;
}

// ============================================
// HELPERS AFFICHAGE
// ============================================

/**
 * Formate le label d'un créneau pour le select
 */
export function formatSlotLabel(slot: AvailableSlot, formatDate: (date: string) => string): string {
  const venueName = slot.venue?.name || 'Lieu ?';
  const available = formatAvailableCapacity(slot);
  const isFull = isSlotFull(slot);
  
  const baseLabel = `${formatDate(slot.date)} ${slot.time} — ${venueName}`;
  
  if (isFull) {
    return `${baseLabel} (Complet)`;
  }
  return `${baseLabel} (${available} dispo)`;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Vérifie si une valeur est une chaîne non vide
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
