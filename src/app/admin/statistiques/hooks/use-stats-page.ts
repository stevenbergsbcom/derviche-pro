/**
 * use-stats-page - Orchestrateur de la page /admin/statistiques
 * Derviche Diffusion
 *
 * Compose `useStatsFilters` + `useStatsData` en un seul hook consommé
 * par `page.tsx`.
 */

'use client';

import { useStatsFilters, type UseStatsFiltersReturn } from './use-stats-filters';
import { useStatsData, type UseStatsDataReturn } from './use-stats-data';

export interface UseStatsPageReturn extends UseStatsFiltersReturn, UseStatsDataReturn {}

export function useStatsPage(): UseStatsPageReturn {
  const filtersApi = useStatsFilters();
  const dataApi = useStatsData(filtersApi.filters);

  return {
    ...filtersApi,
    ...dataApi,
  };
}
