/**
 * Granularity - Admin Stats Service
 * Derviche Diffusion
 *
 * Détermine la granularité (day / week / month) d'un bucket temporel
 * en fonction de la durée de la période. Utilisé par les futures
 * séries temporelles (Phase 2 — chart).
 */

import type { PeriodBounds } from '@/lib/services/admin-dashboard';

export type StatsGranularity = 'day' | 'week' | 'month';

/** Seuils (en jours) pour basculer entre les granularités. */
export const GRANULARITY_THRESHOLDS = {
  dayMax: 31,
  weekMax: 180,
} as const;

/**
 * Calcule le nombre de jours entre deux dates ISO (YYYY-MM-DD), inclusif.
 * Renvoie 1 au minimum pour éviter une division par zéro en aval.
 */
export function daysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return 1;
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

/** Sélectionne la granularité adaptée à la durée de la période. */
export function pickGranularity(bounds: PeriodBounds): StatsGranularity {
  const duration = daysBetween(bounds.start, bounds.end);
  if (duration <= GRANULARITY_THRESHOLDS.dayMax) return 'day';
  if (duration <= GRANULARITY_THRESHOLDS.weekMax) return 'week';
  return 'month';
}
