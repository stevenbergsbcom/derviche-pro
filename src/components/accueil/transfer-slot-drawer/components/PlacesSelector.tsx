/**
 * PlacesSelector - Sélecteur du nombre de places
 * Derviche Diffusion
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import type { PlacesSelectorProps } from '../types';
import { MAX_PLACES } from '../constants';

// ============================================
// COMPOSANT
// ============================================

export function PlacesSelector({
  numPlaces,
  originalNumPlaces,
  isSubmitting,
  onDecrease,
  onIncrease,
  onChange,
}: PlacesSelectorProps) {
  const difference = numPlaces - originalNumPlaces;
  
  return (
    <div className="p-4 border-b bg-muted/30">
      <label 
        htmlFor="num-places-input"
        className="text-base font-medium text-muted-foreground mb-2 block"
      >
        Nombre de places
      </label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onDecrease}
          disabled={numPlaces <= 1 || isSubmitting}
          aria-label="Diminuer le nombre de places"
          className="h-12 w-12 shrink-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Input
          id="num-places-input"
          type="number"
          min={1}
          max={MAX_PLACES}
          value={numPlaces}
          onChange={onChange}
          disabled={isSubmitting}
          className="w-20 h-12 text-base text-center"
          aria-label="Nombre de places"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onIncrease}
          disabled={numPlaces >= MAX_PLACES || isSubmitting}
          aria-label="Augmenter le nombre de places"
          className="h-12 w-12 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        {difference !== 0 && (
          <Badge variant="secondary" className="ml-2">
            {difference > 0 ? '+' : ''}
            {difference}
          </Badge>
        )}
      </div>
    </div>
  );
}
