/**
 * ShowsTableFooter - Ligne de totaux "Par spectacle"
 */

'use client';

import type { ShowStats } from '@/lib/services/admin-stats';
import { TableCell, TableFooter, TableRow } from '@/components/ui/table';

function sum(rows: ShowStats[], key: keyof ShowStats): number {
  let total = 0;
  for (const r of rows) {
    const v = r[key];
    if (typeof v === 'number') total += v;
  }
  return total;
}

export interface ShowsTableFooterProps {
  rows: ShowStats[];
}

export function ShowsTableFooter({ rows }: ShowsTableFooterProps) {
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
      </TableRow>
    </TableFooter>
  );
}
