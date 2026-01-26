/**
 * ReservationsContent - Logique d'affichage du contenu principal
 * Gère les états : chargement, erreur, vide, liste
 * Derviche Diffusion
 */

'use client';

import type { CheckinReservation } from '@/lib/services/checkin';
import {
  ReservationRow,
  ReservationRowSkeleton,
  EmptyReservations,
} from '@/components/accueil';
import { ErrorState } from './ErrorState';

interface ReservationsContentProps {
  isLoading: boolean;
  error: string | null;
  reservations: CheckinReservation[];
  filteredReservations: CheckinReservation[];
  searchQuery: string;
  onReservationClick: (reservation: CheckinReservation) => void;
  onRetry: () => void;
}

export function ReservationsContent({
  isLoading,
  error,
  reservations,
  filteredReservations,
  searchQuery,
  onReservationClick,
  onRetry,
}: ReservationsContentProps) {
  // État de chargement
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <ReservationRowSkeleton />
        <ReservationRowSkeleton />
        <ReservationRowSkeleton />
        <ReservationRowSkeleton />
        <ReservationRowSkeleton />
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  // Liste vide
  if (reservations.length === 0) {
    return (
      <EmptyReservations message="Aucune réservation pour cette représentation" />
    );
  }

  // Aucun résultat de recherche
  if (filteredReservations.length === 0) {
    return <EmptyReservations message={`Aucun résultat pour "${searchQuery}"`} />;
  }

  // Liste des réservations
  return (
    <div className="p-4 space-y-3" role="list" aria-label="Liste des réservations">
      {filteredReservations.map((reservation) => (
        <ReservationRow
          key={reservation.id}
          reservation={{
            id: reservation.id,
            guestFirstName: reservation.guestFirstName,
            guestLastName: reservation.guestLastName,
            guestStructure: reservation.guestStructure,
            guestEmail: reservation.guestEmail,
            numPlaces: reservation.numPlaces,
            checkinStatus: reservation.checkinStatus,
            status: reservation.status,
          }}
          onClick={() => onReservationClick(reservation)}
        />
      ))}
    </div>
  );
}
