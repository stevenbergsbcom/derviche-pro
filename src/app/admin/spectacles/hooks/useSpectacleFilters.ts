/**
 * Hook de filtrage et tri des spectacles
 * Extrait de useSpectaclesPage (S191)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchMatch } from '@/lib/utils';

import type { ShowForDisplay, ViewMode, SpectacleSortValue } from '../types';
import { DEFAULT_VIEW_MODE } from '../constants';

// ============================================================================
// Helpers de tri
// ============================================================================

function sortShows(shows: ShowForDisplay[], sortValue: SpectacleSortValue): ShowForDisplay[] {
  return [...shows].sort((a, b) => {
    switch (sortValue) {
      case 'title_asc':
        return a.title.localeCompare(b.title, 'fr');
      case 'title_desc':
        return b.title.localeCompare(a.title, 'fr');
      case 'companyName_asc':
        return a.companyName.localeCompare(b.companyName, 'fr');
      case 'companyName_desc':
        return b.companyName.localeCompare(a.companyName, 'fr');
      case 'representationsCount_desc':
        return b.representationsCount - a.representationsCount;
      case 'representationsCount_asc':
        return a.representationsCount - b.representationsCount;
      default:
        return 0;
    }
  });
}

// ============================================================================
// Types
// ============================================================================

interface UseSpectacleFiltersParams {
  shows: ShowForDisplay[];
  isExterne: boolean;
  assignedShowIds: string[] | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useSpectacleFilters({
  shows,
  isExterne,
  assignedShowIds,
}: UseSpectacleFiltersParams) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Recherche
  const [searchQuery, setSearchQuery] = useState<string>('');
  const urlSearchParam = searchParams.get('search') || '';

  // Tri
  const [sortValue, setSortValue] = useState<SpectacleSortValue>('title_asc');

  // Mode d'affichage
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);

  // Sync URL → state
  useEffect(() => {
    setSearchQuery(urlSearchParam);
  }, [urlSearchParam]);

  // Filtrage + tri des spectacles
  const filteredShows = useMemo(() => {
    // 1. Filtrer par assignations si externe
    let filtered = shows;
    if (isExterne && assignedShowIds !== null) {
      filtered = shows.filter((show) => assignedShowIds.includes(show.id));
    }

    // 2. Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered.filter(
        (show) =>
          searchMatch(show.title, query) ||
          searchMatch(show.companyName, query) ||
          show.categories.some((cat) => searchMatch(cat, query))
      );
    }

    // 3. Tri
    return sortShows(filtered, sortValue);
  }, [searchQuery, shows, isExterne, assignedShowIds, sortValue]);

  // Note : le tri n'est pas un filtre (il ne réduit pas la liste) → exclu de hasActiveFilters
  const hasActiveFilters = searchQuery.trim() !== '';

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSortValue('title_asc');
    router.push('/admin/spectacles');
  }, [router, setSortValue]);

  return {
    searchQuery,
    setSearchQuery,
    sortValue,
    setSortValue,
    viewMode,
    setViewMode,
    filteredShows,
    hasActiveFilters,
    resetFilters,
  };
}
