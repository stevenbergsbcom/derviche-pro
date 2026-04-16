/**
 * VenueDetailShowsTable - Tableau des spectacles joués dans un lieu
 * Derviche Diffusion
 *
 * Chaque ligne est cliquable → ouvre le drawer "Détail spectacle"
 * (navigation drawer-to-drawer).
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { VenueDetailRow } from '@/lib/services/admin-stats';

export interface VenueDetailShowsTableProps {
  rows: VenueDetailRow[];
  isLoading: boolean;
  onShowClick: (showId: string) => void;
}

export function VenueDetailShowsTable({
  rows,
  isLoading,
  onShowClick,
}: VenueDetailShowsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Aucun spectacle joué dans ce lieu sur la période.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Spectacle</TableHead>
            <TableHead className="text-right">Rep.</TableHead>
            <TableHead className="text-right">Conf.</TableHead>
            <TableHead className="text-right">Prés.</TableHead>
            <TableHead className="text-right">Abs.</TableHead>
            <TableHead className="text-right">Pr.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.showId}
              className="cursor-pointer hover:bg-muted/50"
              role="button"
              tabIndex={0}
              onClick={() => onShowClick(row.showId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onShowClick(row.showId);
                }
              }}
            >
              <TableCell className="max-w-[220px]">
                <div className="truncate font-medium">{row.showTitle}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.companyName || '—'}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.representationsCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.confirmedCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.presentCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.absentCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.pressCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
