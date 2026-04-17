/**
 * Chart - Admin Stats Service
 * Derviche Diffusion
 *
 * Récupère la série temporelle (bucket par jour/semaine/mois) via la
 * RPC `get_stats_chart`. Le bucket_label est pré-formaté en français
 * côté SQL.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type {
  ChartGranularity,
  StatsChartPoint,
  StatsFilters,
  StatsResult,
} from '../types';

/** Forme brute retournée par la RPC `get_stats_chart`. */
interface ChartRow {
  bucket_start: string;
  bucket_label: string;
  confirmed_count: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export async function getStatsChart(
  filters: StatsFilters,
  granularity: ChartGranularity
): Promise<StatsResult<StatsChartPoint[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_stats_chart', {
      p_from: filters.from,
      p_to: filters.to,
      p_granularity: granularity,
      p_company_ids: filters.companyIds?.length ? filters.companyIds : null,
      p_venue_ids: filters.venueIds?.length ? filters.venueIds : null,
    });

    if (error) {
      logger.error('[admin-stats] getStatsChart RPC error', { message: error.message });
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as ChartRow[];
    const points: StatsChartPoint[] = rows.map((r) => ({
      bucketStart: r.bucket_start,
      bucketLabel: r.bucket_label,
      confirmedCount: toNumber(r.confirmed_count),
    }));

    return { data: points, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getStatsChart', { message });
    return { data: null, error: message };
  }
}
