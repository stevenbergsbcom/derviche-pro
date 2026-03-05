/**
 * Page Réservations d'une représentation - Check-in Mobile
 * Derviche Diffusion
 *
 * Affiche les réservations d'une représentation avec recherche
 * Interface mobile-first optimisée pour l'accueil sur place
 *
 * Refactorisé Session 84 : hook + components + types
 */

'use client';

import { useParams } from 'next/navigation';
import {
  CheckinDrawer,
  TransferSlotDrawer,
} from '@/components/accueil';
import { useSlotDetails } from './hooks/useSlotDetails';
import { LoadingOverlay } from '@/components/pwa';
import {
  SlotHeader,
  SearchBar,
  ActionBar,
  ReservationsContent,
} from './components';

export default function SlotReservationsPage() {
  const params = useParams();
  const showSlug = params.showSlug as string;
  const slotId = params.slotId as string;

  const {
    // Données
    slotInfo,
    reservations,
    filteredReservations,

    // États
    isLoading,
    error,
    searchQuery,

    // Compteurs
    confirmedCount,
    presentCount,

    // Drawer check-in
    drawerOpen,
    selectedReservation,
    setDrawerOpen,

    // Drawer transfert
    transferDrawerOpen,
    setTransferDrawerOpen,

    // Handlers
    setSearchQuery,
    handleRefresh,
    handleReservationClick,
    handleCheckinSuccess,
    handleTransferClick,
    handleTransferSuccess,
  } = useSlotDetails({ slotId, showSlug });

  return (
    <div className="flex flex-col min-h-full">
      {/* En-tête */}
      <SlotHeader
        slotInfo={slotInfo}
        confirmedCount={confirmedCount}
        presentCount={presentCount}
        isLoading={isLoading && !slotInfo}
      />

      {/* Barre de recherche */}
      {!isLoading && !error && reservations.length > 0 && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultsCount={filteredReservations.length}
          totalCount={reservations.length}
        />
      )}

      {/* Contenu principal */}
      <div className="flex-1">
        <ReservationsContent
          isLoading={isLoading}
          error={error}
          reservations={reservations}
          filteredReservations={filteredReservations}
          searchQuery={searchQuery}
          onReservationClick={handleReservationClick}
          onRetry={handleRefresh}
        />
      </div>

      {/* Barre d'action en bas */}
      {!isLoading && !error && (
        <ActionBar onRefresh={handleRefresh} />
      )}

      {/* Overlay de chargement (refresh) */}
      <LoadingOverlay visible={isLoading && reservations.length > 0} />

      {/* Drawer de check-in */}
      <CheckinDrawer
        reservation={selectedReservation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={handleCheckinSuccess}
        onTransferClick={handleTransferClick}
      />

      {/* Drawer de transfert */}
      <TransferSlotDrawer
        reservation={selectedReservation}
        currentSlotId={slotId}
        open={transferDrawerOpen}
        onOpenChange={setTransferDrawerOpen}
        onSuccess={handleTransferSuccess}
      />

    </div>
  );
}
