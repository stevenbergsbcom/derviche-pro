/**
 * ShowDetailRepresentationsTable - Tableau des représentations d'un spectacle
 * Derviche Diffusion
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
import type { ShowDetailRow } from '@/lib/services/admin-stats';
import { formatDateShortWithYear, formatTimeFr } from '@/lib/utils/format-date';

export interface ShowDetailRepresentationsTableProps {
  rows: ShowDetailRow[];
  isLoading: boolean;
}

export function ShowDetailRepresentationsTable({
  rows,
  isLoading,
}: ShowDetailRepresentationsTableProps) {
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
        Aucune représentation sur la période sélectionnée.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Lieu</TableHead>
            <TableHead className="text-right">Cap.</TableHead>
            <TableHead className="text-right">Conf.</TableHead>
            <TableHead className="text-right">Prés.</TableHead>
            <TableHead className="text-right">Abs.</TableHead>
            <TableHead className="text-right">Pr.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.slotId}>
              <TableCell className="whitespace-nowrap font-medium">
                {formatDateShortWithYear(row.slotDate)}
                <span className="ml-1 text-xs text-muted-foreground">
                  {formatTimeFr(row.slotTime)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.venueName || '—'}
                {row.venueCity && (
                  <span className="ml-1 text-xs">· {row.venueCity}</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.capacity || '—'}
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
