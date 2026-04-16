/**
 * ShowsStatsTable - Tableau "Par spectacle"
 * Derviche Diffusion
 */

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { ShowStatsWithDelta } from '@/lib/services/admin-stats';
import { DEFAULT_PAGE_SIZE } from '@/lib/services/admin-stats';
import {
  sortShows,
  type ShowsSortKey,
  type SortDirection,
} from '../../hooks';
import { ShowsTableHeader } from './shows-table-header';
import { ShowsTableRow } from './shows-table-row';
import { ShowsTableFooter } from './shows-table-footer';

export interface ShowsStatsTableProps {
  rows: ShowStatsWithDelta[];
  isLoading: boolean;
  showCompareColumn?: boolean;
  onRowClick?: (row: ShowStatsWithDelta) => void;
}

export function ShowsStatsTable({
  rows,
  isLoading,
  showCompareColumn,
  onRowClick,
}: ShowsStatsTableProps) {
  const [sortKey, setSortKey] = useState<ShowsSortKey>('confirmedCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () => sortShows(rows, sortKey, sortDirection),
    [rows, sortKey, sortDirection],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / DEFAULT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const pageRows = sorted.slice(start, start + DEFAULT_PAGE_SIZE);

  const handleSort = (key: ShowsSortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'showTitle' || key === 'companyName' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const colSpan = showCompareColumn ? 9 : 8;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Par spectacle</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <ShowsTableHeader
            sortKey={sortKey}
            sortDirection={sortDirection}
            {...(showCompareColumn !== undefined ? { showCompareColumn } : {})}
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
              <ShowsTableRow
                key={row.showId}
                row={row}
                {...(showCompareColumn !== undefined ? { showCompareColumn } : {})}
                {...(onRowClick ? { onClick: onRowClick } : {})}
              />
            ))}
          </TableBody>
          <ShowsTableFooter
            rows={sorted}
            {...(showCompareColumn !== undefined ? { showCompareColumn } : {})}
          />
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
            <span>
              Page {currentPage} / {totalPages} — {sorted.length} spectacle
              {sorted.length > 1 ? 's' : ''}
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
