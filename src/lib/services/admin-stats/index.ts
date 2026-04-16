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
} from './types';

// Constantes publiques
export {
  DEFAULT_STATS_PERIOD,
  DEFAULT_PAGE_SIZE,
  STATS_PERIOD_LABELS,
  ALL_PERIOD_FROM,
} from './constants';

// Helpers publics
export { resolveStatsBounds, pickGranularity, daysBetween } from './helpers';
export type { ResolvePeriodInput, StatsGranularity } from './helpers';

// Orchestrateur (API principale)
export { getAdminStats } from './orchestrator';

// Fonctions granulaires (pour consommateurs avancés ou tests)
export { getStatsKpis } from './kpis';
export { getShowsStats } from './shows';
export { getVenuesStats } from './venues';
export { getStatsChart } from './chart';
export { getShowDetailStats, getVenueDetailStats } from './detail';
