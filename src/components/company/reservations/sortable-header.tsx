/**
 * Header de colonne triable pour le tableau des réservations compagnie
 * Derviche Diffusion
 */

'use client';

import React, { memo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { CompanyReservationColumn } from '@/hooks/useUserPreferences';
import { 
  type SortOption, 
  SORTABLE_COLUMNS, 
  isSortableColumn, 
  getColumnSortState 
} from './reservation-helpers';

// ============================================
// COMPOSANT SORTABLE HEADER
// ============================================

interface CompanySortableHeaderProps {
  column: CompanyReservationColumn;
  label: string;
  currentSort: SortOption | undefined;
  onSort: (sortOption: SortOption | undefined) => void;
  className?: string;
}

/**
 * Header de colonne cliquable pour le tri
 * - 1er clic : tri ascendant
 * - 2ème clic : tri descendant  
 * - 3ème clic : retour au tri par défaut (date représentation ↑)
 */
export const CompanySortableHeader = memo(function CompanySortableHeader({
  column,
  label,
  currentSort,
  onSort,
  className = '',
}: CompanySortableHeaderProps) {
  if (!isSortableColumn(column)) {
    // Colonne non triable - affichage simple
    return (
      <th className={`h-10 px-2 text-left align-middle font-medium whitespace-nowrap ${className}`}>
        {label}
      </th>
    );
  }

  const sortState = getColumnSortState(column, currentSort);
  const mapping = SORTABLE_COLUMNS[column];
  
  const handleClick = () => {
    if (sortState === null) {
      // Pas de tri sur cette colonne -> tri ascendant
      onSort(mapping.asc);
    } else if (sortState === 'asc') {
      // Ascendant -> descendant
      onSort(mapping.desc);
    } else {
      // Descendant -> retour au défaut (date représentation asc)
      onSort('slot_date_asc');
    }
  };

  // Déterminer l'attribut aria-sort
  const ariaSort = sortState === 'asc' ? 'ascending' : sortState === 'desc' ? 'descending' : 'none';

  return (
    <th 
      className={`h-10 px-2 text-left align-middle font-medium whitespace-nowrap ${className}`}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 hover:text-derviche transition-colors group"
        aria-label={`Trier par ${label}`}
      >
        {label}
        <span className="inline-flex flex-col text-[10px] leading-none" aria-hidden="true">
          <ChevronUp 
            className={`w-3 h-3 -mb-1 transition-colors ${
              sortState === 'asc' 
                ? 'text-derviche' 
                : 'text-muted-foreground/40 group-hover:text-muted-foreground'
            }`} 
          />
          <ChevronDown 
            className={`w-3 h-3 transition-colors ${
              sortState === 'desc' 
                ? 'text-derviche' 
                : 'text-muted-foreground/40 group-hover:text-muted-foreground'
            }`} 
          />
        </span>
      </button>
    </th>
  );
});

CompanySortableHeader.displayName = 'CompanySortableHeader';
