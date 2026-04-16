/**
 * ShowDetailExportButton - Bouton "Exporter PDF" (désactivé Phase 2)
 * Derviche Diffusion
 *
 * L'export PDF est planifié en Phase 3. Le bouton est affiché désactivé
 * avec un tooltip explicatif pour préparer l'UI.
 */

'use client';

import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ShowDetailExportButton() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/*
           * span pour que le tooltip fonctionne sur un bouton désactivé
           * (Radix n'émet pas d'events sur un élément disabled)
           */}
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              aria-disabled="true"
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              Exporter PDF
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Disponible en Phase 3</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
