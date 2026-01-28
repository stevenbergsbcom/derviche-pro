/**
 * Composant TimesSection - Gestion des horaires multiples
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { TimesSectionProps } from '../types';

export function TimesSection({
  times,
  onTimeChange,
  onAddTime,
  onRemoveTime,
}: TimesSectionProps) {
  return (
    <div className="space-y-2">
      <Label>
        Horaires <span className="text-destructive">*</span>
      </Label>
      <div className="space-y-2">
        {times.map((time, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(index, e.target.value)}
              className="flex-1"
              required
              aria-label={`Horaire ${index + 1}`}
            />
            {times.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemoveTime(index)}
                aria-label={`Supprimer l'horaire ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onAddTime} 
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Ajouter un horaire
        </Button>
      </div>
    </div>
  );
}
