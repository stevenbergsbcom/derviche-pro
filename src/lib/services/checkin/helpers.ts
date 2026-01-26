/**
 * Helpers pour le service Check-in
 * Derviche Diffusion
 * 
 * Fonctions utilitaires pour le formatage et le traitement des données.
 */

import type { CheckinSlot } from './types';

/**
 * Formate une date pour l'affichage
 * @example formatSlotDate('2025-01-26') => 'dimanche 26 janvier'
 */
export function formatSlotDate(date: string): string {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formate une heure pour l'affichage
 * @example formatSlotTime('14:30:00') => '14:30'
 */
export function formatSlotTime(time: string): string {
  return time.slice(0, 5); // HH:MM
}

/**
 * Vérifie si un slot est aujourd'hui
 */
export function isSlotToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

/**
 * Vérifie si un slot est passé (date antérieure à aujourd'hui)
 * Note: les slots d'aujourd'hui sont considérés comme "à venir"
 */
export function isSlotPast(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date < today;
}

/**
 * Groupe les slots par date
 * @returns Map avec la date comme clé et les slots correspondants comme valeur
 */
export function groupSlotsByDate(slots: CheckinSlot[]): Map<string, CheckinSlot[]> {
  const grouped = new Map<string, CheckinSlot[]>();
  
  for (const slot of slots) {
    const existing = grouped.get(slot.date);
    if (existing) {
      existing.push(slot);
    } else {
      grouped.set(slot.date, [slot]);
    }
  }

  return grouped;
}

/**
 * Retourne la date d'aujourd'hui au format ISO (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcule une date limite en soustrayant des jours
 * @param daysAgo Nombre de jours à soustraire
 * @returns Date au format ISO (YYYY-MM-DD)
 */
export function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}
