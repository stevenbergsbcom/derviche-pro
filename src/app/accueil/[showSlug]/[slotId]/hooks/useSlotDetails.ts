/**
 * Hook useSlotDetails - Orchestrateur pour la page Slot Details
 * Derviche Diffusion
 *
 * Compose use-slot-queries (data fetching) et use-slot-actions (mutations/drawers)
 * Refactorisé : extraction sub-hooks
 */

'use client';

import { useSlotQueries } from './use-slot-queries';
import { useSlotActions } from './use-slot-actions';
import type { UseSlotDetailsProps, UseSlotDetailsReturn } from '../types';

export function useSlotDetails({
  slotId,
  showSlug,
}: UseSlotDetailsProps): UseSlotDetailsReturn {
  const queries = useSlotQueries({ slotId, showSlug });

  const actions = useSlotActions({
    reservations: queries.reservations,
    setReservations: queries.setReservations,
    isLoading: queries.isLoading,
    isMountedRef: queries.isMountedRef,
  });

  return {
    // Data
    slotInfo: queries.slotInfo,
    reservations: queries.reservations,
    filteredReservations: queries.filteredReservations,

    // States
    isLoading: queries.isLoading,
    error: queries.error,
    searchQuery: queries.searchQuery,

    // Computed
    confirmedCount: queries.confirmedCount,
    presentCount: queries.presentCount,

    // Drawer check-in
    drawerOpen: actions.drawerOpen,
    selectedReservation: actions.selectedReservation,
    setDrawerOpen: actions.setDrawerOpen,

    // Drawer transfert
    transferDrawerOpen: actions.transferDrawerOpen,
    setTransferDrawerOpen: actions.setTransferDrawerOpen,

    // Handlers
    setSearchQuery: queries.setSearchQuery,
    handleRefresh: queries.handleRefresh,
    handleReservationClick: actions.handleReservationClick,
    handleCheckinSuccess: actions.handleCheckinSuccess,
    handleTransferClick: actions.handleTransferClick,
    handleTransferSuccess: actions.handleTransferSuccess,
  };
}
