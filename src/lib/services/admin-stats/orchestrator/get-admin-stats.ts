/**
 * Orchestrator - Admin Stats Service
 * Derviche Diffusion
 *
 * Parallélise les quatre requêtes (KPIs + spectacles + lieux + chart) et
 * agrège les erreurs en une chaîne unique lisible côté UI.
 *
 * Phase 3 : supporte en option une sous-orchestration pour une période de
 * comparaison. Si la sous-orchestration échoue, on retombe gracieusement sur
 * les données principales seules (comparaison non-bloquante).
 */

import { logger } from '@/lib/logger';
import type { SeasonSettings } from '@/lib/services/app-settings';
import {
  computeChartCompare,
  computeKpisDelta,
  computeShowsDelta,
  computeVenuesDelta,
} from '../compare';
import { getStatsKpis } from '../kpis';
import { getShowsStats } from '../shows';
import { getVenuesStats } from '../venues';
import { getStatsChart } from '../chart';
import { pickGranularity, resolveCompareBounds } from '../helpers';
import type {
  AdminStatsDataWithComparison,
  ChartGranularity,
  ComparePreset,
  StatsFilters,
  StatsKpis,
  StatsPeriod,
  StatsResult,
  ShowStats,
  VenueStats,
  StatsChartPoint,
} from '../types';

// ============================================
// DÉFAUTS
// ============================================

const EMPTY_KPIS: StatsKpis = {
  totalConfirmed: 0,
  totalCancelled: 0,
  totalPlacesConfirmed: 0,
  totalShows: 0,
};

// ============================================
// OPTIONS
// ============================================

export interface GetAdminStatsOptions {
  compareMode?: boolean;
  comparePreset?: ComparePreset;
  /** Période d'origine (pour valider `previous_season`). */
  period?: StatsPeriod;
  /** Paramètres de saison (requis pour `previous_season`). */
  season?: SeasonSettings;
}

// ============================================
// SOUS-FONCTIONS
// ============================================

/**
 * Exécute les 4 requêtes principales en parallèle et renvoie un bundle
 * { kpis, shows, venues, chart, errors }.
 */
async function fetchStatsBundle(
  filters: StatsFilters,
  granularity: ChartGranularity,
): Promise<{
  kpis: StatsKpis | null;
  shows: ShowStats[] | null;
  venues: VenueStats[] | null;
  chart: StatsChartPoint[] | null;
  errors: string[];
}> {
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

  return {
    kpis: kpisResult.data,
    shows: showsResult.data,
    venues: venuesResult.data,
    chart: chartResult.data,
    errors,
  };
}

// ============================================
// API PUBLIQUE
// ============================================

export async function getAdminStats(
  filters: StatsFilters,
  options?: GetAdminStatsOptions,
): Promise<StatsResult<AdminStatsDataWithComparison>> {
  try {
    const granularity: ChartGranularity = pickGranularity({
      start: filters.from,
      end: filters.to,
    });

    // Fetch principal
    const main = await fetchStatsBundle(filters, granularity);

    // Échec total du fetch principal → on renvoie une erreur agrégée
    if (!main.kpis && !main.shows && !main.venues && !main.chart) {
      return {
        data: null,
        error: main.errors.join(' ; ') || 'Erreur inconnue',
      };
    }

    const mainKpis = main.kpis ?? EMPTY_KPIS;
    const mainShows = main.shows ?? [];
    const mainVenues = main.venues ?? [];
    const mainChart = main.chart ?? [];

    // Mode comparaison activé : on essaie la sous-orchestration.
    if (options?.compareMode && options.comparePreset && options.period) {
      try {
        const compareBounds = resolveCompareBounds(
          { start: filters.from, end: filters.to },
          options.comparePreset,
          options.period,
        );

        const compareFilters: StatsFilters = {
          from: compareBounds.start,
          to: compareBounds.end,
          ...(filters.companyIds ? { companyIds: filters.companyIds } : {}),
          ...(filters.venueIds ? { venueIds: filters.venueIds } : {}),
        };

        const compare = await fetchStatsBundle(compareFilters, granularity);

        // Si la totalité des requêtes de comparaison a échoué, on bascule en
        // mode "sans delta" sans bloquer l'affichage principal.
        if (!compare.kpis && !compare.shows && !compare.venues && !compare.chart) {
          logger.warn('[admin-stats] Comparaison : toutes les requêtes ont échoué', {
            errors: compare.errors,
          });
        } else {
          // Succès partiel : on log tout de même les erreurs restantes pour
          // faciliter le diagnostic (ex. kpis OK mais venues KO → deltas
          // venues calculés à partir d'un tableau vide).
          if (compare.errors.length > 0) {
            logger.warn(
              '[admin-stats] Comparaison : erreurs partielles, deltas potentiellement dégradés',
              { errors: compare.errors }
            );
          }

          const compareKpis = compare.kpis ?? EMPTY_KPIS;
          const compareShows = compare.shows ?? [];
          const compareVenues = compare.venues ?? [];
          const compareChart = compare.chart ?? [];

          return {
            data: {
              kpis: computeKpisDelta(mainKpis, compareKpis),
              shows: computeShowsDelta(mainShows, compareShows),
              venues: computeVenuesDelta(mainVenues, compareVenues),
              chart: computeChartCompare(mainChart, compareChart),
              chartGranularity: granularity,
              bounds: { start: filters.from, end: filters.to },
              compareBounds,
              comparePreset: options.comparePreset,
            },
            error:
              main.errors.length > 0
                ? `Erreur partielle : ${main.errors.join(' ; ')}`
                : null,
          };
        }
      } catch (err) {
        // Échec non-bloquant : on log en warn et on continue avec les data
        // principales seules.
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.warn('[admin-stats] Comparaison : exception, fallback main only', {
          message,
        });
      }
    }

    // Mode normal (ou fallback comparaison) : renvoie les données principales
    // sans deltas. Les types *WithDelta sont compatibles car les deltas sont
    // optionnels.
    return {
      data: {
        kpis: mainKpis,
        shows: mainShows,
        venues: mainVenues,
        chart: mainChart,
        chartGranularity: granularity,
        bounds: { start: filters.from, end: filters.to },
      },
      error:
        main.errors.length > 0
          ? `Erreur partielle : ${main.errors.join(' ; ')}`
          : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getAdminStats', { message });
    return { data: null, error: message };
  }
}
