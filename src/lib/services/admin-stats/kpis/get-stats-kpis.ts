/**
 * KPIs - Admin Stats Service
 * Derviche Diffusion
 *
 * Récupère les 4 KPIs globaux (total confirmées, annulées, places,
 * nb spectacles distincts) via la RPC `get_stats_kpis`.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { StatsFilters, StatsKpis, StatsResult } from '../types';

/** Forme brute retournée par la RPC `get_stats_kpis`. */
interface KpisRow {
  total_confirmed: number | string | null;
  total_cancelled: number | string | null;
  total_places_confirmed: number | string | null;
  total_shows: number | string | null;
}

const EMPTY_KPIS: StatsKpis = {
  totalConfirmed: 0,
  totalCancelled: 0,
  totalPlacesConfirmed: 0,
  totalShows: 0,
};

/** Convertit BIGINT ↔ number en garantissant un entier fini. */
function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export async function getStatsKpis(
  filters: StatsFilters
): Promise<StatsResult<StatsKpis>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_stats_kpis', {
      p_from: filters.from,
      p_to: filters.to,
      p_company_ids: filters.companyIds?.length ? filters.companyIds : null,
      p_venue_ids: filters.venueIds?.length ? filters.venueIds : null,
    });

    if (error) {
      logger.error('[admin-stats] getStatsKpis RPC error', { message: error.message });
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as KpisRow[];
    const row = rows[0];

    if (!row) {
      return { data: EMPTY_KPIS, error: null };
    }

    return {
      data: {
        totalConfirmed: toNumber(row.total_confirmed),
        totalCancelled: toNumber(row.total_cancelled),
        totalPlacesConfirmed: toNumber(row.total_places_confirmed),
        totalShows: toNumber(row.total_shows),
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getStatsKpis', { message });
    return { data: null, error: message };
  }
}
