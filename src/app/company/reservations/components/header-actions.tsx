/**
 * Composant HeaderActions - En-tête page réservations compagnie
 * Derviche Diffusion - Session 117
 * 
 * Affiche le titre et les boutons d'action (Actualiser, Exporter)
 */

'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Download } from 'lucide-react';
import type { HeaderActionsProps } from '../types';

function HeaderActionsComponent({
  isLoading,
  hasReservations,
  onRefresh,
  onExport,
}: HeaderActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold text-derviche-dark flex items-center gap-2">
          <Calendar aria-hidden="true" className="w-7 h-7 text-gold" />
          Réservations
        </h1>
        <p className="text-muted-foreground">
          Consultez les réservations de vos spectacles
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            aria-hidden="true"
            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Actualiser
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={!hasReservations}
        >
          <Download aria-hidden="true" className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  );
}

HeaderActionsComponent.displayName = 'HeaderActions';

export const HeaderActions = memo(HeaderActionsComponent);
