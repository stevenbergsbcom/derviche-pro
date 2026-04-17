/**
 * Show Detail - Admin Stats Service
 * Derviche Diffusion
 *
 * Récupère le détail par représentation d'un spectacle via la RPC
 * `get_show_detail_stats`.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { ShowDetailRow, StatsFilters, StatsResult } from '../types';
import { toShowDetailRow, type ShowDetailRawRow } from './transformers';

export async function getShowDetailStats(
  showId: string,
  filters: StatsFilters
): Promise<StatsResult<ShowDetailRow[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_show_detail_stats', {
      p_show_id: showId,
      p_from: filters.from,
      p_to: filters.to,
      p_company_ids: filters.companyIds?.length ? filters.companyIds : null,
      p_venue_ids: filters.venueIds?.length ? filters.venueIds : null,
    });

    if (error) {
      logger.error('[admin-stats] getShowDetailStats RPC error', {
        message: error.message,
      });
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as ShowDetailRawRow[];
    return { data: rows.map(toShowDetailRow), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getShowDetailStats', { message });
    return { data: null, error: message };
  }
}
