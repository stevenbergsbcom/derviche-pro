/**
 * Composant ReservationsContent pour la page des réservations admin
 * Affiche : états loading/error/empty + table desktop + cards mobile
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import {
  type SortOption,
  COLUMN_HEADERS,
  SortableHeader,
  RowHoverActions,
  ReservationCard,
  renderTableCell,
} from '@/components/admin/reservations';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import type { AdminReservation } from '@/lib/services/admin-reservations';

// ============================================
// TYPES
// ============================================

export interface ReservationsContentProps {
  /** Liste des réservations */
  reservations: AdminReservation[];
  /** Colonnes visibles */
  columns: ReservationColumn[];
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
  onSortChange: (sortBy: SortOption | string | undefined) => void;
  onEdit: (reservation: AdminReservation) => void;
  onCheckin: (reservation: AdminReservation) => void;
  onCancel: (reservation: AdminReservation) => void;
}

// ============================================
// COMPOSANTS INTERNES
// ============================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-derviche" />
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
      <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
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
      <Users className="w-12 h-12 text-muted-foreground mb-4" />
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

export function ReservationsContent({
  reservations,
  columns,
  currentSort,
  isLoading,
  error,
  activeFiltersCount,
  onRetry,
  onResetFilters,
  onSortChange,
  onEdit,
  onCheckin,
  onCancel,
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
            visibleColumns={columns}
            onCheckin={onCheckin}
            onEdit={onEdit}
            onCancel={onCancel}
          />
        ))}
      </div>

      {/* Vue Tableau (desktop) */}
      <div className="hidden lg:block w-full overflow-hidden">
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-muted/80 border-b-2 border-border sticky top-0 z-10 shadow-sm">
                  <tr className="border-b transition-colors">
                    <th className="h-10 px-2 w-10"></th>
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
                      role="button"
                      tabIndex={0}
                      className={`border-b transition-colors cursor-pointer hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-derviche/50 ${
                        r.status === 'cancelled' ? 'opacity-60' : ''
                      } ${index % 2 === 1 ? 'bg-muted/50' : ''}`}
                      onClick={() => onEdit(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onEdit(r);
                        }
                      }}
                    >
                      <td className="p-2 align-middle">
                        <RowHoverActions
                          reservation={r}
                          onEdit={() => onEdit(r)}
                          onCheckin={() => onCheckin(r)}
                          onCancel={() => onCancel(r)}
                        />
                      </td>
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
