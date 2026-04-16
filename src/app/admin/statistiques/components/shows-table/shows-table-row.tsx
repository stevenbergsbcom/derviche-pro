/**
 * ShowsTableRow - Ligne du tableau "Par spectacle"
 */

'use client';

import type { ShowStats } from '@/lib/services/admin-stats';
import { TableCell, TableRow } from '@/components/ui/table';

export interface ShowsTableRowProps {
  row: ShowStats;
}

export function ShowsTableRow({ row }: ShowsTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{row.showTitle}</TableCell>
      <TableCell className="text-muted-foreground">{row.companyName || '—'}</TableCell>
      <TableCell className="text-right tabular-nums">{row.representationsCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.confirmedCount}</TableCell>
      <TableCell className="text-right tabular-nums text-red-600">{row.cancelledCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.presentCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.absentCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.pressCount}</TableCell>
    </TableRow>
  );
}
