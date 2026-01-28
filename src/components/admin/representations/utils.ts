/**
 * Utilitaires pour les dialogs de représentations
 * Derviche Diffusion
 */

import { WEEK_DAY_LABELS_FULL, MONTH_NAMES } from './constants';

// ============================================
// FORMATAGE DE DATES
// ============================================

/**
 * Obtient la date locale au format YYYY-MM-DD
 * Évite les problèmes de timezone avec toISOString()
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
