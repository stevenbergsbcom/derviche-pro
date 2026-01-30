/**
 * Composant PaginationControls - Pagination réservations compagnie
 * Derviche Diffusion - Session 117
 * 
 * Affiche:
 * - Info résultats et sélecteur taille de page
 * - Navigation avec numéros de page cliquables
 */

'use client';

import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, MAX_VISIBLE_PAGES } from '../constants';
import type { PaginationControlsProps } from '../types';

/**
 * Calcule les numéros de page à afficher
 */
function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number
): number[] {
  const pages: number[] = [];
  
  if (totalPages <= maxVisible) {
    // Toutes les pages sont visibles
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else if (currentPage <= Math.ceil(maxVisible / 2)) {
    // Début : afficher les premières pages
    for (let i = 1; i <= maxVisible; i++) {
      pages.push(i);
    }
  } else if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
    // Fin : afficher les dernières pages
    for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Milieu : centrer autour de la page actuelle
    const half = Math.floor(maxVisible / 2);
    for (let i = currentPage - half; i <= currentPage + half; i++) {
      pages.push(i);
    }
  }
  
  return pages;
}

function PaginationControlsComponent({
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  // Mémoiser le calcul des pages visibles
  const visiblePages = useMemo(
    () => getVisiblePageNumbers(page, totalPages, MAX_VISIBLE_PAGES),
    [page, totalPages]
  );

  return (
    <>
      {/* Header : info + sélecteur taille */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <p className="text-sm text-muted-foreground">
          {total} réservation{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-xs text-muted-foreground">
            Par page:
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger id="page-size" className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer : pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between px-4 py-3 border-t"
          aria-label="Pagination"
        >
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-1">
            {/* Bouton précédent */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              aria-label="Page précédente"
            >
              <ChevronLeft aria-hidden="true" className="w-4 h-4" />
            </Button>

            {/* Numéros de page */}
            <div className="flex items-center gap-1 mx-2">
              {visiblePages.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  aria-label={`Page ${pageNum}`}
                  aria-current={page === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            {/* Bouton suivant */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              aria-label="Page suivante"
            >
              <ChevronRight aria-hidden="true" className="w-4 h-4" />
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}

PaginationControlsComponent.displayName = 'PaginationControls';

export const PaginationControls = memo(PaginationControlsComponent);
