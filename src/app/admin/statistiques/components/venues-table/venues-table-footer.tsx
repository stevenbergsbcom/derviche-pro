/**
 * VenuesTableFooter - Ligne de totaux "Par lieu"
 *
 * Note : `showsCount` cumulé n'a pas de sens (un même spectacle peut être
 * joué dans plusieurs lieux), on affiche donc un tiret pour cette colonne.
 */

'use client';

import type { VenueStatsWithDelta } from '@/lib/services/admin-stats';
import { TableCell, TableFooter, TableRow } from '@/components/ui/table';

function sum(rows: VenueStatsWithDelta[], key: keyof VenueStatsWithDelta): number {
  let total = 0;
  for (const r of rows) {
    const v = r[key];
    if (typeof v === 'number') total += v;
  }
  return total;
}

export interface VenuesTableFooterProps {
  rows: VenueStatsWithDelta[];
  showCompareColumn?: boolean;
  /** Clés des colonnes à masquer (alignement avec header + rows). */
  hiddenColumns?: string[];
}

export function VenuesTableFooter({
  rows,
  showCompareColumn,
  hiddenColumns = [],
}: VenuesTableFooterProps) {
  if (rows.length === 0) return null;
  return (
    <TableFooter>
      <TableRow>
        <TableCell className="font-semibold">Total ({rows.length})</TableCell>
        {!hiddenColumns.includes('venueCity') && <TableCell />}
        {!hiddenColumns.includes('representationsCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'representationsCount')}
          </TableCell>
        )}
        {!hiddenColumns.includes('showsCount') && (
          <TableCell className="text-right tabular-nums text-muted-foreground">—</TableCell>
        )}
        {!hiddenColumns.includes('confirmedCount') && (
          <TableCell className="text-right tabular-nums">
            {sum(rows, 'confirmedCount')}
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
