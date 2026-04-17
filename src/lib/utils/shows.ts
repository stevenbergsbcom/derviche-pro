/**
 * Utilitaires partagés — Shows / Spectacles
 * Derviche Diffusion — S185
 *
 * Fonctions réutilisées dans les pages publiques
 * (catalogue, home-page, spectacle/[slug], confirmation).
 */

import type { PublicShow } from '@/lib/services/public-catalog';
import type { Spectacle, SpectacleStatus } from '@/components/spectacles';

// ============================================
// IMAGE FALLBACK
// ============================================

const PLACEHOLDER_IMAGE = '/images/spectacles/placeholder.jpg';

// ============================================
// transformShowToSpectacle
// ============================================

/**
 * Transforme un `PublicShow` (données Supabase) en `Spectacle`
 * compatible avec le composant `SpectacleCard`.
 */
export function transformShowToSpectacle(show: PublicShow): Spectacle {
  let status: SpectacleStatus = 'available';

  if (show.status === 'draft') {
    status = 'coming_soon';
  } else if (show.status === 'archived') {
    status = 'closed';
  } else if (show.availableSlotsCount === 0 && show.slots.length > 0) {
    status = 'closed';
  } else if (show.slots.length === 0) {
    status = 'coming_soon';
  }

  return {
    id: 0, // Legacy — on utilise slug comme identifiant unique
    title: show.title,
    company: show.companyName,
    venues: show.venues.map((v) => (v.city ? `${v.name} - ${v.city}` : v.name)),
    cities: Array.from(
      new Set(show.venues.map((v) => v.city).filter((c): c is string => Boolean(c))),
    ),
    image: show.imageUrl || PLACEHOLDER_IMAGE,
    slug: show.slug,
    genres: show.categories,
    nextDate: status === 'available' ? (show.nextDate || '') : '',
    nextTime: status === 'available' ? show.nextTime : null,
    remainingSlots: show.availableSlotsCount,
    status,
  };
}

// ============================================
// formatDuration
// ============================================

/**
 * Formate une durée en minutes en texte lisible.
 *
 * Exemples :
 * - `null` / `undefined` → `'Durée non précisée'`
 * - `0`  → `'0 min'`
 * - `45` → `'45 min'`
 * - `60` → `'1h'`
 * - `75` → `'1h15'`
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'Durée non précisée';
  if (minutes === 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}
