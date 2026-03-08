/**
 * Composant ReservationsContent pour la page des réservations compagnie
 * Affiche : états loading/error/empty + table desktop + cards mobile
 * Structure identique à admin/reservations
 * Derviche Diffusion - Session 119
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Users, Calendar, MapPin, User } from 'lucide-react';
import {
  type SortOption,
  COLUMN_HEADERS,
  SortableHeader,
  renderTableCell,
} from '@/components/company/reservations';
import type { CompanyReservationColumn } from '@/hooks/useUserPreferences';
import type { CompanyReservation } from '@/lib/services/company-reservations';

// ============================================
// TYPES
// ============================================

export interface ReservationsContentProps {
  /** Liste des réservations */
  reservations: CompanyReservation[];
  /** Colonnes visibles */
  columns: CompanyReservationColumn[];
  /** Tri actuel */
  currentSort: SortOption | undefined;
  /** Indique si les données sont en chargement */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Nombre de filtres actifs */
  activeFiltersCount: number;
  
  // Handlers
  onRetry: () => void;
  onResetFilters: () => void;
  onSortChange: (sortBy: SortOption | undefined) => void;
}

// ============================================
// CONSTANTES
// ============================================

/** Configuration des badges de statut */
const STATUS_BADGE_CONFIG = {
  confirmed: { label: 'Confirmée', variant: 'default' as const },
  cancelled: { label: 'Annulée', variant: 'destructive' as const },
  no_show: { label: 'No-show', variant: 'secondary' as const },
} as const;

/** Configuration des badges de check-in */
const CHECKIN_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  present_loved: { label: 'A aimé', className: 'bg-green-100 text-green-800' },
  present_press: { label: 'Presse', className: 'bg-blue-100 text-blue-800' },
  present_neutral: { label: 'Neutre', className: 'bg-gray-100 text-gray-800' },
  absent: { label: 'Absent', className: 'bg-red-100 text-red-800' },
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Formate une date ISO en format court français
 */
function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ============================================
// COMPOSANTS INTERNES : ÉTATS
// ============================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-derviche" aria-hidden="true" />
      <span className="sr-only">Chargement des réservations...</span>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <AlertTriangle className="w-12 h-12 text-destructive mb-4" aria-hidden="true" />
      <p className="text-destructive mb-4">{error}</p>
      <Button variant="outline" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}

interface EmptyStateProps {
  activeFiltersCount: number;
  onResetFilters: () => void;
}

function EmptyState({ activeFiltersCount, onResetFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <Users className="w-12 h-12 text-muted-foreground mb-4" aria-hidden="true" />
      <p className="text-muted-foreground">Aucune réservation trouvée</p>
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={onResetFilters} className="mt-4">
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT : CARTE MOBILE
// ============================================

interface ReservationCardProps {
  reservation: CompanyReservation;
}

function ReservationCard({ reservation }: ReservationCardProps) {
  const status = STATUS_BADGE_CONFIG[reservation.status] || { 
    label: reservation.status, 
    variant: 'secondary' as const 
  };
  const checkin = reservation.checkinStatus 
    ? CHECKIN_BADGE_CONFIG[reservation.checkinStatus] 
    : null;

  return (
    <Card className={`${reservation.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Ligne 1: Nom + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="font-medium">
              {reservation.firstName} {reservation.lastName}
            </span>
          </div>
          <div className="flex gap-1 shrink-0">
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
            {checkin && (
              <Badge className={`text-xs ${checkin.className}`}>
                {checkin.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Ligne 2: Spectacle */}
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">{reservation.slot?.show?.title || '-'}</strong>
        </div>

        {/* Ligne 3: Date + Lieu */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {formatShortDate(reservation.slot?.date)}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {reservation.slot?.venue?.name || '-'}
          </div>
        </div>

        {/* Ligne 4: Infos contact */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          {reservation.organization && (
            <p>{reservation.organization}</p>
          )}
          <p>{reservation.email}</p>
          <p>{reservation.numPlaces} place{reservation.numPlaces > 1 ? 's' : ''}</p>
        </div>

        {/* Ligne 5: Demandes + notes (si renseignées) */}
        {(reservation.specialRequests || reservation.checkinNotes || reservation.checkinVenueNotes || reservation.cancellationReason) && (
          <div className="text-xs text-muted-foreground space-y-0.5 border-t border-border pt-2">
            {reservation.specialRequests && (
              <p><span className="font-medium text-foreground">Demandes :</span> {reservation.specialRequests}</p>
            )}
            {reservation.checkinNotes && (
              <p><span className="font-medium text-foreground">Note check-in :</span> {reservation.checkinNotes}</p>
            )}
            {reservation.checkinVenueNotes && (
              <p><span className="font-medium text-foreground">Note lieu :</span> {reservation.checkinVenueNotes}</p>
            )}
            {reservation.cancellationReason && (
              <p><span className="font-medium text-foreground">Motif annulation :</span> {reservation.cancellationReason}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

function ReservationsContentComponent({
  reservations,
  columns,
  currentSort,
  isLoading,
  error,
  activeFiltersCount,
  onRetry,
  onResetFilters,
  onSortChange,
}: ReservationsContentProps) {
  // États spéciaux
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (reservations.length === 0) {
    return (
      <EmptyState 
        activeFiltersCount={activeFiltersCount} 
        onResetFilters={onResetFilters} 
      />
    );
  }

  return (
    <>
      {/* Vue Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {reservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
          />
        ))}
      </div>

      {/* Vue Tableau (desktop) */}
      <div className="hidden lg:block w-full overflow-hidden">
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <table 
                className="w-full caption-bottom text-sm"
                aria-label="Tableau des réservations"
              >
                <thead className="[&_tr]:border-b bg-muted/80 border-b-2 border-border sticky top-0 z-10 shadow-sm">
                  <tr className="border-b transition-colors">
                    {columns.map((col) => (
                      <SortableHeader
                        key={col}
                        column={col}
                        label={COLUMN_HEADERS[col]}
                        currentSort={currentSort}
                        onSort={onSortChange}
                        className={col === 'numPlaces' ? 'text-center' : ''}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {reservations.map((r, index) => (
                    <tr
                      key={r.id}
                      className={`border-b transition-colors hover:bg-muted/70 ${
                        r.status === 'cancelled' ? 'opacity-60' : ''
                      } ${index % 2 === 1 ? 'bg-muted/50' : ''}`}
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="p-2 align-middle whitespace-nowrap"
                        >
                          {renderTableCell(col, r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

ReservationsContentComponent.displayName = 'ReservationsContent';

export const ReservationsContent = memo(ReservationsContentComponent);
