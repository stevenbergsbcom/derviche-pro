/**
 * VenuesTableRow - Ligne du tableau "Par lieu"
 *
 * La ligne est cliquable → ouvre le drawer "Détail lieu".
 */

'use client';

import type { VenueStatsWithDelta } from '@/lib/services/admin-stats';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatsKpiDelta } from '../kpis/stats-kpi-delta';

export interface VenuesTableRowProps {
  row: VenueStatsWithDelta;
  showCompareColumn?: boolean;
  onClick?: (row: VenueStatsWithDelta) => void;
}

export function VenuesTableRow({ row, showCompareColumn, onClick }: VenuesTableRowProps) {
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
      <TableCell className="font-medium">{row.venueName}</TableCell>
      <TableCell className="text-muted-foreground">{row.venueCity || '—'}</TableCell>
      <TableCell className="text-right tabular-nums">{row.representationsCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.showsCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.confirmedCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.presentCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.absentCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.pressCount}</TableCell>
      {showCompareColumn && (
        <TableCell className="text-right tabular-nums">
          {row.confirmedCountDelta ? (
            <div className="inline-flex justify-end">
              <StatsKpiDelta value={row.confirmedCountDelta} />
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
