/**
 * Hook useAdminReservations - Gestion des réservations côté admin
 * Derviche Diffusion
 *
 * Fonctionnalités :
 * - Liste paginée avec filtres
 * - Modification complète
 * - Check-in
 * - Annulation
 * - Export CSV et Excel
 * - Statistiques
 *
 * @module hooks/useAdminReservations
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getAdminReservations,
  getAdminReservationById,
  updateReservationCheckin,
  updateReservation,
  cancelReservation,
  getReservationStats,
  getReservationsBySlot,
  getAllReservationsForExport,
  getAvailableSlotsForShow,
  createAdminReservation,
  type AdminReservation,
  type AdminReservationFilters,
  type PaginationOptions,
  type CheckinUpdateData,
  type UpdateReservationData,
  type ReservationStats,
  type CreateAdminReservationData,
} from '@/lib/services/admin-reservations';
import { logger } from '@/lib/logger';
import { generateExportFilename, type ExportOptions } from '@/components/admin/export-dialog';

// Imports depuis le module refactorisé
import type { UseAdminReservationsReturn } from './admin-reservations/types';
import {
  LEGACY_EXPORT_COLUMNS,
  CHECKIN_STATUS_LABELS,
  DEFAULT_PAGE_SIZE,
} from './admin-reservations/constants';
import {
  reservationsToCSV,
  reservationsToExcel,
  downloadCSV,
  downloadExcel,
} from './admin-reservations/helpers';

// Re-export pour compatibilité
export type { UseAdminReservationsReturn } from './admin-reservations/types';
export { EXPORT_COLUMN_LABELS, LEGACY_EXPORT_COLUMNS } from './admin-reservations/constants';

/**
 * Hook de gestion des réservations pour l'administration
 * @param initialPageSize - Nombre d'éléments par page (défaut: 20)
 */
export function useAdminReservations(
  initialPageSize: number = DEFAULT_PAGE_SIZE
): UseAdminReservationsReturn {
  // État
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [filters, setFiltersState] = useState<AdminReservationFilters>({});
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Ref pour éviter les race conditions
  const loadingRef = useRef<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // CHARGEMENT
  // ─────────────────────────────────────────────────────────────

  const loadReservations = useCallback(
    async (
      newFilters?: AdminReservationFilters,
      pagination?: PaginationOptions
    ): Promise<{ success: boolean; error?: string }> => {
      const requestId = Date.now().toString();
      loadingRef.current = requestId;

      const activeFilters = newFilters ?? filters;
      const activePagination = pagination ?? { page, pageSize };

      setIsLoading(true);
      setError(null);

      const result = await getAdminReservations(activeFilters, activePagination);

      // Vérifier que la requête est toujours d'actualité
      if (loadingRef.current !== requestId) {
        return { success: false, error: 'Requête annulée' };
      }

      setIsLoading(false);
      loadingRef.current = null;

      if (result.error) {
        setError(result.error);
        logger.error('useAdminReservations - Erreur chargement', { error: result.error });
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

  const loadReservation = useCallback(
    async (id: string): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await getAdminReservationById(id);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur chargement réservation', { id, error: result.error });
        return { success: false, error: result.error || 'Réservation non trouvée' };
      }

      return { success: true, data: result.data };
    },
    []
  );

  const loadBySlot = useCallback(
    async (slotId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      setError(null);

      const result = await getReservationsBySlot(slotId);

      setIsLoading(false);

      if (result.error) {
        setError(result.error);
        toast.error('Erreur lors du chargement des réservations');
        return { success: false, error: result.error };
      }

      setReservations(result.data);
      setTotal(result.data.length);
      setTotalPages(1);

      return { success: true };
    },
    []
  );

  const loadStats = useCallback(
    async (statFilters?: { showId?: string; slotId?: string }): Promise<{ success: boolean; error?: string }> => {
      const result = await getReservationStats(statFilters || {});

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur chargement stats', { error: result.error });
        return { success: false, error: result.error || 'Erreur lors du chargement' };
      }

      setStats(result.data);
      return { success: true };
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────

  const checkin = useCallback(
    async (
      id: string,
      data: CheckinUpdateData
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await updateReservationCheckin(id, data);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur checkin', { id, error: result.error });
        toast.error('Erreur lors de la mise à jour du check-in');
        return { success: false, error: result.error || 'Erreur de mise à jour' };
      }

      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));

      const statusLabel = CHECKIN_STATUS_LABELS[data.checkinStatus] || data.checkinStatus;
      toast.success(`Check-in : ${statusLabel}`);

      return { success: true, data: result.data };
    },
    []
  );

  const update = useCallback(
    async (
      id: string,
      data: UpdateReservationData
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await updateReservation(id, data);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur modification', { id, error: result.error });
        toast.error(result.error || 'Erreur lors de la modification');
        return { success: false, error: result.error || 'Erreur de modification' };
      }

      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
      toast.success('Réservation modifiée avec succès');

      return { success: true, data: result.data };
    },
    []
  );

  const cancel = useCallback(
    async (
      id: string,
      reason?: string
    ): Promise<{ success: boolean; data?: AdminReservation; error?: string }> => {
      const result = await cancelReservation(id, reason);

      if (result.error || !result.data) {
        logger.error('useAdminReservations - Erreur annulation', { id, error: result.error });
        toast.error("Erreur lors de l'annulation");
        return { success: false, error: result.error || "Erreur d'annulation" };
      }

      setReservations((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
      toast.success('Réservation annulée');

      // Note: l'email et la synchronisation Calendar sont gérés par l'appelant
      // (page.tsx handleCancel) avec les options choisies par l'utilisateur (switches).
      // Ne pas déclencher d'email ici pour éviter un double envoi.

      return { success: true, data: result.data };
    },
    []
  );

  const create = useCallback(
    async (
      data: CreateAdminReservationData
    ): Promise<{ success: boolean; reservationId?: string; error?: string }> => {
      const result = await createAdminReservation(data);

      if (!result.success) {
        logger.error('useAdminReservations - Erreur création', { error: result.error });
        toast.error(result.error || 'Erreur lors de la création');
        return { success: false, error: result.error };
      }

      toast.success('Réservation créée avec succès');

      // Recharger les données
      void loadReservations(filters, { page, pageSize });
      void loadStats();

      return { success: true, reservationId: result.reservationId };
    },
    [filters, page, pageSize, loadReservations, loadStats]
  );

  // ─────────────────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────────────────

  const exportWithOptions = useCallback(
    async (options: ExportOptions): Promise<{ success: boolean; error?: string }> => {
      const { format, columns, period } = options;

      if (columns.length === 0) {
        toast.error('Veuillez sélectionner au moins une colonne');
        return { success: false, error: 'Aucune colonne sélectionnée' };
      }

      toast.info("Préparation de l'export...");

      const exportFilters: AdminReservationFilters = {
        ...filters,
        period: period === 'all' ? undefined : period,
      };

      const result = await getAllReservationsForExport(exportFilters);

      if (result.error) {
        logger.error('useAdminReservations - Erreur export', { error: result.error });
        toast.error("Erreur lors de l'export");
        return { success: false, error: result.error };
      }

      if (result.data.length === 0) {
        toast.warning('Aucune réservation à exporter');
        return { success: false, error: 'Aucune donnée' };
      }

      const showTitle =
        filters.showId && result.data.length > 0
          ? result.data[0]?.slot?.show?.title
          : undefined;
      const filename = generateExportFilename(exportFilters, format, period, showTitle);

      try {
        if (format === 'xlsx') {
          const excelData = reservationsToExcel(result.data, columns);
          downloadExcel(excelData, filename);
        } else {
          const csv = reservationsToCSV(result.data, columns);
          downloadCSV(csv, filename);
        }

        const count = result.data.length;
        toast.success(
          `${count} réservation${count > 1 ? 's' : ''} exportée${count > 1 ? 's' : ''} (${format.toUpperCase()})`
        );
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useAdminReservations - Erreur génération fichier', { message });
        toast.error('Erreur lors de la génération du fichier');
        return { success: false, error: message };
      }
    },
    [filters]
  );

  /** @deprecated Utiliser exportWithOptions */
  const exportToCSV = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return exportWithOptions({ format: 'csv', columns: LEGACY_EXPORT_COLUMNS, period: 'all' });
  }, [exportWithOptions]);

  // ─────────────────────────────────────────────────────────────
  // SLOTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Met à jour un champ d'une réservation dans la liste en mémoire
   * sans déclencher de rechargement ni changer l'ordre du tableau.
   */
  const patchReservation = useCallback(
    (id: string, patch: Partial<AdminReservation>) => {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const getSlots = useCallback(async (showId: string) => {
    const result = await getAvailableSlotsForShow(showId);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // PAGINATION & FILTRES
  // ─────────────────────────────────────────────────────────────

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
    (newFilters: AdminReservationFilters) => {
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

  // ─────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────

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
    loadReservations,
    loadReservation,
    loadBySlot,
    loadStats,
    checkin,
    update,
    cancel,
    create,
    exportToCSV,
    exportWithOptions,
    getSlots,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    patchReservation,
  };
}
