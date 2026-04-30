/**
 * CatalogueMobileFilters
 * Derviche Diffusion — S197
 *
 * Barre mobile (< md) du catalogue :
 *  - Bouton « Filtres » + badge count → ouvre un Sheet latéral droit
 *  - Bouton « Réinitialiser » rapide (visible uniquement si filtres actifs)
 *
 * Sheet :
 *  - body scrollable contenant `<CatalogueFiltersForm layout="stacked" />`
 *  - footer sticky : « Effacer » + « Voir N résultats » (ferme le sheet)
 *
 * Desktop ≥ md : composant masqué via Tailwind (`md:hidden`), les filtres
 * sont rendus inline par la page.
 */

'use client';

import { useState } from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  CatalogueFiltersForm,
  countActiveFilters,
  type CatalogueFiltersValue,
  type CatalogueFiltersOptions,
} from './CatalogueFiltersForm';

interface CatalogueMobileFiltersProps {
  value: CatalogueFiltersValue;
  options: CatalogueFiltersOptions;
  /** Nombre total de spectacles correspondant aux filtres actifs. */
  resultsCount: number;
  onGenreChange: (v: string) => void;
  onAudienceChange: (v: string) => void;
  onMoisChange: (v: string) => void;
  onLieuChange: (v: string) => void;
  onVilleChange: (v: string) => void;
  onAvailableChange: (v: boolean) => void;
  onSearchChange: (v: string) => void;
  onReset: () => void;
}

export function CatalogueMobileFilters(props: CatalogueMobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(props.value);

  return (
    <div className="md:hidden flex items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            Filtres
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-derviche text-white text-xs font-semibold min-w-5 h-5 px-1.5">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>

        {/* Sheet latéral droit, flex column pour que le body scrolle et le
            footer reste sticky en bas. */}
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle>Filtres</SheetTitle>
            <SheetDescription>
              {props.resultsCount === 0
                ? 'Aucun spectacle ne correspond à vos critères.'
                : props.resultsCount === 1
                  ? '1 spectacle correspond à vos critères.'
                  : `${props.resultsCount} spectacles correspondent à vos critères.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <CatalogueFiltersForm
              value={props.value}
              options={props.options}
              onGenreChange={props.onGenreChange}
              onAudienceChange={props.onAudienceChange}
              onMoisChange={props.onMoisChange}
              onLieuChange={props.onLieuChange}
              onVilleChange={props.onVilleChange}
              onAvailableChange={props.onAvailableChange}
              onSearchChange={props.onSearchChange}
              layout="stacked"
            />
          </div>

          <div className="border-t px-4 py-3 flex gap-2 bg-background">
            <Button
              variant="outline"
              onClick={props.onReset}
              disabled={activeCount === 0}
              className="flex-1"
            >
              Effacer
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="flex-[2] bg-derviche hover:bg-derviche-dark"
            >
              Voir {props.resultsCount} résultat
              {props.resultsCount > 1 ? 's' : ''}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onReset}
          className="text-muted-foreground gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
