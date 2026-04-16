/**
 * sort-venues - Tri du tableau "Par lieu"
 * Derviche Diffusion
 */

import type { VenueStats } from '@/lib/services/admin-stats';
import type { SortDirection } from './sort-shows';

export type VenuesSortKey =
  | 'venueName'
  | 'venueCity'
  | 'representationsCount'
  | 'showsCount'
  | 'confirmedCount'
  | 'presentCount'
  | 'absentCount'
  | 'pressCount';

function compare(a: string | number, b: string | number, dir: SortDirection): number {
  if (a === b) return 0;
  const cmp = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), 'fr', { sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

export function sortVenues(
  rows: VenueStats[],
  key: VenuesSortKey,
  dir: SortDirection
): VenueStats[] {
  return [...rows].sort((a, b) => compare(a[key], b[key], dir));
}
