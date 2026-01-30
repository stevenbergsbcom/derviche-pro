/**
 * Page Réservations - Espace Compagnie
 * Derviche Diffusion - Session 117
 * 
 * Orchestrateur qui assemble les composants modulaires
 * Fonctionnalités : filtres, tri, export CSV/Excel
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  useCompanyReservations,
  type CompanyExportOptions,
} from '@/hooks/useCompanyReservations';
import { type SortOption, CompanyExportDialog } from '@/components/company/reservations';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

// Composants locaux
import {
  HeaderActions,
  CompanyStatsCards,
  FiltersSection,
  ReservationsTable,
  PaginationControls,
} from './components';
import { useCompanyFilters } from './hooks';
import { DEFAULT_VISIBLE_COLUMNS, DEFAULT_PERIOD, DEFAULT_SORT } from './constants';

// ============================================
// COMPOSANT PAGE
// ============================================

export default function CompanyReservationsPage() {
  // Hook principal des réservations
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

  // États dialogs
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Hook des filtres avec toute la logique
  const filtersHook = useCompanyFilters({
    initialFilters: filters,
    onFiltersChange: setFilters,
    onReload: loadReservations,
    pageSize,
  });

  // Colonnes visibles (fixes pour la compagnie)
  const visibleColumns = DEFAULT_VISIBLE_COLUMNS;

  // ----------------------------------------
  // Chargement initial
  // ----------------------------------------

  useEffect(() => {
    void loadReservations({ period: DEFAULT_PERIOD, sortBy: DEFAULT_SORT });
    void loadStats();
    void loadShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------
  // Handlers
  // ----------------------------------------

  const handleRefresh = useCallback(() => {
    void loadReservations(filters, { page, pageSize });
    void loadStats();
  }, [filters, page, pageSize, loadReservations, loadStats]);

  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleExportWithOptions = useCallback(
    async (options: CompanyExportOptions): Promise<{ success: boolean; error?: string }> => {
      setIsExporting(true);
      const result = await exportWithOptions(options);
      setIsExporting(false);
      return result;
    },
    [exportWithOptions]
  );

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <HeaderActions
        isLoading={isLoading}
        hasReservations={reservations.length > 0}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Statistiques */}
      {stats && <CompanyStatsCards stats={stats} />}

      {/* Filtres */}
      <FiltersSection
        filtersExpanded={filtersHook.filtersExpanded}
        onToggleExpanded={filtersHook.handleToggleExpanded}
        activeFiltersCount={filtersHook.activeFiltersCount}
        searchInput={filtersHook.searchInput}
        onSearchChange={filtersHook.handleSearchChange}
        onClearSearch={filtersHook.handleClearSearch}
        isSearching={filtersHook.isSearching}
        isDebouncing={filtersHook.isDebouncing}
        filters={filters}
        shows={shows}
        onShowFilter={filtersHook.handleShowFilter}
        onStatusFilter={filtersHook.handleStatusFilter}
        onCheckinFilter={filtersHook.handleCheckinFilter}
        onPeriodFilter={filtersHook.handlePeriodFilter}
        onSortChange={filtersHook.handleSortChange}
        datePreset={filtersHook.datePreset}
        dateFrom={filtersHook.dateFrom}
        dateTo={filtersHook.dateTo}
        onDatePreset={filtersHook.handleDatePreset}
        onDateFromChange={filtersHook.handleDateFromChange}
        onDateToChange={filtersHook.handleDateToChange}
        onResetFilters={filtersHook.handleResetFilters}
      />

      {/* Erreur */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tableau + Pagination */}
      <Card className="bg-card/80">
        <CardContent className="p-0">
          {/* Info résultats + sélecteur taille */}
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

          {/* Tableau */}
          <ReservationsTable
            reservations={reservations}
            visibleColumns={visibleColumns}
            isLoading={isLoading}
            activeFiltersCount={filtersHook.activeFiltersCount}
            currentSort={filters.sortBy as SortOption | undefined}
            onSortChange={filtersHook.handleSortChange}
            onResetFilters={filtersHook.handleResetFilters}
          />
        </CardContent>
      </Card>

      {/* Dialog Export */}
      <CompanyExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reservations={reservations}
        filters={filters}
        visibleColumns={visibleColumns}
        onExport={handleExportWithOptions}
        isExporting={isExporting}
      />
    </div>
  );
}
