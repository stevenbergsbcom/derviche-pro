/**
 * Composant ReservationsContent pour la page des réservations compagnie
 * Affiche : états loading/error/empty + vue groupée par représentation
 * Derviche Diffusion - Session S198 (vue groupée)
 */

'use client';

import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import { type SortOption } from '@/components/company/reservations';
import { SlotGroup } from '@/components/company/reservations/slot-group';
import { groupReservationsBySlot } from '@/components/company/reservations/grouping-helpers';
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
  // Groupement par représentation (slot) — côté client, zéro impact service.
  // Ordre chronologique préservé car le service trie déjà par slot_date_asc.
  const groups = useMemo(() => groupReservationsBySlot(reservations), [reservations]);

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
    <div className="space-y-4">
      {groups.map((group) => (
        <SlotGroup
          key={group.key}
          slot={group.slot}
          reservations={group.items}
          columns={columns}
          currentSort={currentSort}
          onSortChange={onSortChange}
        />
      ))}
    </div>
  );
}

ReservationsContentComponent.displayName = 'ReservationsContent';

export const ReservationsContent = memo(ReservationsContentComponent);
