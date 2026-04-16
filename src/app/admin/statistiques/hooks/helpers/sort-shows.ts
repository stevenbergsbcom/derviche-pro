/**
 * sort-shows - Tri du tableau "Par spectacle"
 * Derviche Diffusion
 */

import type { ShowStatsWithDelta } from '@/lib/services/admin-stats';

export type ShowsSortKey =
  | 'showTitle'
  | 'companyName'
  | 'representationsCount'
  | 'confirmedCount'
  | 'cancelledCount'
  | 'presentCount'
  | 'absentCount'
  | 'pressCount'
  | 'confirmedCountDelta';

export type SortDirection = 'asc' | 'desc';

/** Compare deux nombres ou chaînes en respectant la direction. */
function compare(a: string | number, b: string | number, dir: SortDirection): number {
  if (a === b) return 0;
  const cmp =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'fr', { sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

/**
 * Extrait la valeur triable pour la colonne "Évolution".
 * Priorité au deltaPercent (si défini) pour hiérarchiser les évolutions
 * relatives ; sinon fallback sur le delta absolu ; sinon 0 pour placer en
 * bas les lignes sans comparaison.
 */
function deltaSortValue(row: ShowStatsWithDelta): number {
  const d = row.confirmedCountDelta;
  if (!d) return 0;
  if (d.deltaPercent !== null) return d.deltaPercent;
  return d.delta;
}

export function sortShows(
  rows: ShowStatsWithDelta[],
  key: ShowsSortKey,
  dir: SortDirection,
): ShowStatsWithDelta[] {
  if (key === 'confirmedCountDelta') {
    return [...rows].sort((a, b) => compare(deltaSortValue(a), deltaSortValue(b), dir));
  }
  return [...rows].sort((a, b) => compare(a[key], b[key], dir));
}
