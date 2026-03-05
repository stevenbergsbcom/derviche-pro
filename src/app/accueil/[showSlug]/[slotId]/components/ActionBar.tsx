/**
 * ActionBar - Barre d'actions en bas de page (refresh uniquement)
 * Derviche Diffusion
 *
 * Le bouton "Ajouter une réservation" a été supprimé au profit du ReservationFAB.
 */

'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionBarProps {
  onRefresh: () => void;
}

export function ActionBar({ onRefresh }: ActionBarProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="w-full"
        aria-label="Rafraîchir la liste"
      >
        <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
        Actualiser
      </Button>
    </div>
  );
}
