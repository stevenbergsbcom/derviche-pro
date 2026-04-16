/**
 * Orchestrator - Admin Stats Service
 * Derviche Diffusion
 *
 * Parallélise les quatre requêtes (KPIs + spectacles + lieux + chart) et
 * agrège les erreurs en une chaîne unique lisible côté UI.
 */

import { logger } from '@/lib/logger';
import { getStatsKpis } from '../kpis';
import { getShowsStats } from '../shows';
import { getVenuesStats } from '../venues';
import { getStatsChart } from '../chart';
import { pickGranularity } from '../helpers';
import type {
  AdminStatsData,
  ChartGranularity,
  StatsFilters,
  StatsResult,
} from '../types';

export async function getAdminStats(
  filters: StatsFilters
): Promise<StatsResult<AdminStatsData>> {
  try {
    const granularity: ChartGranularity = pickGranularity({
      start: filters.from,
      end: filters.to,
    });

    const [kpisResult, showsResult, venuesResult, chartResult] = await Promise.all([
      getStatsKpis(filters),
      getShowsStats(filters),
      getVenuesStats(filters),
      getStatsChart(filters, granularity),
    ]);

    const errors = [
      kpisResult.error,
      showsResult.error,
      venuesResult.error,
      chartResult.error,
    ].filter((msg): msg is string => Boolean(msg));

    // Si les 4 requêtes ont échoué → échec complet
    if (
      !kpisResult.data &&
      !showsResult.data &&
      !venuesResult.data &&
      !chartResult.data
    ) {
      return {
        data: null,
        error: errors.join(' ; ') || 'Erreur inconnue',
      };
    }

    return {
      data: {
        kpis: kpisResult.data ?? {
          totalConfirmed: 0,
          totalCancelled: 0,
          totalPlacesConfirmed: 0,
          totalShows: 0,
        },
        shows: showsResult.data ?? [],
        venues: venuesResult.data ?? [],
        chart: chartResult.data ?? [],
        chartGranularity: granularity,
        bounds: { start: filters.from, end: filters.to },
      },
      error: errors.length > 0 ? `Erreur partielle : ${errors.join(' ; ')}` : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getAdminStats', { message });
    return { data: null, error: message };
  }
}
