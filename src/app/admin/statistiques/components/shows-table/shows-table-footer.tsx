/**
 * ShowsTableFooter - Ligne de totaux "Par spectacle"
 */

'use client';

import type { ShowStatsWithDelta } from '@/lib/services/admin-stats';
import { TableCell, TableFooter, TableRow } from '@/components/ui/table';

function sum(rows: ShowStatsWithDelta[], key: keyof ShowStatsWithDelta): number {
  let total = 0;
  for (const r of rows) {
    const v = r[key];
    if (typeof v === 'number') total += v;
  }
  return total;
}

export interface ShowsTableFooterProps {
  rows: ShowStatsWithDelta[];
  showCompareColumn?: boolean;
  /** Clés des colonnes à masquer (alignement avec header + rows). */
  hiddenColumns?: string[];
}

export function ShowsTableFooter({
  rows,
  showCompareColumn,
  hiddenColumns = [],
}: ShowsTableFooterProps) {
  if (rows.length === 0) return null;
  return (
    <TableFooter>
      <TableRow>
        <TableCell className="font-semibold">Total ({rows.length})</TableCell>
        {!hiddenColumns.includes('companyName') && <TableCell />}
        {!hiddenColumns.includes('representationsCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'representationsCount')}
          </TableCell>
        )}
        {!hiddenColumns.includes('confirmedCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'confirmedCount')}
          </TableCell>
        )}
        {!hiddenColumns.includes('cancelledCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'cancelledCount')}
          </TableCell>
        )}
        {!hiddenColumns.includes('presentCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'presentCount')}
          </TableCell>
        )}
        {!hiddenColumns.includes('absentCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'absentCount')}
          </TableCell>
        )}
        {!hiddenColumns.includes('pressCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'pressCount')}
          </TableCell>
        )}
        {showCompareColumn && <TableCell />}
      </TableRow>
    </TableFooter>
  );
}
