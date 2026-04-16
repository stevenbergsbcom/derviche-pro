/**
 * Orchestrator - Admin Stats Service
 * Derviche Diffusion
 *
 * Parallélise les trois requêtes (KPIs + spectacles + lieux) et
 * agrège les erreurs en une chaîne unique lisible côté UI.
 */

import { logger } from '@/lib/logger';
import { getStatsKpis } from '../kpis';
import { getShowsStats } from '../shows';
import { getVenuesStats } from '../venues';
import type { AdminStatsData, StatsFilters, StatsResult } from '../types';

export async function getAdminStats(
  filters: StatsFilters
): Promise<StatsResult<AdminStatsData>> {
  try {
    const [kpisResult, showsResult, venuesResult] = await Promise.all([
      getStatsKpis(filters),
      getShowsStats(filters),
      getVenuesStats(filters),
    ]);

    const errors = [kpisResult.error, showsResult.error, venuesResult.error].filter(
      (msg): msg is string => Boolean(msg)
    );

    // Si les 3 requêtes ont échoué → échec complet
    if (!kpisResult.data && !showsResult.data && !venuesResult.data) {
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
