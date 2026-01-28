/**
 * Composant CapacitySection - Gestion de la capacité
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { DEFAULT_CAPACITY } from '../constants';
import type { CapacitySectionProps } from '../types';

export function CapacitySection({
  capacity,
  isUnlimited,
  onCapacityChange,
  onUnlimitedChange,
}: CapacitySectionProps) {
  const handleUnlimitedChange = (checked: boolean) => {
    onUnlimitedChange(checked);
    if (checked) {
      onCapacityChange(null);
    } else {
      onCapacityChange(DEFAULT_CAPACITY);
    }
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Envoyer null si vide, sinon le nombre (min 1)
    onCapacityChange(raw === '' ? null : Math.max(1, parseInt(raw, 10) || 1));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="seriesCapacity">
        Places max (pro) <span className="text-destructive">*</span>
      </Label>
      <p id="capacity-help" className="text-xs text-muted-foreground">
        Nombre maximum de programmateurs pouvant réserver
      </p>
      <div className="flex items-center gap-2">
        <Input
          id="seriesCapacity"
          type="number"
          min="1"
          value={capacity ?? ''}
          onChange={handleCapacityChange}
          disabled={isUnlimited}
          required={!isUnlimited}
          className={isUnlimited ? 'flex-1 bg-muted text-muted-foreground' : 'flex-1'}
          aria-describedby="capacity-help"
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="seriesIsUnlimited"
            checked={isUnlimited}
            onCheckedChange={(checked) => handleUnlimitedChange(checked === true)}
          />
          <Label 
            htmlFor="seriesIsUnlimited" 
            className="font-normal cursor-pointer"
          >
            Illimité
          </Label>
        </div>
      </div>
    </div>
  );
}
