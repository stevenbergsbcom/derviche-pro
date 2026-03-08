/**
 * ReservationsContent - Logique d'affichage du contenu principal
 * Gère les états : chargement, erreur, vide, liste
 * Réservations annulées masquées par défaut, révélées via bouton toggle.
 * Derviche Diffusion
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckinReservation } from '@/lib/services/checkin';
import {
  ReservationRow,
  ReservationRowSkeleton,
  EmptyReservations,
} from '@/components/accueil';
import { ErrorState } from '@/components/pwa';

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
  const [showCancelled, setShowCancelled] = useState(false);

  // Ouvre automatiquement les annulées si la recherche n'en retourne qu'elles
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowCancelled(false);
      return;
    }
    const active = filteredReservations.filter((r) => r.status !== 'cancelled');
    const cancelled = filteredReservations.filter((r) => r.status === 'cancelled');
    if (active.length === 0 && cancelled.length > 0) {
      setShowCancelled(true);
    }
  }, [searchQuery, filteredReservations]);

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

  // Séparer actives et annulées
  const activeReservations = filteredReservations.filter(
    (r) => r.status !== 'cancelled'
  );
  const cancelledReservations = filteredReservations.filter(
    (r) => r.status === 'cancelled'
  );

  const renderRow = (reservation: CheckinReservation) => (
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
  );

  return (
    <div className="p-4 space-y-3" role="list" aria-label="Liste des réservations">

      {/* Réservations actives */}
      {activeReservations.length === 0 && cancelledReservations.length > 0 && (
        <EmptyReservations message="Aucune réservation active pour cette représentation" />
      )}
      {activeReservations.map(renderRow)}

      {/* Bouton toggle annulées */}
      {cancelledReservations.length > 0 && (
        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCancelled((v) => !v)}
            aria-expanded={showCancelled}
            className="w-full h-12 text-base text-muted-foreground gap-2"
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                showCancelled && 'rotate-180'
              )}
              aria-hidden="true"
            />
            {showCancelled
              ? 'Masquer les annulations'
              : `Voir les annulations (${cancelledReservations.length})`}
          </Button>

          {showCancelled && (
            <div className="mt-3 space-y-3" role="group" aria-label="Réservations annulées">
              {cancelledReservations.map(renderRow)}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
