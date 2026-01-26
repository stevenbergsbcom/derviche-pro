/**
 * ActionBar - Barre d'actions en bas de page (refresh + ajout)
 * Derviche Diffusion
 */

'use client';

import { RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionBarProps {
  onRefresh: () => void;
  onAddReservation: () => void;
}

export function ActionBar({ onRefresh, onAddReservation }: ActionBarProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="shrink-0"
        aria-label="Rafraîchir la liste"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onAddReservation}
        className="flex-1 bg-gold hover:bg-gold/90 text-derviche-dark"
      >
        <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
        Ajouter une réservation
      </Button>
    </div>
  );
}
