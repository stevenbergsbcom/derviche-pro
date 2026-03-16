/**
 * Service Public Catalog - Transformers / Helpers
 * Derviche Diffusion
 */

import type { PublicSlot, PublicVenue } from './types';
import { UNLIMITED_CAPACITY } from './constants';

/**
 * Convertit une capacité BDD en capacité frontend
 * @param capacity Capacité depuis Supabase (999999 = illimité)
 * @returns null si illimité, sinon la valeur
 */
export function convertCapacity(capacity: number): number | null {
  return capacity >= UNLIMITED_CAPACITY ? null : capacity;
}

/**
 * Calcule le nombre de places réservées pour un slot
 *
 * Fonctionne pour tous les types de slots (limités et illimités) car:
 * - Le trigger SQL initialise toujours remaining_capacity = capacity à la création
 * - Pour un slot illimité: capacity=999999, remaining_capacity=999999
 * - Après N réservations: remaining_capacity = 999999 - N
 * - Donc booked = 999999 - (999999 - N) = N ✓
 *
 * @param capacity Capacité totale du slot (brute, depuis la BDD)
 * @param remainingCapacity Places restantes (brute, depuis la BDD)
 * @returns Nombre de places réservées (toujours >= 0)
 */
export function calculateBooked(capacity: number, remainingCapacity: number): number {
  return Math.max(0, capacity - remainingCapacity);
}

/**
 * Formate une date ISO en format français lisible
 * @param dateStr Date au format YYYY-MM-DD
 * @returns Date formatée (ex: "15 jan. 2026")
 */
export function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDate();
  const months = [
    'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Extrait les lieux distincts d'une liste de slots
 * @param slots Liste des slots publics
 * @returns Liste des lieux uniques triés par nom
 */
export function extractDistinctVenues(slots: PublicSlot[]): PublicVenue[] {
  const venueMap = new Map<string, PublicVenue>();

  slots.forEach(slot => {
    if (slot.venueId && !venueMap.has(slot.venueId)) {
      venueMap.set(slot.venueId, {
        id: slot.venueId,
        name: slot.venueName,
        city: slot.venueCity,
      });
    }
  });

  // Trier par nom de lieu
  return Array.from(venueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
