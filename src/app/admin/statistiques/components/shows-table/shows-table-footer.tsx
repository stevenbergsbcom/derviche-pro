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
}

export function ShowsTableFooter({ rows, showCompareColumn }: ShowsTableFooterProps) {
  if (rows.length === 0) return null;
  return (
    <TableFooter>
      <TableRow>
        <TableCell className="font-semibold">Total ({rows.length})</TableCell>
        <TableCell />
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'representationsCount')}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'confirmedCount')}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'cancelledCount')}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'presentCount')}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'absentCount')}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'pressCount')}
        </TableCell>
        {showCompareColumn && <TableCell />}
      </TableRow>
    </TableFooter>
  );
}
