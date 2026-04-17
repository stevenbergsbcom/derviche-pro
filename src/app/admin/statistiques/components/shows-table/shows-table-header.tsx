/**
 * ShowsTableHeader - En-tête triable
 */

'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ShowsSortKey, SortDirection } from '../../hooks';

interface Column {
  key: ShowsSortKey;
  label: string;
  align?: 'left' | 'right';
}

const BASE_COLUMNS: Column[] = [
  { key: 'showTitle', label: 'Spectacle', align: 'left' },
  { key: 'companyName', label: 'Compagnie', align: 'left' },
  { key: 'representationsCount', label: 'Représ.', align: 'right' },
  { key: 'confirmedCount', label: 'Confirmées', align: 'right' },
  { key: 'cancelledCount', label: 'Annulées', align: 'right' },
  { key: 'presentCount', label: 'Présents', align: 'right' },
  { key: 'absentCount', label: 'Absents', align: 'right' },
  { key: 'pressCount', label: 'Presse', align: 'right' },
];

const COMPARE_COLUMN: Column = {
  key: 'confirmedCountDelta',
  label: 'Évolution',
  align: 'right',
};

export interface ShowsTableHeaderProps {
  sortKey: ShowsSortKey;
  sortDirection: SortDirection;
  showCompareColumn?: boolean;
  /** Clés des colonnes à masquer (la colonne Évolution n'est jamais incluse ici). */
  hiddenColumns?: string[];
  onSort: (key: ShowsSortKey) => void;
}

export function ShowsTableHeader({
  sortKey,
  sortDirection,
  showCompareColumn,
  hiddenColumns = [],
  onSort,
}: ShowsTableHeaderProps) {
  const filteredBase = BASE_COLUMNS.filter((col) => !hiddenColumns.includes(col.key));
  const columns = showCompareColumn ? [...filteredBase, COMPARE_COLUMN] : filteredBase;
  return (
    <TableHeader>
      <TableRow>
        {columns.map((col) => {
          const active = col.key === sortKey;
          const Icon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
          const ariaSort: 'ascending' | 'descending' | 'none' = active
            ? sortDirection === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none';
          return (
            <TableHead
              key={col.key}
              className={cn(
                'cursor-pointer select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                col.align === 'right' && 'text-right',
              )}
              role="columnheader"
              aria-sort={ariaSort}
              tabIndex={0}
              onClick={() => onSort(col.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSort(col.key);
                }
              }}
            >
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  col.align === 'right' && 'flex-row-reverse',
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
