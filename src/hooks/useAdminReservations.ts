/**
 * Hook useAdminReservations - Shim de composition
 *
 * Compose useReservationQueries + useReservationActions
 * pour maintenir la compatibilite avec les consommateurs existants.
 *
 * @module hooks/useAdminReservations
 */

'use client';

import type { UseAdminReservationsReturn } from './admin-reservations/types';
import { DEFAULT_PAGE_SIZE } from './admin-reservations/constants';
import { useReservationQueries } from './admin-reservations/use-reservation-queries';
import { useReservationActions } from './admin-reservations/use-reservation-actions';

// Re-export pour compatibilite
export type { UseAdminReservationsReturn } from './admin-reservations/types';
export { EXPORT_COLUMN_LABELS, LEGACY_EXPORT_COLUMNS } from './admin-reservations/constants';

/**
 * Hook de gestion des reservations pour l'administration
 * @param initialPageSize - Nombre d'elements par page (defaut: 20)
 */
export function useAdminReservations(
  initialPageSize: number = DEFAULT_PAGE_SIZE
): UseAdminReservationsReturn {
  const queries = useReservationQueries(initialPageSize);

  const actions = useReservationActions({
    filters: queries.filters,
    page: queries.page,
    pageSize: queries.pageSize,
    setReservations: queries.setReservations,
    loadReservations: queries.loadReservations,
    loadStats: queries.loadStats,
  });

  return {
    // State
    reservations: queries.reservations,
    total: queries.total,
    page: queries.page,
    totalPages: queries.totalPages,
    pageSize: queries.pageSize,
    isLoading: queries.isLoading,
    error: queries.error,
    stats: queries.stats,
    filters: queries.filters,
    // Queries
    loadReservations: queries.loadReservations,
    loadReservation: queries.loadReservation,
    loadBySlot: queries.loadBySlot,
    loadStats: queries.loadStats,
    getSlots: queries.getSlots,
    // Pagination & filters
    setPage: queries.setPage,
    setPageSize: queries.setPageSize,
    setFilters: queries.setFilters,
    resetFilters: queries.resetFilters,
    patchReservation: queries.patchReservation,
    // Actions
    checkin: actions.checkin,
    update: actions.update,
    cancel: actions.cancel,
    create: actions.create,
    exportToCSV: actions.exportToCSV,
    exportWithOptions: actions.exportWithOptions,
  };
}
