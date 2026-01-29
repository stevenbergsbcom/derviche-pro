/**
 * Type Guards - Admin Dashboard Service
 * Derviche Diffusion
 * 
 * Fonctions de validation TypeScript pour les données Supabase
 */

import type { ShowRow, VenueRow } from '@/types/database';

// ============================================
// TYPE GUARDS - SHOW
// ============================================

/**
 * Vérifie si les données correspondent à un Show valide
 */
export function isValidShow(
  data: unknown
): data is Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { title: unknown }).title === 'string'
  );
}

// ============================================
// TYPE GUARDS - VENUE
// ============================================

/**
 * Vérifie si les données correspondent à un Venue valide
 */
export function isValidVenue(
  data: unknown
): data is Pick<VenueRow, 'id' | 'name' | 'city'> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { name: unknown }).name === 'string'
  );
}

// ============================================
// TYPE GUARDS - SLOT
// ============================================

/** Structure attendue d'un slot avec jointures */
export interface SlotWithJoins {
  id: string;
  date: string;
  time: string;
  shows: unknown;
  venues: unknown;
}

/**
 * Vérifie si les données correspondent à un Slot valide (pour réservations)
 */
export function isValidSlot(data: unknown): data is SlotWithJoins {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'date' in data &&
    'time' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { date: unknown }).date === 'string' &&
    typeof (data as { time: unknown }).time === 'string'
  );
}
