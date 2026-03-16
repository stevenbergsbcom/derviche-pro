/**
 * Utilitaires pour les dialogs de représentations
 * Derviche Diffusion
 */

import { WEEK_DAY_LABELS_FULL, MONTH_NAMES } from './constants';
import { formatLocalDate } from '@/lib/utils/format-date';

// ============================================
// FORMATAGE DE DATES
// ============================================

/**
 * Alias pour compatibilité — utilise formatLocalDate depuis @/lib/utils/format-date
 */
export function getLocalDateString(date: Date = new Date()): string {
  return formatLocalDate(date);
}

/**
 * Formate une date ISO en format lisible français
 * @param dateString - Date au format YYYY-MM-DD
 * @returns Ex: "Lun. 15 janvier 2025"
 */
export function formatDateFr(dateString: string): string {
  // Ajoute T12:00:00 pour éviter les décalages de timezone
  const date = new Date(dateString + 'T12:00:00');
  const dayName = WEEK_DAY_LABELS_FULL[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName} ${dayNumber} ${monthName} ${year}`;
}

/**
 * Convertit une date string YYYY-MM-DD en objet Date à midi (évite timezone issues)
 */
export function parseDateAtNoon(dateString: string): Date {
  return new Date(dateString + 'T12:00:00');
}
