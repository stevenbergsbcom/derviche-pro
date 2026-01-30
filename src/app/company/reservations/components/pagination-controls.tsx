/**
 * Composant PaginationControls pour la page des réservations compagnie
 * Contrôles de pagination avec sélecteur de taille de page
 * Structure identique à admin/reservations
 * Derviche Diffusion - Session 119
 */

'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../constants';

// ============================================
// TYPES
// ============================================

export interface PaginationControlsProps {
  /** Page actuelle */
  page: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Total de résultats */
  total: number;
  /** Taille de page actuelle */
  pageSize: number;
  /** Handler pour changer de page */
  onPageChange: (page: number) => void;
  /** Handler pour changer la taille de page */
  onPageSizeChange: (size: number) => void;
}

// ============================================
// COMPOSANT
// ============================================

function PaginationControlsComponent({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const handlePrevious = useCallback(() => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  }, [page, onPageChange]);

  const handleNext = useCallback(() => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  }, [page, totalPages, onPageChange]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
      {/* Info pagination */}
      <p className="text-sm text-muted-foreground">
        Page {page}/{totalPages || 1}
        <span className="hidden sm:inline"> ({total} résultats)</span>
      </p>

      {/* Contrôles */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Sélecteur de taille de page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Afficher
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[80px] h-8">
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

        {/* Boutons précédent/suivant */}
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline ml-1">Précédent</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline mr-1">Suivant</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

PaginationControlsComponent.displayName = 'PaginationControls';

export const PaginationControls = memo(PaginationControlsComponent);
