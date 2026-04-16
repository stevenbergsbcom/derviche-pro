/**
 * sort-shows - Tri du tableau "Par spectacle"
 * Derviche Diffusion
 */

import type { ShowStats } from '@/lib/services/admin-stats';

export type ShowsSortKey =
  | 'showTitle'
  | 'companyName'
  | 'representationsCount'
  | 'confirmedCount'
  | 'cancelledCount'
  | 'presentCount'
  | 'absentCount'
  | 'pressCount';

export type SortDirection = 'asc' | 'desc';

/** Compare deux nombres ou chaînes en respectant la direction. */
function compare(a: string | number, b: string | number, dir: SortDirection): number {
  if (a === b) return 0;
  const cmp = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), 'fr', { sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

export function sortShows(
  rows: ShowStats[],
  key: ShowsSortKey,
  dir: SortDirection
): ShowStats[] {
  return [...rows].sort((a, b) => compare(a[key], b[key], dir));
}
