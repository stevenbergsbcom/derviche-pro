/**
 * compute-deltas - Admin Stats Service (Phase 3)
 * Derviche Diffusion
 *
 * Calcule les deltas (absolute + %) entre une période courante et une période
 * de comparaison pour : KPIs, shows, venues et buckets chart.
 */

import type {
  DeltaValue,
  ShowStats,
  ShowStatsWithDelta,
  StatsChartPoint,
  StatsChartPointWithCompare,
  StatsKpis,
  StatsKpisWithDelta,
  VenueStats,
  VenueStatsWithDelta,
} from '../types';

// ============================================
// CALCUL UNITAIRE
// ============================================

/**
 * Calcule un DeltaValue.
 * - `deltaPercent` est arrondi à 1 décimale près.
 * - null quand la base (compare) est 0 pour éviter division par zéro.
 */
export function computeDelta(current: number, compare: number): DeltaValue {
  const delta = current - compare;
  const deltaPercent =
    compare === 0 ? null : Math.round((delta / compare) * 1000) / 10;
  return { delta, deltaPercent, compareValue: compare };
}

// ============================================
// ENRICHISSEMENT PAR STRUCTURE
// ============================================

/** Enrichit des KPIs avec les deltas face à une période de comparaison. */
export function computeKpisDelta(
  current: StatsKpis,
  compare: StatsKpis,
): StatsKpisWithDelta {
  return {
    ...current,
    totalConfirmedDelta: computeDelta(current.totalConfirmed, compare.totalConfirmed),
    totalCancelledDelta: computeDelta(current.totalCancelled, compare.totalCancelled),
    totalPlacesConfirmedDelta: computeDelta(
      current.totalPlacesConfirmed,
      compare.totalPlacesConfirmed,
    ),
    totalShowsDelta: computeDelta(current.totalShows, compare.totalShows),
  };
}

/** Enrichit les lignes shows avec delta par showId. Les shows orphelins (non présents dans la période comparée) reçoivent un delta face à 0. */
export function computeShowsDelta(
  current: ShowStats[],
  compare: ShowStats[],
): ShowStatsWithDelta[] {
  const compareMap = new Map(compare.map((s) => [s.showId, s]));
  return current.map((show) => {
    const cmp = compareMap.get(show.showId);
    const compareConfirmed = cmp?.confirmedCount ?? 0;
    return {
      ...show,
      confirmedCountDelta: computeDelta(show.confirmedCount, compareConfirmed),
    };
  });
}

/** Enrichit les lignes venues avec delta par venueId. */
export function computeVenuesDelta(
  current: VenueStats[],
  compare: VenueStats[],
): VenueStatsWithDelta[] {
  const compareMap = new Map(compare.map((v) => [v.venueId, v]));
  return current.map((venue) => {
    const cmp = compareMap.get(venue.venueId);
    const compareConfirmed = cmp?.confirmedCount ?? 0;
    return {
      ...venue,
      confirmedCountDelta: computeDelta(venue.confirmedCount, compareConfirmed),
    };
  });
}

/**
 * Aligne les buckets du chart courant avec ceux de la période de comparaison.
 * L'alignement se fait par index d'ordre (les deux séries ayant typiquement
 * la même granularité et donc la même cardinalité). Si la période comparée
 * est plus courte, les buckets orphelins restent sans valeur de comparaison.
 */
export function computeChartCompare(
  current: StatsChartPoint[],
  compare: StatsChartPoint[],
): StatsChartPointWithCompare[] {
  return current.map((point, i) => {
    const cmp = compare[i];
    if (!cmp) return { ...point };
    return {
      ...point,
      confirmedCountCompare: cmp.confirmedCount,
      bucketLabelCompare: cmp.bucketLabel,
    };
  });
}
