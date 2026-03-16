/**
 * LogsPagination — Barre de pagination du tableau de logs
 * Derviche Diffusion
 *
 * Affiche le numéro de page courant et les boutons précédent/suivant.
 */

'use client';

import { Button } from '@/components/ui/button';

/** Props du composant LogsPagination */
interface LogsPaginationProps {
  /** Page courante */
  page: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Indique si un chargement est en cours */
  isLoading: boolean;
  /** Callback changement de page */
  onPageChange: (page: number) => void;
}

/** Barre de pagination avec boutons précédent/suivant */
export function LogsPagination({
  page,
  totalPages,
  isLoading,
  onPageChange,
}: LogsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-xs text-muted-foreground">
        Page {page} / {totalPages}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
