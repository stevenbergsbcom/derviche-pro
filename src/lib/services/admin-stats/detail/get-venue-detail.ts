/**
 * Venue Detail - Admin Stats Service
 * Derviche Diffusion
 *
 * Récupère la liste agrégée des spectacles joués dans un lieu via
 * la RPC `get_venue_detail_stats`.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { StatsFilters, StatsResult, VenueDetailRow } from '../types';
import { toVenueDetailRow, type VenueDetailRawRow } from './transformers';

export async function getVenueDetailStats(
  venueId: string,
  filters: StatsFilters
): Promise<StatsResult<VenueDetailRow[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_venue_detail_stats', {
      p_venue_id: venueId,
      p_from: filters.from,
      p_to: filters.to,
      p_company_ids: filters.companyIds?.length ? filters.companyIds : null,
    });

    if (error) {
      logger.error('[admin-stats] getVenueDetailStats RPC error', {
        message: error.message,
      });
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as VenueDetailRawRow[];
    return { data: rows.map(toVenueDetailRow), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getVenueDetailStats', { message });
    return { data: null, error: message };
  }
}
