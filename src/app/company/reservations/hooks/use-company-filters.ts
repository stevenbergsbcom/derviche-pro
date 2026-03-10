/**
 * Hook useCompanyFilters - Logique des filtres réservations compagnie
 * Derviche Diffusion - Session 117
 * 
 * Gère:
 * - Recherche avec debounce
 * - Filtres API (show, status, checkin, period)
 * - Presets de dates et dates personnalisées
 * - Compteur de filtres actifs
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  type PeriodPreset,
  type DatePreset,
  type SortOption,
  getDatePresetRange,
} from '@/components/company/reservations';
import type { ReservationStatus, CheckinStatus } from '@/types/database';
import type { PaginationOptions } from '@/lib/services/company-reservations';
import { DEFAULT_PERIOD, DEFAULT_SORT } from '../constants';
import type { CompanyReservationFilters } from '../types';

// ============================================
// TYPES
// ============================================

interface UseCompanyFiltersOptions {
  /** Filtres initiaux depuis le hook parent */
  initialFilters: CompanyReservationFilters;
  /** Callback pour mettre à jour les filtres dans le hook parent */
  onFiltersChange: (filters: CompanyReservationFilters) => void;
  /** Callback pour recharger les données (signature du hook useCompanyReservations) */
  onReload: (
    filters?: CompanyReservationFilters,
    pagination?: PaginationOptions
  ) => Promise<{ success: boolean; error?: string }>;
  /** Taille de page actuelle */
  pageSize: number;
}

interface UseCompanyFiltersReturn {
  // États locaux
  searchInput: string;
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;
  filtersExpanded: boolean;
  
  // États dérivés
  isSearching: boolean;
  isDebouncing: boolean;
  activeFiltersCount: number;
  
  // Handlers recherche
  handleSearchChange: (value: string) => void;
  handleClearSearch: () => void;
  
  // Handlers filtres
  handleShowFilter: (showId: string) => void;
  handleStatusFilter: (status: string) => void;
  handleCheckinFilter: (checkinStatus: string) => void;
  handlePeriodFilter: (period: string) => void;
  handleSortChange: (sortBy: SortOption | undefined) => void;
  
  // Handlers dates
  handleDatePreset: (preset: DatePreset) => void;
  handleDateFromChange: (value: string) => void;
  handleDateToChange: (value: string) => void;
  
  // Handlers UI
  handleToggleExpanded: () => void;
  handleResetFilters: () => void;
}

// ============================================
// HOOK
// ============================================

export function useCompanyFilters({
  initialFilters,
  onFiltersChange,
  onReload,
  pageSize,
}: UseCompanyFiltersOptions): UseCompanyFiltersReturn {
  // ----------------------------------------
  // États locaux
  // ----------------------------------------
  
  const [searchInput, setSearchInput] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce de la recherche
  const debouncedSearch = useDebounce(searchInput, 300);
  const isDebouncing = searchInput !== debouncedSearch;
  
  // Refs pour éviter les dépendances cycliques dans les effects
  const filtersRef = useRef(initialFilters);
  const pageSizeRef = useRef(pageSize);
  const onReloadRef = useRef(onReload);
  const previousSearchRef = useRef<string | undefined>(undefined);
  
  // Mise à jour des refs
  useEffect(() => { filtersRef.current = initialFilters; }, [initialFilters]);
  useEffect(() => { pageSizeRef.current = pageSize; }, [pageSize]);
  useEffect(() => { onReloadRef.current = onReload; }, [onReload]);
  
  // ----------------------------------------
  // Effect recherche debounce
  // ----------------------------------------
  
  useEffect(() => {
    // Ignorer le premier render si pas de recherche
    if (previousSearchRef.current === undefined && debouncedSearch === '') {
      previousSearchRef.current = '';
      return;
    }
    
    // Ignorer si pas de changement
    if (previousSearchRef.current === debouncedSearch) return;
    
    previousSearchRef.current = debouncedSearch;
    setIsSearching(true);
    
    const newFilters = {
      ...filtersRef.current,
      search: debouncedSearch.trim() || undefined,
    };
    
    const doSearch = async () => {
      try {
        await onReloadRef.current(newFilters, { page: 1, pageSize: pageSizeRef.current });
      } finally {
        setIsSearching(false);
      }
    };
    
    void doSearch();
  }, [debouncedSearch]);
  
  // ----------------------------------------
  // Compteur filtres actifs (memoizé)
  // ----------------------------------------
  
  const activeFiltersCount = useMemo(() => {
    return [
      initialFilters.showId,
      initialFilters.status,
      initialFilters.checkinStatus,
      initialFilters.search,
      initialFilters.dateFrom,
      initialFilters.dateTo,
      initialFilters.period && initialFilters.period !== DEFAULT_PERIOD ? initialFilters.period : null,
      initialFilters.sortBy && initialFilters.sortBy !== DEFAULT_SORT ? initialFilters.sortBy : null,
    ].filter(Boolean).length;
  }, [initialFilters]);
  
  // ----------------------------------------
  // Handlers recherche
  // ----------------------------------------
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
  }, []);
  
  // ----------------------------------------
  // Handlers filtres
  // ----------------------------------------
  
  const handleShowFilter = useCallback((showId: string) => {
    onFiltersChange({
      ...filtersRef.current,
      showId: showId === 'all' ? undefined : showId,
    });
  }, [onFiltersChange]);
  
  const handleStatusFilter = useCallback((status: string) => {
    onFiltersChange({
      ...filtersRef.current,
      status: status === 'all' ? undefined : status as ReservationStatus,
    });
  }, [onFiltersChange]);
  
  const handleCheckinFilter = useCallback((checkinStatus: string) => {
    onFiltersChange({
      ...filtersRef.current,
      checkinStatus: checkinStatus === 'all' ? undefined : checkinStatus as CheckinStatus,
    });
  }, [onFiltersChange]);
  
  const handlePeriodFilter = useCallback((period: string) => {
    // Reset dates lors du changement de période
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    
    onFiltersChange({
      ...filtersRef.current,
      period: period === 'all' ? undefined : period as PeriodPreset,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, [onFiltersChange]);
  
  const handleSortChange = useCallback((sortBy: SortOption | undefined) => {
    onFiltersChange({
      ...filtersRef.current,
      sortBy: sortBy || DEFAULT_SORT,
    });
  }, [onFiltersChange]);
  
  // ----------------------------------------
  // Handlers dates
  // ----------------------------------------
  
  const handleDatePreset = useCallback((preset: DatePreset) => {
    if (preset === 'custom') {
      setDatePreset('custom');
      return;
    }
    
    const range = getDatePresetRange(preset);
    setDatePreset(preset);
    setDateFrom(range.dateFrom || '');
    setDateTo(range.dateTo || '');
    
    onFiltersChange({
      ...filtersRef.current,
      period: undefined,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    });
  }, [onFiltersChange]);
  
  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setDatePreset('custom');
    
    onFiltersChange({
      ...filtersRef.current,
      period: undefined,
      dateFrom: value || undefined,
    });
  }, [onFiltersChange]);
  
  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setDatePreset('custom');
    
    onFiltersChange({
      ...filtersRef.current,
      period: undefined,
      dateTo: value || undefined,
    });
  }, [onFiltersChange]);
  
  // ----------------------------------------
  // Handlers UI
  // ----------------------------------------
  
  const handleToggleExpanded = useCallback(() => {
    setFiltersExpanded((prev) => !prev);
  }, []);
  
  const handleResetFilters = useCallback(() => {
    // Reset états locaux
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setDatePreset(null);
    previousSearchRef.current = '';
    
    // Reset TOUS les filtres API (showId, status, checkinStatus inclus)
    onFiltersChange({
      period: DEFAULT_PERIOD,
      sortBy: DEFAULT_SORT,
      showId: undefined,
      status: undefined,
      checkinStatus: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      search: undefined,
    });
  }, [onFiltersChange]);
  
  // ----------------------------------------
  // Return
  // ----------------------------------------
  
  return {
    // États locaux
    searchInput,
    datePreset,
    dateFrom,
    dateTo,
    filtersExpanded,
    
    // États dérivés
    isSearching,
    isDebouncing,
    activeFiltersCount,
    
    // Handlers recherche
    handleSearchChange,
    handleClearSearch,
    
    // Handlers filtres
    handleShowFilter,
    handleStatusFilter,
    handleCheckinFilter,
    handlePeriodFilter,
    handleSortChange,
    
    // Handlers dates
    handleDatePreset,
    handleDateFromChange,
    handleDateToChange,
    
    // Handlers UI
    handleToggleExpanded,
    handleResetFilters,
  };
}
