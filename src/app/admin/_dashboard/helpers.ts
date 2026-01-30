/**
 * Helpers - Admin Dashboard Page
 * Derviche Diffusion
 *
 * Fonctions utilitaires pour le formatage et l'affichage
 */

import type { OccupancyBadgeVariant } from './types';

// ============================================
// FORMATAGE DE DATES
// ============================================

/**
 * Formate la date du jour en français complet
 * @example "vendredi 24 janvier 2025"
 */
export function formatTodayDate(): string {
  const today = new Date();
  return today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date en français court
 * @example "ven. 24 janv."
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ============================================
// FORMATAGE DU TEMPS
// ============================================

/**
 * Formate une heure (HH:mm:ss → HH:mm)
 * @example "14:30:00" → "14:30"
 */
export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/**
 * Formate une date relative (il y a X minutes/heures)
 * @example "Il y a 5 min", "Il y a 2h", "Hier"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  return `Il y a ${diffDays} jours`;
}

// ============================================
// COULEURS ET STYLES
// ============================================

/**
 * Retourne la variante de badge selon le taux de remplissage
 * - >= 90% : destructive (rouge)
 * - >= 70% : default (primaire)
 * - >= 40% : secondary (gris)
 * - < 40%  : outline (bordure)
 */
export function getOccupancyBadgeVariant(rate: number): OccupancyBadgeVariant {
  if (rate >= 90) return 'destructive';
  if (rate >= 70) return 'default';
  if (rate >= 40) return 'secondary';
  return 'outline';
}

// ============================================
// FORMATAGE DE CAPACITÉ
// ============================================

/**
 * Formate l'affichage de la capacité (gère le cas illimité)
 * @param capacity - Capacité totale (999999 = illimité)
 * @returns Chaîne formatée ou symbole infini
 */
export function formatCapacity(capacity: number): string {
  return capacity === 999999 ? '∞' : String(capacity);
}
