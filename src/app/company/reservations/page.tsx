/**
 * Page Réservations - Espace Compagnie
 * Structure identique à admin/reservations
 * Derviche Diffusion - Session 119
 * 
 * Orchestrateur qui assemble les composants modulaires
 * Fonctionnalités : recherche, filtres, tri, colonnes personnalisables, export CSV/Excel
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useCompanyReservations,
  type CompanyExportOptions,
} from '@/hooks/useCompanyReservations';
import {
  useCompanyReservationColumnsPreference,
  type CompanyReservationColumnsPreference,
} from '@/hooks/useUserPreferences';
import { type SortOption, CompanyExportDialog } from '@/components/company/reservations';
import { CompanyColumnSelectorDialog } from '@/components/company/column-selector-dialog';
import { toast } from 'sonner';

// Composants locaux
import {
  CompanyStatsCards,
  SearchAndActions,
  FiltersSection,
  ReservationsContent,
  PaginationControls,
} from './components';
import { useCompanyFilters } from './hooks';
import { DEFAULT_PERIOD, DEFAULT_SORT } from './constants';
import type { DatePreset } from './types';

// ============================================
// COMPOSANT PAGE
// ============================================

export default function CompanyReservationsPage() {
  // ============================================
  // HOOKS EXTERNES
  // ============================================
  
  const {
    reservations,
    total,
    page,
    totalPages,
    isLoading,
    error,
    stats,
    filters,
    shows,
    loadReservations,
    loadStats,
    loadShows,
    exportWithOptions,
    setPage,
    setPageSize,
    pageSize,
    setFilters,
  } = useCompanyReservations(50);

  const {
    preference: columnsPreference,
    visibleColumns,
    isLoading: columnsLoading,
    setPreference: setColumnsPreference,
  } = useCompanyReservationColumnsPreference();

  // Hook de gestion des filtres
  const filtersHook = useCompanyFilters({
    initialFilters: filters,
    onFiltersChange: setFilters,
    onReload: loadReservations,
    pageSize,
  });

  // ============================================
  // ÉTATS LOCAUX
  // ============================================

  // Recherche avec debounce (géré séparément comme dans admin)
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isSearching, setIsSearching] = useState(false);
  const previousSearchRef = useRef<string | undefined>(undefined);

  // Refs pour stabilité des callbacks
  const filtersRef = useRef(filters);
  const pageSizeRef = useRef(pageSize);
  const loadReservationsRef = useRef(loadReservations);

  // États dialogs
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);

  // États de traitement
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ============================================
  // EFFETS
  // ============================================

  // Chargement initial
  useEffect(() => {
    void loadReservations({ period: DEFAULT_PERIOD, sortBy: DEFAULT_SORT });
    void loadStats();
    void loadShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour les stats quand le filtre spectacle change
  // Note : setFilters dans le hook recharge déjà les réservations automatiquement
  // — appeler loadReservations ici provoquerait une boucle infinie
  useEffect(() => {
    void loadStats(filters.showId ? { showId: filters.showId } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.showId]);

  // Mise à jour des refs
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { pageSizeRef.current = pageSize; }, [pageSize]);
  useEffect(() => { loadReservationsRef.current = loadReservations; }, [loadReservations]);

  // Effet de recherche avec debounce
  useEffect(() => {
    if (previousSearchRef.current === undefined && debouncedSearch === '') {
      previousSearchRef.current = '';
      return;
    }
    if (previousSearchRef.current === debouncedSearch) return;

    previousSearchRef.current = debouncedSearch;
    setIsSearching(true);

    const newFilters = { ...filtersRef.current, search: debouncedSearch.trim() || undefined };

    const doSearch = async () => {
      try {
        await loadReservationsRef.current(newFilters, { page: 1, pageSize: pageSizeRef.current });
      } finally {
        setIsSearching(false);
      }
    };

    void doSearch();
  }, [debouncedSearch]);

  // ============================================
  // DONNÉES DÉRIVÉES
  // ============================================

  const isDebouncing = searchInput !== debouncedSearch;
  const columns = columnsLoading ? [] : visibleColumns;
  const globalLoading = isLoading || columnsLoading;

  // ============================================
  // HANDLERS
  // ============================================

  const handleClearSearch = useCallback(() => setSearchInput(''), []);
  const handleRefresh = useCallback(() => void loadReservations(), [loadReservations]);

  // Handler export
  const handleExportWithOptions = useCallback(async (options: CompanyExportOptions): Promise<{ success: boolean; error?: string }> => {
    setIsExporting(true);
    const result = await exportWithOptions(options);
    setIsExporting(false);
    return result;
  }, [exportWithOptions]);

  // Handler colonnes
  const handleSaveColumns = useCallback(async (newPreference: CompanyReservationColumnsPreference): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);
    const result = await setColumnsPreference(newPreference);
    setIsProcessing(false);
    if (result.success) {
      setColumnsDialogOpen(false);
      toast.success('Préférences enregistrées');
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
    return result;
  }, [setColumnsPreference]);

  // Handler reset filtres avec clear search
  const handleResetAllFilters = useCallback(() => {
    setSearchInput('');
    filtersHook.handleResetFilters();
  }, [filtersHook]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Titre (optionnel - si pas de header compagnie existant) */}
      <div>
        <h1 className="text-2xl font-bold text-derviche-dark">Réservations</h1>
        <p className="text-muted-foreground">Consultez les réservations sur vos spectacles</p>
      </div>

      {/* Statistiques */}
      {stats && <CompanyStatsCards stats={stats} />}

      {/* Barre d'actions et filtres */}
      <div className="space-y-3">
        <SearchAndActions
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={handleClearSearch}
          appliedSearch={filters.search}
          totalResults={total}
          isSearching={isSearching}
          isDebouncing={isDebouncing}
          isLoading={isLoading}
          showId={filters.showId}
          showsOptions={shows}
          onShowFilter={filtersHook.handleShowFilter}
          filtersExpanded={filtersHook.filtersExpanded}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onToggleExpanded={filtersHook.handleToggleExpanded}
          isExporting={isExporting}
          reservationsCount={reservations.length}
          onRefresh={handleRefresh}
          onOpenColumns={() => setColumnsDialogOpen(true)}
          onOpenExport={() => setExportDialogOpen(true)}
        />

        <FiltersSection
          filters={filters}
          filtersExpanded={filtersHook.filtersExpanded}
          activeFiltersCount={filtersHook.activeFiltersCount}
          datePreset={filtersHook.datePreset as DatePreset | null}
          dateFrom={filtersHook.dateFrom}
          dateTo={filtersHook.dateTo}
          onStatusFilter={filtersHook.handleStatusFilter}
          onCheckinFilter={filtersHook.handleCheckinFilter}
          onSortChange={filtersHook.handleSortChange}
          onPeriodFilter={filtersHook.handlePeriodFilter}
          onDatePreset={filtersHook.handleDatePreset as (preset: DatePreset) => void}
          onDateFromChange={filtersHook.handleDateFromChange}
          onDateToChange={filtersHook.handleDateToChange}
          onResetFilters={handleResetAllFilters}
        />
      </div>

      {/* Contenu principal */}
      <ReservationsContent
        reservations={reservations}
        columns={columns}
        currentSort={filters.sortBy as SortOption | undefined}
        isLoading={globalLoading}
        error={error}
        activeFiltersCount={filtersHook.activeFiltersCount}
        onRetry={handleRefresh}
        onResetFilters={handleResetAllFilters}
        onSortChange={filtersHook.handleSortChange}
      />

      {/* Pagination */}
      {!globalLoading && !error && reservations.length > 0 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Dialogs */}
      <CompanyColumnSelectorDialog
        open={columnsDialogOpen}
        onOpenChange={setColumnsDialogOpen}
        preference={columnsPreference}
        onSave={handleSaveColumns}
        isSaving={isProcessing}
      />

      <CompanyExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reservations={reservations}
        filters={filters}
        visibleColumns={columns}
        onExport={handleExportWithOptions}
        isExporting={isExporting}
      />
    </div>
  );
}
