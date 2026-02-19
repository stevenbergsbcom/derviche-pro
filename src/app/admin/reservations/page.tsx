/**
 * Page de gestion des réservations admin
 * Refactorisé Session 106 - Pattern orchestrateur
 * Derviche Diffusion
 */

'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import { AdminPageHeader } from '@/components/admin';
import { useAdminReservations } from '@/hooks/useAdminReservations';
import { useShows } from '@/hooks/useShows';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useReservationColumnsPreference,
  type ReservationColumnsPreference,
} from '@/hooks/useUserPreferences';
import { ColumnSelectorDialog } from '@/components/admin/column-selector-dialog';
import { ExportDialog, type ExportOptions } from '@/components/admin/export-dialog';
import {
  type SortOption,
  EditReservationDialog,
  CreateReservationDialog,
} from '@/components/admin/reservations';
import type { AdminReservation, UpdateReservationData, CreateAdminReservationData } from '@/lib/services/admin-reservations';
import { createAdminReservation, getAdminReservationById } from '@/lib/services/admin-reservations';
import { useSearchParams } from 'next/navigation';
import type { CheckinStatus } from '@/types/database';
import { toast } from 'sonner';

// Composants locaux extraits
import {
  StatsCards,
  SearchAndActions,
  FiltersSection,
  ReservationsContent,
  PaginationControls,
  CheckinDialog,
  CancelDialog,
} from './components';
import { useReservationFilters } from './hooks';

// ============================================
// COMPOSANT PAGE
// ============================================

// ============================================
// COMPOSANT INTERNE (nécessite Suspense pour useSearchParams)
// ============================================

function AdminReservationsContent() {
  // ============================================
  // HOOKS EXTERNES
  // ============================================

  const searchParams = useSearchParams();

  const {
    reservations,
    total,
    page,
    totalPages,
    isLoading,
    error,
    stats,
    filters,
    loadReservations,
    loadStats,
    checkin,
    update,
    cancel,
    exportWithOptions,
    getSlots,
    setPage,
    setPageSize,
    pageSize,
    setFilters,
  } = useAdminReservations(50);

  const { shows, refresh: refreshShows } = useShows();
  const { isExterne, assignedShowIds, isLoading: permissionsLoading } = useAdminPermissions();
  const { 
    preference: columnsPreference, 
    visibleColumns, 
    isLoading: columnsLoading,
    setPreference: setColumnsPreference,
  } = useReservationColumnsPreference();

  // Hook de gestion des filtres
  const filtersHook = useReservationFilters({ filters, setFilters });

  // ============================================
  // ÉTATS LOCAUX
  // ============================================

  // Recherche avec debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [isSearching, setIsSearching] = useState(false);
  const previousSearchRef = useRef<string | undefined>(undefined);

  // Refs pour stabilité des callbacks
  const filtersRef = useRef(filters);
  const pageSizeRef = useRef(pageSize);
  const loadReservationsRef = useRef(loadReservations);

  // États dialogs
  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // États de traitement
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ============================================
  // EFFETS
  // ============================================

  // Chargement initial
  useEffect(() => {
    void loadReservations({ period: 'upcoming', sortBy: 'slot_date_asc' });
    void loadStats();
    void refreshShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mise à jour des refs
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { pageSizeRef.current = pageSize; }, [pageSize]);
  useEffect(() => { loadReservationsRef.current = loadReservations; }, [loadReservations]);

  // Deep-link : ouvre une réservation spécifique si ?reservationId=xxx dans l'URL
  // Dépendance sur searchParams pour réagir aux changements d'URL en navigation client
  const reservationIdParam = searchParams.get('reservationId');
  useEffect(() => {
    if (!reservationIdParam) return;

    // Validation UUID basique avant d'appeler l'API
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(reservationIdParam)) {
      toast.error('Identifiant de réservation invalide');
      return;
    }

    const openFromUrl = async () => {
      const result = await getAdminReservationById(reservationIdParam);
      if (result.data) {
        setSelectedReservation(result.data);
        setEditDialogOpen(true);
        // Nettoyer l'URL sans recharger la page
        const url = new URL(window.location.href);
        url.searchParams.delete('reservationId');
        window.history.replaceState({}, '', url.toString());
      } else {
        toast.error('Réservation introuvable');
      }
    };

    void openFromUrl();
  }, [reservationIdParam]);

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
  const globalLoading = isLoading || columnsLoading || permissionsLoading;

  // Spectacles filtrés pour les externes
  const showsOptions = useMemo(() => {
    const publishedShows = shows.filter(s => s.status === 'published');
    if (permissionsLoading) return publishedShows;
    if (isExterne && assignedShowIds && assignedShowIds.length > 0) {
      return publishedShows.filter(s => assignedShowIds.includes(s.id));
    }
    if (isExterne && assignedShowIds && assignedShowIds.length === 0) {
      return [];
    }
    return publishedShows;
  }, [shows, isExterne, assignedShowIds, permissionsLoading]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleClearSearch = useCallback(() => setSearchInput(''), []);
  const handleRefresh = useCallback(() => void loadReservations(), [loadReservations]);

  // Handlers de dialogs
  const openCheckinDialog = useCallback((reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setCheckinDialogOpen(true);
  }, []);

  const openCancelDialog = useCallback((reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((reservation: AdminReservation) => {
    setSelectedReservation(reservation);
    setEditDialogOpen(true);
  }, []);

  // Handler check-in
  const handleCheckin = useCallback(async (status: CheckinStatus) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await checkin(selectedReservation.id, { checkinStatus: status });
    setIsProcessing(false);
    if (result.success) {
      setCheckinDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  }, [selectedReservation, checkin, loadStats]);

  // Handler annulation
  const handleCancel = useCallback(async (reason?: string) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await cancel(selectedReservation.id, reason);
    setIsProcessing(false);
    if (result.success) {
      setCancelDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  }, [selectedReservation, cancel, loadStats]);

  // Handler modification
  const handleEdit = useCallback(async (data: UpdateReservationData) => {
    if (!selectedReservation) return;
    setIsProcessing(true);
    const result = await update(selectedReservation.id, data);
    setIsProcessing(false);
    if (result.success) {
      setEditDialogOpen(false);
      setSelectedReservation(null);
      void loadStats();
    }
  }, [selectedReservation, update, loadStats]);

  // Handler création
  const handleCreate = useCallback(async (data: CreateAdminReservationData) => {
    const result = await createAdminReservation(data);
    if (result.success) {
      setSearchInput('');
      filtersHook.handleResetFilters();
      const resetFilters = { period: 'all' as const, sortBy: 'created_at_desc' as SortOption };
      setFilters(resetFilters);
      void loadReservations(resetFilters);
      void loadStats();
    }
    return result;
  }, [filtersHook, setFilters, loadReservations, loadStats]);

  // Handler export
  const handleExportWithOptions = useCallback(async (options: ExportOptions): Promise<{ success: boolean; error?: string }> => {
    setIsExporting(true);
    const result = await exportWithOptions(options);
    setIsExporting(false);
    return result;
  }, [exportWithOptions]);

  // Handler colonnes
  const handleSaveColumns = useCallback(async (newPreference: ReservationColumnsPreference): Promise<{ success: boolean; error?: string }> => {
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
      <AdminPageHeader
        title="Réservations"
        actionLabel="Nouvelle réservation"
        onAction={() => setCreateDialogOpen(true)}
      />

      {/* Statistiques */}
      {stats && <StatsCards stats={stats} isExterne={isExterne} />}

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
          isExporting={isExporting}
          reservationsCount={reservations.length}
          onRefresh={handleRefresh}
          onOpenColumns={() => setColumnsDialogOpen(true)}
          onOpenExport={() => setExportDialogOpen(true)}
        />

        <FiltersSection
          filters={filters}
          showsOptions={showsOptions}
          isExterne={isExterne}
          filtersExpanded={filtersHook.filtersExpanded}
          activeFiltersCount={filtersHook.activeFiltersCount}
          datePreset={filtersHook.datePreset}
          dateFrom={filtersHook.dateFrom}
          dateTo={filtersHook.dateTo}
          onToggleExpanded={filtersHook.toggleFiltersExpanded}
          onShowFilter={filtersHook.handleShowFilter}
          onStatusFilter={filtersHook.handleStatusFilter}
          onSortChange={filtersHook.handleSortChange}
          onPeriodFilter={filtersHook.handlePeriodFilter}
          onDatePreset={filtersHook.handleDatePreset}
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
        onEdit={openEditDialog}
        onCheckin={openCheckinDialog}
        onCancel={openCancelDialog}
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
      <CheckinDialog
        open={checkinDialogOpen}
        onOpenChange={setCheckinDialogOpen}
        reservation={selectedReservation}
        onCheckin={handleCheckin}
        isProcessing={isProcessing}
      />

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        reservation={selectedReservation}
        onCancel={handleCancel}
        isProcessing={isProcessing}
      />

      <ColumnSelectorDialog
        open={columnsDialogOpen}
        onOpenChange={setColumnsDialogOpen}
        preference={columnsPreference}
        onSave={handleSaveColumns}
        isSaving={isProcessing}
      />

      <EditReservationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        reservation={selectedReservation}
        onSave={handleEdit}
        onCancel={openCancelDialog}
        onGetSlots={getSlots}
        isSaving={isProcessing}
      />

      <CreateReservationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        shows={showsOptions}
        onGetSlots={getSlots}
        onCreate={handleCreate}
      />

      <ExportDialog
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

// ============================================
// EXPORT PAR DÉFAUT - Wrapper Suspense requis pour useSearchParams
// ============================================

export default function AdminReservationsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReservationsContent />
    </Suspense>
  );
}
