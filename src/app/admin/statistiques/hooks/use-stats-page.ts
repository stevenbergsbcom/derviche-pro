/**
 * use-stats-page - Orchestrateur de la page /admin/statistiques
 * Derviche Diffusion
 *
 * Compose :
 *   - `useStatsFilters` : état des filtres + sync URL
 *   - `useStatsData`    : fetch KPIs/shows/venues/chart
 *   - `useShowDetail`   : drawer "Détail spectacle"
 *   - `useVenueDetail`  : drawer "Détail lieu"
 */

'use client';

import { useMemo } from 'react';
import type { StatsFilters } from '@/lib/services/admin-stats';
import { useStatsFilters, type UseStatsFiltersReturn } from './use-stats-filters';
import { useStatsData, type UseStatsDataReturn } from './use-stats-data';
import { useShowDetail, type UseShowDetailReturn } from './use-show-detail';
import { useVenueDetail, type UseVenueDetailReturn } from './use-venue-detail';

export interface UseStatsPageReturn
  extends UseStatsFiltersReturn,
    UseStatsDataReturn {
  /** Filtres effectifs (avec bornes résolues) — utilisé par les drawers. */
  effectiveFilters: StatsFilters | null;
  showDetail: UseShowDetailReturn;
  venueDetail: UseVenueDetailReturn;
}

/** Filtres neutres utilisés pendant la résolution des bornes (pas de fetch). */
const EMPTY_FILTERS: StatsFilters = { from: '', to: '' };

export function useStatsPage(): UseStatsPageReturn {
  const filtersApi = useStatsFilters();
  const dataApi = useStatsData(filtersApi.filters);

  // Filtres effectifs passés aux drawers. Tant que `bounds` n'est pas résolu
  // (cas extrêmement rare — useStatsData résout immédiatement), on passe
  // un objet neutre ; les hooks detail ne fetchent pas tant que leur drawer
  // est fermé.
  const effectiveFilters = useMemo<StatsFilters | null>(() => {
    if (!dataApi.bounds) return null;
    return {
      from: dataApi.bounds.from,
      to: dataApi.bounds.to,
      companyIds: filtersApi.filters.companyIds.length
        ? filtersApi.filters.companyIds
        : undefined,
      venueIds: filtersApi.filters.venueIds.length
        ? filtersApi.filters.venueIds
        : undefined,
    };
  }, [dataApi.bounds, filtersApi.filters.companyIds, filtersApi.filters.venueIds]);

  const filtersForDetail = effectiveFilters ?? EMPTY_FILTERS;
  const showDetail = useShowDetail(filtersForDetail);
  const venueDetail = useVenueDetail(filtersForDetail);

  return {
    ...filtersApi,
    ...dataApi,
    effectiveFilters,
    showDetail,
    venueDetail,
  };
}
