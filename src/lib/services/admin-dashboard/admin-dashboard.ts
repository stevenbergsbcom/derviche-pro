/**
 * Admin Dashboard Service - Orchestrateur
 * Derviche Diffusion
 *
 * Récupère toutes les données du tableau de bord administrateur
 * en orchestrant les appels aux sous-services
 */

import { logger } from '@/lib/logger';
import type {
  AdminDashboardOptions,
  AdminDashboardResult,
  DashboardPeriod,
} from './types';
import { getStats } from './stats';
import { getUpcomingSlots } from './slots';
import { getRecentReservations } from './reservations';
import { getChartData } from './chart';
import { getTopShows } from './top-shows';
import { getSlots24h } from './slots-24h';
import { getSeasonSettings, computePeriodBounds } from './period';

// ============================================
// CONSTANTES
// ============================================

/** Nombre d'éléments par défaut pour les listes */
const DEFAULT_LIST_LIMIT = 10;

/** Période par défaut */
const DEFAULT_PERIOD: DashboardPeriod = '7d';

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Récupère toutes les données du dashboard admin
 * @param options - Options de filtrage et de période
 */
export async function getAdminDashboard(
  options?: AdminDashboardOptions
): Promise<AdminDashboardResult> {
  try {
    const period = options?.period ?? DEFAULT_PERIOD;

    // Récupérer les paramètres de saison en premier (nécessaire pour les bornes)
    const seasonSettings = await getSeasonSettings();
    const periodBounds = computePeriodBounds(period, seasonSettings);

    // Exécuter toutes les requêtes en parallèle
    const [
      statsResult,
      slotsResult,
      reservationsResult,
      chartResult,
      topShowsResult,
      slots24hResult,
    ] = await Promise.all([
      getStats(options),
      getUpcomingSlots(DEFAULT_LIST_LIMIT, options),
      getRecentReservations(DEFAULT_LIST_LIMIT, options),
      getChartData(periodBounds, options),
      getTopShows(options),
      getSlots24h(options),
    ]);

    // Collecter toutes les erreurs non nulles
    const errors = [
      statsResult.error,
      slotsResult.error,
      reservationsResult.error,
      chartResult.error,
      topShowsResult.error,
      slots24hResult.error,
    ].filter(Boolean);

    return {
      data: {
        stats: statsResult.data,
        upcomingSlots: slotsResult.data,
        recentReservations: reservationsResult.data,
        chartData: chartResult.data,
        topShows: topShowsResult.data,
        slots24h: slots24hResult.data,
        seasonSettings,
      },
      error: errors.length > 0 ? errors.join('; ') : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAdminDashboard', { message });
    return { data: null, error: message };
  }
}
