/**
 * ShowsTableRow - Ligne du tableau "Par spectacle"
 *
 * La ligne est cliquable → ouvre le drawer "Détail spectacle".
 */

'use client';

import type { ShowStats } from '@/lib/services/admin-stats';
import { TableCell, TableRow } from '@/components/ui/table';

export interface ShowsTableRowProps {
  row: ShowStats;
  onClick?: (row: ShowStats) => void;
}

export function ShowsTableRow({ row, onClick }: ShowsTableRowProps) {
  const handleClick = onClick ? () => onClick(row) : undefined;
  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(row);
        }
      }
    : undefined;

  return (
    <TableRow
      className={onClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
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
