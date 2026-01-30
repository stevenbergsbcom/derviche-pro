/**
 * Composant ReservationsTable - Tableau réservations compagnie
 * Derviche Diffusion - Session 117
 * 
 * Affiche le tableau avec:
 * - Header triable
 * - États loading / empty
 * - Rendu des cellules via helper
 */

'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar } from 'lucide-react';
import {
  COLUMN_HEADERS,
  CompanySortableHeader,
  renderCompanyTableCell,
} from '@/components/company/reservations';
import type { ReservationsTableProps } from '../types';

function ReservationsTableComponent({
  reservations,
  visibleColumns,
  isLoading,
  activeFiltersCount,
  currentSort,
  onSortChange,
  onResetFilters,
}: ReservationsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label="Tableau des réservations">
        {/* Header */}
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            {visibleColumns.map((col) => (
              <CompanySortableHeader
                key={col}
                column={col}
                label={COLUMN_HEADERS[col]}
                currentSort={currentSort}
                onSort={onSortChange}
                className="text-xs"
              />
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y">
          {/* État loading */}
          {isLoading && (
            <tr>
              <td colSpan={visibleColumns.length} className="text-center py-12">
                <Loader2
                  aria-hidden="true"
                  className="w-6 h-6 animate-spin mx-auto text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
              </td>
            </tr>
          )}

          {/* État vide */}
          {!isLoading && reservations.length === 0 && (
            <tr>
              <td colSpan={visibleColumns.length} className="text-center py-12">
                <Calendar
                  aria-hidden="true"
                  className="w-12 h-12 mx-auto text-muted-foreground/30"
                />
                <p className="text-muted-foreground mt-2">
                  Aucune réservation trouvée
                </p>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={onResetFilters}
                    className="mt-2"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </td>
            </tr>
          )}

          {/* Données */}
          {!isLoading &&
            reservations.map((reservation) => (
              <tr
                key={reservation.id}
                className="hover:bg-muted/30 transition-colors"
              >
                {visibleColumns.map((col) => (
                  <td key={col} className="px-2 py-3 text-sm">
                    {renderCompanyTableCell(col, reservation)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

ReservationsTableComponent.displayName = 'ReservationsTable';

export const ReservationsTable = memo(ReservationsTableComponent);
