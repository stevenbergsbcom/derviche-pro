/**
 * Composant PaginationControls pour la page des réservations admin
 * Contrôles de pagination avec sélecteur de taille de page
 * Extrait de page.tsx - Session 106
 * Derviche Diffusion
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
// CONSTANTES
// ============================================

const PAGE_SIZE_OPTIONS = [50, 100, 200, 300, 400, 500] as const;

// ============================================
// COMPOSANT
// ============================================

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

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
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Précédent</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline mr-1">Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
