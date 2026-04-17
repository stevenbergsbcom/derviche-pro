/**
 * ShowDetailHeader - En-tête du drawer "Détail spectacle"
 * Derviche Diffusion
 *
 * Affiche titre + compagnie + libellé de période filtrée.
 * (Pas d'image pour l'instant — `ShowStats` n'inclut pas `image_url` ;
 * on privilégie une lecture rapide sans requête supplémentaire.)
 */

'use client';

import { Film } from 'lucide-react';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface ShowDetailHeaderProps {
  title: string;
  companyName: string;
  periodLabel: string;
}

export function ShowDetailHeader({
  title,
  companyName,
  periodLabel,
}: ShowDetailHeaderProps) {
  return (
    <SheetHeader className="border-b">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-derviche/10 text-derviche">
          <Film className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <SheetTitle className="truncate text-base">{title}</SheetTitle>
          <SheetDescription className="mt-0.5 truncate">
            {companyName || '—'}
          </SheetDescription>
          <p className="mt-1 text-xs text-muted-foreground">
            Période&nbsp;: {periodLabel}
          </p>
        </div>
      </div>
    </SheetHeader>
  );
}
