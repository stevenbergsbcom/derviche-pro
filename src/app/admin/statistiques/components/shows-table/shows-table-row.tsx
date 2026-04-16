/**
 * ShowsTableRow - Ligne du tableau "Par spectacle"
 *
 * La ligne est cliquable → ouvre le drawer "Détail spectacle".
 */

'use client';

import type { ShowStatsWithDelta } from '@/lib/services/admin-stats';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatsKpiDelta } from '../kpis/stats-kpi-delta';

export interface ShowsTableRowProps {
  row: ShowStatsWithDelta;
  showCompareColumn?: boolean;
  /** Clés des colonnes à masquer (showTitle reste toujours visible). */
  hiddenColumns?: string[];
  onClick?: (row: ShowStatsWithDelta) => void;
}

export function ShowsTableRow({
  row,
  showCompareColumn,
  hiddenColumns = [],
  onClick,
}: ShowsTableRowProps) {
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
      {!hiddenColumns.includes('companyName') && (
        <TableCell className="text-muted-foreground">{row.companyName || '—'}</TableCell>
      )}
      {!hiddenColumns.includes('representationsCount') && (
        <TableCell className="text-right tabular-nums">{row.representationsCount}</TableCell>
      )}
      {!hiddenColumns.includes('confirmedCount') && (
        <TableCell className="text-right tabular-nums">{row.confirmedCount}</TableCell>
      )}
      {!hiddenColumns.includes('cancelledCount') && (
        <TableCell className="text-right tabular-nums text-red-600">
          {row.cancelledCount}
        </TableCell>
      )}
      {!hiddenColumns.includes('presentCount') && (
        <TableCell className="text-right tabular-nums">{row.presentCount}</TableCell>
      )}
      {!hiddenColumns.includes('absentCount') && (
        <TableCell className="text-right tabular-nums">{row.absentCount}</TableCell>
      )}
      {!hiddenColumns.includes('pressCount') && (
        <TableCell className="text-right tabular-nums">{row.pressCount}</TableCell>
      )}
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
