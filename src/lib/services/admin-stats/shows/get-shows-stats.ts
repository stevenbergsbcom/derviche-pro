/**
 * Shows stats - Admin Stats Service
 * Derviche Diffusion
 *
 * Récupère l'agrégat "Par spectacle" via la RPC `get_shows_stats`.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { StatsFilters, ShowStats, StatsResult } from '../types';
import { toShowStats, type ShowsStatsRow } from './transformers';

export async function getShowsStats(
  filters: StatsFilters
): Promise<StatsResult<ShowStats[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_shows_stats', {
      p_from: filters.from,
      p_to: filters.to,
      p_company_ids: filters.companyIds?.length ? filters.companyIds : null,
      p_venue_ids: filters.venueIds?.length ? filters.venueIds : null,
    });

    if (error) {
      logger.error('[admin-stats] getShowsStats RPC error', { message: error.message });
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as ShowsStatsRow[];
    return { data: rows.map(toShowStats), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getShowsStats', { message });
    return { data: null, error: message };
  }
}
