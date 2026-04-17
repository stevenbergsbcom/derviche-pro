/**
 * Admin Stats Service - Exports
 * Derviche Diffusion
 *
 * Point d'entrée unique pour la page /admin/statistiques.
 * Les sous-modules (kpis, shows, venues, chart, detail, orchestrator,
 * helpers) sont importés individuellement depuis ici pour préserver
 * l'encapsulation.
 */

// Types publics
export type {
  StatsPeriod,
  StatsFilters,
  StatsKpis,
  ShowStats,
  VenueStats,
  ShowDetailRow,
  VenueDetailRow,
  StatsChartPoint,
  ChartGranularity,
  AdminStatsData,
  StatsResult,
  // Phase 3
  ComparePreset,
  DeltaValue,
  StatsKpisWithDelta,
  ShowStatsWithDelta,
  VenueStatsWithDelta,
  StatsChartPointWithCompare,
  AdminStatsDataWithComparison,
} from './types';

// Constantes publiques
export {
  DEFAULT_STATS_PERIOD,
  DEFAULT_PAGE_SIZE,
  STATS_PERIOD_LABELS,
  ALL_PERIOD_FROM,
  COMPARE_PRESET_LABELS,
  CHART_COLORS,
} from './constants';

// Helpers publics
export {
  resolveStatsBounds,
  resolveCompareBounds,
  pickGranularity,
  daysBetween,
  toLocalISO,
} from './helpers';
export type { ResolvePeriodInput, StatsGranularity } from './helpers';

// Helpers de comparaison (Phase 3)
export {
  computeDelta,
  computeKpisDelta,
  computeShowsDelta,
  computeVenuesDelta,
  computeChartCompare,
} from './compare';

// Orchestrateur (API principale)
export { getAdminStats } from './orchestrator';
export type { GetAdminStatsOptions } from './orchestrator/get-admin-stats';

// Fonctions granulaires (pour consommateurs avancés ou tests)
export { getStatsKpis } from './kpis';
export { getShowsStats } from './shows';
export { getVenuesStats } from './venues';
export { getStatsChart } from './chart';
export { getShowDetailStats, getVenueDetailStats } from './detail';
