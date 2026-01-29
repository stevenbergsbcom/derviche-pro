/**
 * Hook pour la gestion des filtres de réservations admin
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

import { useState, useCallback, useMemo } from 'react';
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

  // ============================================
  // HANDLERS
  // ============================================

  const handleShowFilter = useCallback((showId: string) => {
    setFilters({ ...filters, showId: showId === 'all' ? undefined : showId });
  }, [filters, setFilters]);

  const handleStatusFilter = useCallback((status: string) => {
    setFilters({ 
      ...filters, 
      status: status === 'all' ? undefined : status as ReservationStatus 
    });
  }, [filters, setFilters]);

  const handlePeriodFilter = useCallback((period: string) => {
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    setFilters({ 
      ...filters, 
      period: period as PeriodPreset, 
      dateFrom: undefined, 
      dateTo: undefined 
    });
  }, [filters, setFilters]);

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
      ...filters, 
      period: undefined, 
      dateFrom: range.dateFrom, 
      dateTo: range.dateTo 
    });
  }, [filters, setFilters]);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setDatePreset('custom');
    setFilters({ 
      ...filters, 
      period: undefined, 
      dateFrom: value || undefined 
    });
  }, [filters, setFilters]);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setDatePreset('custom');
    setFilters({ 
      ...filters, 
      period: undefined, 
      dateTo: value || undefined 
    });
  }, [filters, setFilters]);

  const handleSortChange = useCallback((sortBy: SortOption | string | undefined) => {
    setFilters({ 
      ...filters, 
      sortBy: (sortBy || 'slot_date_asc') as SortOption 
    });
  }, [filters, setFilters]);

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
