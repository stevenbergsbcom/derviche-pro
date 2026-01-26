/**
 * Helpers - TransferSlotDrawer
 * Derviche Diffusion
 */

import type { TransferTargetSlot } from '@/lib/services/checkin';

/**
 * Calcule les places restantes affichées
 * Gère les capacités illimitées (999999)
 */
export function getDisplayRemaining(slot: TransferTargetSlot): string {
  if (slot.capacity >= 999999) {
    return '∞';
  }
  return String(slot.remainingCapacity);
}

/**
 * Détermine si un slot est dans le passé
 */
export function isSlotPast(date: string, time: string): boolean {
  const slotDateTime = new Date(`${date}T${time}`);
  return slotDateTime < new Date();
}

/**
 * Détermine si un slot est aujourd'hui
 */
export function isSlotToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

/**
 * Détermine si un slot est en capacité illimitée
 */
export function isSlotUnlimited(slot: TransferTargetSlot): boolean {
  return slot.capacity >= 999999;
}

/**
 * Calcule si un transfert causerait un overbooking
 */
export function wouldCauseOverbooking(
  slot: TransferTargetSlot,
  numPlaces: number
): boolean {
  if (isSlotUnlimited(slot)) return false;
  return (slot.remainingCapacity - numPlaces) < 0;
}
