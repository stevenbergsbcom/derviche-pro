/**
 * Composant CapacityField - Champ capacité avec checkbox illimité
 * Derviche Diffusion - Session 103
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import type { CapacityFieldProps } from '../types';
import { LABELS } from '../constants';

/**
 * Champ de capacité avec option illimité
 */
export function CapacityField({
  capacity,
  isUnlimited,
  onCapacityChange,
  onUnlimitedChange,
}: CapacityFieldProps) {
  /**
   * Gère le changement de capacité
   * Ne met à jour que si la valeur est un nombre valide >= 1
   */
  const handleCapacityChange = (value: string) => {
    const parsed = parseInt(value, 10);
    // Ne mettre à jour que si c'est un nombre valide >= 1
    // Sinon, conserver la valeur précédente (le champ affichera '' pour null)
    if (!isNaN(parsed) && parsed >= 1) {
      onCapacityChange(parsed);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="representation-capacity">
        {LABELS.capacity} <span className="text-destructive">*</span>
      </Label>
      <p className="text-xs text-muted-foreground">{LABELS.capacityHelp}</p>
      <div className="flex items-center gap-2">
        <Input
          id="representation-capacity"
          type="number"
          min="1"
          value={capacity ?? ''}
          onChange={(e) => handleCapacityChange(e.target.value)}
          disabled={isUnlimited}
          required={!isUnlimited}
          className={isUnlimited ? 'flex-1 bg-muted text-muted-foreground' : 'flex-1'}
          aria-describedby="capacity-unlimited-description"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isUnlimited"
            checked={isUnlimited}
            onCheckedChange={(checked) => onUnlimitedChange(checked === true)}
            aria-describedby="capacity-unlimited-description"
          />
          <Label htmlFor="isUnlimited" className="font-normal cursor-pointer">
            {LABELS.unlimited}
          </Label>
        </div>
      </div>
      <span id="capacity-unlimited-description" className="sr-only">
        Cochez pour ne pas limiter le nombre de réservations
      </span>
    </div>
  );
}
