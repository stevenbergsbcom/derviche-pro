/**
 * Hook pour la gestion des filtres de réservations admin
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  type PeriodPreset,
  type DatePreset,
  type SortOption,
  getDatePresetRange,
} from '@/components/admin/reservations';
import type { ReservationStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface ReservationFiltersState {
  showId?: string;
  venueId?: string;
  status?: ReservationStatus;
  search?: string;
  period?: PeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: SortOption;
}

export interface UseReservationFiltersProps {
  filters: ReservationFiltersState;
  setFilters: (filters: ReservationFiltersState) => void;
}

export interface UseReservationFiltersReturn {
  // États locaux des dates
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;
  filtersExpanded: boolean;
  
  // Handlers
  handleShowFilter: (showId: string) => void;
  handleVenueFilter: (venueId: string) => void;
  handleStatusFilter: (status: string) => void;
  handlePeriodFilter: (period: string) => void;
  handleDatePreset: (preset: DatePreset) => void;
  handleDateFromChange: (value: string) => void;
  handleDateToChange: (value: string) => void;
  handleSortChange: (sortBy: SortOption | string | undefined) => void;
  handleResetFilters: () => void;
  toggleFiltersExpanded: () => void;
  
  // Computed
  activeFiltersCount: number;
}

// ============================================
// HOOK
// ============================================

export function useReservationFilters({
  filters,
  setFilters,
}: UseReservationFiltersProps): UseReservationFiltersReturn {
  // États locaux pour les dates (UI uniquement)
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Ref pour stabilité des callbacks (évite re-création à chaque changement de filters)
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleShowFilter = useCallback((showId: string) => {
    setFilters({ ...filtersRef.current, showId: showId === 'all' ? undefined : showId });
  }, [setFilters]);

  const handleVenueFilter = useCallback((venueId: string) => {
    setFilters({ ...filtersRef.current, venueId: venueId === 'all' ? undefined : venueId });
  }, [setFilters]);

  const handleStatusFilter = useCallback((status: string) => {
    setFilters({ 
      ...filtersRef.current, 
      status: status === 'all' ? undefined : status as ReservationStatus 
    });
  }, [setFilters]);

  const handlePeriodFilter = useCallback((period: string) => {
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    setFilters({ 
      ...filtersRef.current, 
      period: period as PeriodPreset, 
      dateFrom: undefined, 
      dateTo: undefined 
    });
  }, [setFilters]);

  const handleDatePreset = useCallback((preset: DatePreset) => {
    if (preset === 'custom') {
      setDatePreset('custom');
      return;
    }
    const range = getDatePresetRange(preset);
    setDatePreset(preset);
    setDateFrom(range.dateFrom || '');
    setDateTo(range.dateTo || '');
    setFilters({ 
      ...filtersRef.current, 
      period: undefined, 
      dateFrom: range.dateFrom, 
      dateTo: range.dateTo 
    });
  }, [setFilters]);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setDatePreset('custom');
    setFilters({ 
      ...filtersRef.current, 
      period: undefined, 
      dateFrom: value || undefined 
    });
  }, [setFilters]);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setDatePreset('custom');
    setFilters({ 
      ...filtersRef.current, 
      period: undefined, 
      dateTo: value || undefined 
    });
  }, [setFilters]);

  const handleSortChange = useCallback((sortBy: SortOption | string | undefined) => {
    setFilters({ 
      ...filtersRef.current, 
      sortBy: (sortBy || 'slot_date_asc') as SortOption 
    });
  }, [setFilters]);

  const handleResetFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    setFilters({ period: 'upcoming', sortBy: 'slot_date_asc' });
  }, [setFilters]);

  const toggleFiltersExpanded = useCallback(() => {
    setFiltersExpanded(prev => !prev);
  }, []);

  // ============================================
  // COMPUTED
  // ============================================

  const activeFiltersCount = useMemo(() => {
    return [
      filters.showId,
      filters.venueId,
      filters.status,
      filters.search,
      filters.dateFrom,
      filters.dateTo,
      filters.period && filters.period !== 'upcoming' ? filters.period : null,
      filters.sortBy && filters.sortBy !== 'slot_date_asc' ? filters.sortBy : null,
    ].filter(Boolean).length;
  }, [filters]);

  return {
    // États
    datePreset,
    dateFrom,
    dateTo,
    filtersExpanded,
    
    // Handlers
    handleShowFilter,
    handleVenueFilter,
    handleStatusFilter,
    handlePeriodFilter,
    handleDatePreset,
    handleDateFromChange,
    handleDateToChange,
    handleSortChange,
    handleResetFilters,
    toggleFiltersExpanded,
    
    // Computed
    activeFiltersCount,
  };
}
