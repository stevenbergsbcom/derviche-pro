'use client';

import { useState, useMemo, useCallback } from 'react';
import { searchMatch } from '@/lib/utils';
import { getMonthFromDate, formatDate } from '../helpers';
import type { MockRepresentation, MockVenue } from '../types';

// ============================================
// TYPES
// ============================================

interface UseSlotFiltersParams {
  representations: MockRepresentation[];
  venues: MockVenue[];
}

export interface UseSlotFiltersReturn {
  // État des filtres
  monthFilter: string;
  venueFilter: string;
  dateSearch: string;
  sortDir: 'asc' | 'desc';
  hidePast: boolean;

  // Données dérivées
  hasActiveFilters: boolean;
  availableMonths: string[];
  usedVenues: MockVenue[];
  todayStr: string;
  pastCount: number;
  filteredRepresentations: MockRepresentation[];

  // Setters
  setMonthFilter: (value: string) => void;
  setVenueFilter: (value: string) => void;
  setDateSearch: (value: string) => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  setHidePast: (hide: boolean) => void;
  resetFilters: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour la logique de filtrage, tri et recherche des représentations
 */
export function useSlotFilters({
  representations,
  venues,
}: UseSlotFiltersParams): UseSlotFiltersReturn {
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [dateSearch, setDateSearch] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // Masquer les passées par défaut
  const [hidePast, setHidePast] = useState<boolean>(true);

  const hasActiveFilters =
    monthFilter !== 'all' ||
    venueFilter !== 'all' ||
    dateSearch.trim() !== '' ||
    !hidePast ||
    sortDir !== 'asc';

  const resetFilters = useCallback(() => {
    setMonthFilter('all');
    setVenueFilter('all');
    setDateSearch('');
    setHidePast(true);
    setSortDir('asc');
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    representations.forEach((rep) => {
      months.add(getMonthFromDate(rep.date));
    });
    return Array.from(months).sort();
  }, [representations]);

  const usedVenues = useMemo(() => {
    const venueIds = new Set<string>();
    representations.forEach((rep) => {
      venueIds.add(rep.venueId);
    });
    return Array.from(venueIds)
      .map((id) => venues.find((v) => v.id === id))
      .filter(Boolean) as MockVenue[];
  }, [representations, venues]);

  // Date du jour au format YYYY-MM-DD.
  // On recalcule à chaque rendu : new Date() est O(1), pas besoin de mémoïser.
  const todayStr = new Date().toISOString().split('T')[0] ?? '';

  // Nombre de représentations passées (date strictement inférieure à aujourd'hui)
  const pastCount = useMemo(() => {
    return representations.filter((rep) => rep.date < todayStr).length;
  }, [representations, todayStr]);

  const filteredRepresentations = useMemo(() => {
    let filtered = [...representations];

    // Masquer les passées si demandé
    if (hidePast) {
      filtered = filtered.filter((rep) => rep.date >= todayStr);
    }

    if (monthFilter !== 'all') {
      filtered = filtered.filter((rep) => getMonthFromDate(rep.date) === monthFilter);
    }

    if (venueFilter !== 'all') {
      filtered = filtered.filter((rep) => rep.venueId === venueFilter);
    }

    if (dateSearch.trim()) {
      filtered = filtered.filter((rep) => {
        const formattedDate = formatDate(rep.date);
        return searchMatch(formattedDate, dateSearch);
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      const diff = dateA.getTime() - dateB.getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [representations, monthFilter, venueFilter, dateSearch, hidePast, sortDir, todayStr]);

  return {
    monthFilter,
    venueFilter,
    dateSearch,
    sortDir,
    hidePast,
    hasActiveFilters,
    availableMonths,
    usedVenues,
    todayStr,
    pastCount,
    filteredRepresentations,
    setMonthFilter,
    setVenueFilter,
    setDateSearch,
    setSortDir,
    setHidePast,
    resetFilters,
  };
}
