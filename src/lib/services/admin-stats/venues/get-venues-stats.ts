/**
 * Venues stats - Admin Stats Service
 * Derviche Diffusion
 *
 * Récupère l'agrégat "Par lieu" via la RPC `get_venues_stats`.
 *
 * Note : la RPC accepte uniquement `p_company_ids` ; le filtre venues
 * est appliqué côté client (puisque par définition on regroupe *par* lieu
 * et qu'un filtre venue produirait une sélection triviale).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { StatsFilters, VenueStats, StatsResult } from '../types';
import { toVenueStats, type VenuesStatsRow } from './transformers';

export async function getVenuesStats(
  filters: StatsFilters
): Promise<StatsResult<VenueStats[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_venues_stats', {
      p_from: filters.from,
      p_to: filters.to,
      p_company_ids: filters.companyIds?.length ? filters.companyIds : null,
    });

    if (error) {
      logger.error('[admin-stats] getVenuesStats RPC error', { message: error.message });
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as VenuesStatsRow[];
    let result = rows.map(toVenueStats);

    // Filtre client : si l'utilisateur a sélectionné certains lieux, on ne garde que ceux-là.
    if (filters.venueIds && filters.venueIds.length > 0) {
      const allow = new Set(filters.venueIds);
      result = result.filter((v) => allow.has(v.venueId));
    }

    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[admin-stats] Exception getVenuesStats', { message });
    return { data: null, error: message };
  }
}
