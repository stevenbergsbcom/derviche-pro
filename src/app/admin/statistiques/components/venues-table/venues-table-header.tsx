/**
 * VenuesTableHeader - En-tête triable
 */

'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { SortDirection, VenuesSortKey } from '../../hooks';

interface Column {
  key: VenuesSortKey;
  label: string;
  align?: 'left' | 'right';
}

const COLUMNS: Column[] = [
  { key: 'venueName', label: 'Lieu', align: 'left' },
  { key: 'venueCity', label: 'Ville', align: 'left' },
  { key: 'representationsCount', label: 'Représ.', align: 'right' },
  { key: 'showsCount', label: 'Spectacles', align: 'right' },
  { key: 'confirmedCount', label: 'Confirmées', align: 'right' },
  { key: 'presentCount', label: 'Présents', align: 'right' },
  { key: 'absentCount', label: 'Absents', align: 'right' },
  { key: 'pressCount', label: 'Presse', align: 'right' },
];

export interface VenuesTableHeaderProps {
  sortKey: VenuesSortKey;
  sortDirection: SortDirection;
  onSort: (key: VenuesSortKey) => void;
}

export function VenuesTableHeader({ sortKey, sortDirection, onSort }: VenuesTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {COLUMNS.map((col) => {
          const active = col.key === sortKey;
          const Icon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
          return (
            <TableHead
              key={col.key}
              className={cn(
                'cursor-pointer select-none',
                col.align === 'right' && 'text-right'
              )}
              onClick={() => onSort(col.key)}
            >
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  col.align === 'right' && 'flex-row-reverse'
                )}
              >
                <Icon className="h-3 w-3 opacity-60" />
                {col.label}
              </span>
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
