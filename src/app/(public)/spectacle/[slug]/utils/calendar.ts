/**
 * Utilitaires calendrier — Fonctions pures de date et conversion
 * Derviche Diffusion - Page spectacle
 */

import type { PublicSlot } from '@/lib/services/public-catalog';
import { isSlotTimePast } from '@/lib/utils/timezone';
import type { TimeSlot } from '../types';

/**
 * Convertir un PublicSlot en TimeSlot pour le calendrier
 */
export function convertToTimeSlot(slot: PublicSlot): TimeSlot {
  // Parser la date ISO en objet Date local
  const [year, month, day] = slot.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day); // month est 0-indexed

  // Convertir l'heure "11:00" → "11h00"
  const time = slot.time.replace(':', 'h');

  return {
    id: slot.id,
    date: dateObj,
    time,
    remainingCapacity: slot.remainingCapacity,
    totalCapacity: slot.capacity,
    venueId: slot.venueId,
    venueName: slot.venueName,
    venueCity: slot.venueCity,
  };
}


/** Premier jour du mois */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Dernier jour du mois */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/** Formater mois/annee en francais */
export function formatMonthYear(date: Date): string {
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/** Comparer deux dates (sans l'heure) */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Creer une cle de date coherente pour le Set (format: YYYY-M-D)
 * Utilise un format simple mais coherent entre creation et lookup
 */
export function createDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Indique si la wall-clock Paris du `TimeSlot` est antérieure à maintenant.
 * Wrapper sur `isSlotTimePast` qui gère la conversion du format interne :
 *   - `slot.date` (Date) → `YYYY-MM-DD`
 *   - `slot.time` ("11h00") → `HH:MM`
 *
 * Utilisé pour l'affichage du bandeau et l'orchestration de la modale
 * de confirmation lors de la réservation d'un créneau passé.
 */
export function isTimeSlotInPast(slot: TimeSlot): boolean {
  const y = slot.date.getFullYear();
  const m = String(slot.date.getMonth() + 1).padStart(2, '0');
  const d = String(slot.date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const timeStr = slot.time.replace('h', ':');
  return isSlotTimePast(dateStr, timeStr);
}
