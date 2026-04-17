/**
 * VenueDetailHeader - En-tête du drawer "Détail lieu"
 * Derviche Diffusion
 */

'use client';

import { MapPin } from 'lucide-react';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface VenueDetailHeaderProps {
  name: string;
  city: string;
  periodLabel: string;
}

export function VenueDetailHeader({ name, city, periodLabel }: VenueDetailHeaderProps) {
  return (
    <SheetHeader className="border-b">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-derviche/10 text-derviche">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <SheetTitle className="truncate text-base">{name}</SheetTitle>
          <SheetDescription className="mt-0.5 truncate">
            {city || '—'}
          </SheetDescription>
          <p className="mt-1 text-xs text-muted-foreground">
            Période&nbsp;: {periodLabel}
          </p>
        </div>
      </div>
    </SheetHeader>
  );
}
