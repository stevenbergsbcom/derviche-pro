/**
 * sort-venues - Tri du tableau "Par lieu"
 * Derviche Diffusion
 */

import type { VenueStatsWithDelta } from '@/lib/services/admin-stats';
import type { SortDirection } from './sort-shows';

export type VenuesSortKey =
  | 'venueName'
  | 'venueCity'
  | 'representationsCount'
  | 'showsCount'
  | 'confirmedCount'
  | 'presentCount'
  | 'absentCount'
  | 'pressCount'
  | 'confirmedCountDelta';

function compare(a: string | number, b: string | number, dir: SortDirection): number {
  if (a === b) return 0;
  const cmp =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'fr', { sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

/** Valeur triable pour la colonne "Évolution". Cf. sort-shows. */
function deltaSortValue(row: VenueStatsWithDelta): number {
  const d = row.confirmedCountDelta;
  if (!d) return 0;
  if (d.deltaPercent !== null) return d.deltaPercent;
  return d.delta;
}

export function sortVenues(
  rows: VenueStatsWithDelta[],
  key: VenuesSortKey,
  dir: SortDirection,
): VenueStatsWithDelta[] {
  if (key === 'confirmedCountDelta') {
    return [...rows].sort((a, b) => compare(deltaSortValue(a), deltaSortValue(b), dir));
  }
  return [...rows].sort((a, b) => compare(a[key], b[key], dir));
}
