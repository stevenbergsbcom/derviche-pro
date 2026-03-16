/**
 * Hook useCompanyReservations - Gestion des réservations côté compagnie
 * Derviche Diffusion
 *
 * Fonctionnalités (lecture seule) :
 * - Liste paginée avec filtres
 * - Export CSV et Excel (colonnes restreintes)
 * - Statistiques
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getCompanyReservations,
  getAllCompanyReservationsForExport,
  getCompanyReservationStats,
  getCompanyShows,
  type CompanyReservation,
  type CompanyReservationFilters,
  type PaginationOptions,
  type CompanyReservationStats,
} from '@/lib/services/company-reservations';
import { logger } from '@/lib/logger';
import type { CompanyExportOptions, UseCompanyReservationsReturn } from './types';
import {
  generateCompanyExportFilename,
  reservationsToCSV,
  reservationsToExcel,
  downloadCSV,
  downloadExcel,
} from './export-helpers';

// Barrel re-exports
export * from './types';
export * from './constants';
export { generateCompanyExportFilename } from './export-helpers';

// ============================================
// HOOK
// ============================================

export function useCompanyReservations(
  initialPageSize: number = 20
): UseCompanyReservationsReturn {
  const [reservations, setReservations] = useState<CompanyReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CompanyReservationStats | null>(null);
  const [filters, setFiltersState] = useState<CompanyReservationFilters>({});
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [shows, setShows] = useState<Array<{ id: string; title: string; slug: string }>>([]);

  // Ref pour éviter les race conditions
  const loadingRef = useRef<string | null>(null);

  // ============================================
  // LOAD RESERVATIONS
  // ============================================
  const loadReservations = useCallback(
    async (
      newFilters?: CompanyReservationFilters,
      pagination?: PaginationOptions
    ): Promise<{ success: boolean; error?: string }> => {
      const requestId = Date.now().toString();
      loadingRef.current = requestId;

      const activeFilters = newFilters ?? filters;
      const activePagination = pagination ?? { page, pageSize };

      setIsLoading(true);
      setError(null);

      const result = await getCompanyReservations(activeFilters, activePagination);

      // Vérifier que la requête est toujours d'actualité
      if (loadingRef.current !== requestId) {
        return { success: false, error: 'Requête annulée' };
      }

      setIsLoading(false);
      loadingRef.current = null;

      if (result.error) {
        setError(result.error);
        logger.error('[useCompanyReservations] Erreur chargement', { error: result.error });
        toast.error('Erreur lors du chargement des réservations');
        return { success: false, error: result.error };
      }

      setReservations(result.data);
      setTotal(result.total);
      setPageState(result.page);
      setTotalPages(result.totalPages);

      if (newFilters) {
        setFiltersState(newFilters);
      }

      return { success: true };
    },
    [filters, page, pageSize]
  );

  // ============================================
  // LOAD STATS
  // ============================================
  const loadStats = useCallback(
    async (
      statFilters?: { showId?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await getCompanyReservationStats(statFilters || {});

      if (result.error || !result.data) {
        logger.error('[useCompanyReservations] Erreur chargement stats', {
          error: result.error,
        });
        return { success: false, error: result.error || 'Erreur lors du chargement' };
      }

      setStats(result.data);
      return { success: true };
    },
    []
  );

  // ============================================
  // LOAD SHOWS
  // ============================================
  const loadShows = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const result = await getCompanyShows();

    if (result.error) {
      logger.error('[useCompanyReservations] Erreur chargement spectacles', {
        error: result.error,
      });
      return { success: false, error: result.error };
    }

    setShows(result.data);
    return { success: true };
  }, []);

  // ============================================
  // EXPORT AVEC OPTIONS
  // ============================================
  const exportWithOptions = useCallback(
    async (options: CompanyExportOptions): Promise<{ success: boolean; error?: string }> => {
      const { format, columns, period } = options;

      if (columns.length === 0) {
        toast.error('Veuillez sélectionner au moins une colonne');
        return { success: false, error: 'Aucune colonne sélectionnée' };
      }

      toast.info("Préparation de l'export...");

      // Combiner les filtres avec la période choisie
      const exportFilters: CompanyReservationFilters = {
        ...filters,
        period: period === 'all' ? undefined : period,
      };

      const result = await getAllCompanyReservationsForExport(exportFilters);

      if (result.error) {
        logger.error('[useCompanyReservations] Erreur export', { error: result.error });
        toast.error("Erreur lors de l'export");
        return { success: false, error: result.error };
      }

      if (result.data.length === 0) {
        toast.warning('Aucune réservation à exporter');
        return { success: false, error: 'Aucune donnée' };
      }

      // Générer le nom du fichier
      const showTitle =
        filters.showId && result.data.length > 0
          ? result.data[0]?.slot?.show?.title
          : undefined;
      const filename = generateCompanyExportFilename(exportFilters, format, period, showTitle);

      try {
        if (format === 'xlsx') {
          const excelData = reservationsToExcel(result.data, columns);
          downloadExcel(excelData, filename);
        } else {
          const csv = reservationsToCSV(result.data, columns);
          downloadCSV(csv, filename);
        }

        toast.success(
          `${result.data.length} réservation${result.data.length > 1 ? 's' : ''} exportée${result.data.length > 1 ? 's' : ''} (${format.toUpperCase()})`
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('[useCompanyReservations] Erreur génération fichier', { message });
        toast.error('Erreur lors de la génération du fichier');
        return { success: false, error: message };
      }
    },
    [filters]
  );

  // ============================================
  // PAGINATION & FILTERS
  // ============================================
  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      void loadReservations(filters, { page: newPage, pageSize });
    },
    [filters, pageSize, loadReservations]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      setPageState(1);
      void loadReservations(filters, { page: 1, pageSize: newPageSize });
    },
    [filters, loadReservations]
  );

  const setFilters = useCallback(
    (newFilters: CompanyReservationFilters) => {
      setFiltersState(newFilters);
      setPageState(1);
      void loadReservations(newFilters, { page: 1, pageSize });
    },
    [pageSize, loadReservations]
  );

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setPageState(1);
    void loadReservations({}, { page: 1, pageSize });
  }, [pageSize, loadReservations]);

  return {
    reservations,
    total,
    page,
    totalPages,
    pageSize,
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
    setFilters,
    resetFilters,
  };
}
