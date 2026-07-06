/**
 * Hook de requetes pour les reservations admin
 * Gestion du chargement, pagination, filtres et statistiques
 *
 * @module hooks/admin-reservations/use-reservation-queries
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getAdminReservations,
  getAdminReservationById,
  getReservationStats,
  getReservationsBySlot,
  getAvailableSlotsForShow,
  type AdminReservation,
  type AdminReservationFilters,
  type PaginationOptions,
  type ReservationStats,
} from '@/lib/services/admin-reservations';
import { logger } from '@/lib/logger';
import { DEFAULT_PAGE_SIZE } from './constants';

/**
 * Hook de chargement des donnees reservations
 */
export function useReservationQueries(initialPageSize: number = DEFAULT_PAGE_SIZE) {
  // Etat
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [filters, setFiltersState] = useState<AdminReservationFilters>({});
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Ref pour eviter les race conditions
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

      // Verifier que la requete est toujours d'actualite
      if (loadingRef.current !== requestId) {
        return { success: false, error: 'Requete annulee' };
      }

      setIsLoading(false);
      loadingRef.current = null;

      if (result.error) {
        setError(result.error);
        logger.error('useAdminReservations - Erreur chargement', { error: result.error });
        toast.error('Erreur lors du chargement des reservations');
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
        logger.error('useAdminReservations - Erreur chargement reservation', {
          id,
          error: result.error,
        });
        return { success: false, error: result.error || 'Reservation non trouvee' };
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
        toast.error('Erreur lors du chargement des reservations');
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
    async (
      statFilters?: { showId?: string; slotId?: string; venueId?: string }
    ): Promise<{ success: boolean; error?: string }> => {
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
  // SLOTS
  // ─────────────────────────────────────────────────────────────

  const getSlots = useCallback(
    async (showId: string, options?: { includePast?: boolean }) => {
      const result = await getAvailableSlotsForShow(showId, options);
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true, data: result.data };
    },
    [],
  );

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

  /**
   * Met a jour un champ d'une reservation dans la liste en memoire
   * sans declencher de rechargement ni changer l'ordre du tableau.
   */
  const patchReservation = useCallback(
    (id: string, patch: Partial<AdminReservation>) => {
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    []
  );

  return {
    // State
    reservations,
    total,
    page,
    totalPages,
    pageSize,
    isLoading,
    error,
    stats,
    filters,
    // Setters (for actions hook)
    setReservations,
    // Queries
    loadReservations,
    loadReservation,
    loadBySlot,
    loadStats,
    getSlots,
    // Pagination & filters
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    patchReservation,
  };
}
