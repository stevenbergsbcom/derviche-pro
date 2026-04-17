/**
 * VenuesStatsTable - Tableau "Par lieu"
 * Derviche Diffusion
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { VenueStatsWithDelta } from '@/lib/services/admin-stats';
import { DEFAULT_PAGE_SIZE } from '@/lib/services/admin-stats';
import { HIDEABLE_VENUES_COLUMNS } from '@/lib/services/app-settings';
import {
  sortVenues,
  type SortDirection,
  type VenuesSortKey,
} from '../../hooks';
import { VenuesTableHeader } from './venues-table-header';
import { VenuesTableRow } from './venues-table-row';
import { VenuesTableFooter } from './venues-table-footer';

export interface VenuesStatsTableProps {
  rows: VenueStatsWithDelta[];
  isLoading: boolean;
  showCompareColumn?: boolean;
  /** Clés des colonnes à masquer (hors `venueName` + colonne Évolution). */
  hiddenColumns?: string[];
  /** Taille de page (pagination). Défaut : DEFAULT_PAGE_SIZE. */
  pageSize?: number;
  onRowClick?: (row: VenueStatsWithDelta) => void;
}

export function VenuesStatsTable({
  rows,
  isLoading,
  showCompareColumn,
  hiddenColumns = [],
  pageSize = DEFAULT_PAGE_SIZE,
  onRowClick,
}: VenuesStatsTableProps) {
  const [sortKey, setSortKey] = useState<VenuesSortKey>('confirmedCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  // Reset à la page 1 si la taille de page change (ex. préférence async arrivée).
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const sorted = useMemo(
    () => sortVenues(rows, sortKey, sortDirection),
    [rows, sortKey, sortDirection],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const handleSort = (key: VenuesSortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'venueName' || key === 'venueCity' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  // 1 (venueName sentinel) + colonnes cachables effectivement visibles + compare.
  // On filtre hiddenColumns sur les clés connues et on dédoublonne pour éviter
  // un colSpan incorrect si la DB contient des clés obsolètes ou dupliquées.
  const hideableKeys = new Set(HIDEABLE_VENUES_COLUMNS.map((c) => c.key));
  const effectiveHidden = new Set(
    hiddenColumns.filter((k) => hideableKeys.has(k))
  );
  const visibleBaseCount = 1 + (hideableKeys.size - effectiveHidden.size);
  const colSpan = visibleBaseCount + (showCompareColumn ? 1 : 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Par lieu</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <VenuesTableHeader
            sortKey={sortKey}
            sortDirection={sortDirection}
            {...(showCompareColumn !== undefined ? { showCompareColumn } : {})}
            hiddenColumns={hiddenColumns}
            onSort={handleSort}
          />
          <TableBody>
            {pageRows.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground py-6"
                >
                  Aucune donnée pour la période sélectionnée.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((row) => (
              <VenuesTableRow
                key={row.venueId}
                row={row}
                {...(showCompareColumn !== undefined ? { showCompareColumn } : {})}
                hiddenColumns={hiddenColumns}
                {...(onRowClick ? { onClick: onRowClick } : {})}
              />
            ))}
          </TableBody>
          <VenuesTableFooter
            rows={sorted}
            {...(showCompareColumn !== undefined ? { showCompareColumn } : {})}
            hiddenColumns={hiddenColumns}
          />
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
            <span>
              Page {currentPage} / {totalPages} — {sorted.length} lieu
              {sorted.length > 1 ? 'x' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
