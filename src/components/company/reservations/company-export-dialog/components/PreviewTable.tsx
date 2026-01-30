/**
 * Tableau d'aperçu des données à exporter
 * Affiche les premières lignes avec les colonnes sélectionnées
 */

import { memo } from 'react';
import { Eye } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { COMPANY_COLUMNS_CONFIG } from '@/hooks/useCompanyReservations';
import type { PreviewTableProps } from '../types';
import { getCellValue } from '../utils';
import { PREVIEW_MAX_COLUMNS } from '../constants';

// ============================================
// COMPOSANT
// ============================================

export const PreviewTable = memo(function PreviewTable({ reservations, columns }: PreviewTableProps) {
  // Ne rien afficher si pas de données ou pas de colonnes
  if (reservations.length === 0 || columns.length === 0) {
    return null;
  }

  // Limiter les colonnes affichées dans l'aperçu
  const visibleColumns = columns.slice(0, PREVIEW_MAX_COLUMNS);
  const hasMoreColumns = columns.length > PREVIEW_MAX_COLUMNS;
  const extraColumnsCount = columns.length - PREVIEW_MAX_COLUMNS;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Eye className="w-4 h-4" aria-hidden="true" />
        Aperçu (5 premières lignes de la page actuelle)
      </Label>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          {/* En-tête */}
          <thead className="bg-muted/80">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1.5 text-left font-medium whitespace-nowrap"
                >
                  {COMPANY_COLUMNS_CONFIG[col].label}
                </th>
              ))}
              {hasMoreColumns && (
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                  +{extraColumnsCount}
                </th>
              )}
            </tr>
          </thead>

          {/* Corps */}
          <tbody>
            {reservations.map((reservation, idx) => (
              <tr
                key={reservation.id}
                className={idx % 2 === 1 ? 'bg-muted/30' : ''}
              >
                {visibleColumns.map((col) => (
                  <td key={col} className="px-2 py-1.5 whitespace-nowrap">
                    {getCellValue(col, reservation)}
                  </td>
                ))}
                {hasMoreColumns && (
                  <td className="px-2 py-1.5 text-muted-foreground">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

PreviewTable.displayName = 'PreviewTable';
