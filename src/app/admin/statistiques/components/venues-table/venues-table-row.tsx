/**
 * VenuesTableRow - Ligne du tableau "Par lieu"
 */

'use client';

import type { VenueStats } from '@/lib/services/admin-stats';
import { TableCell, TableRow } from '@/components/ui/table';

export interface VenuesTableRowProps {
  row: VenueStats;
}

export function VenuesTableRow({ row }: VenuesTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{row.venueName}</TableCell>
      <TableCell className="text-muted-foreground">{row.venueCity || '—'}</TableCell>
      <TableCell className="text-right tabular-nums">{row.representationsCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.showsCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.confirmedCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.presentCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.absentCount}</TableCell>
      <TableCell className="text-right tabular-nums">{row.pressCount}</TableCell>
    </TableRow>
  );
}
