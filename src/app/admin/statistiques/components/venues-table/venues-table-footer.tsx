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
}

export function VenuesTableFooter({ rows, showCompareColumn }: VenuesTableFooterProps) {
  if (rows.length === 0) return null;
  return (
    <TableFooter>
      <TableRow>
        <TableCell className="font-semibold">Total ({rows.length})</TableCell>
        <TableCell />
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'representationsCount')}
        </TableCell>
        <TableCell className="text-right tabular-nums text-muted-foreground">—</TableCell>
        <TableCell className="text-right tabular-nums">
          {sum(rows, 'confirmedCount')}
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
