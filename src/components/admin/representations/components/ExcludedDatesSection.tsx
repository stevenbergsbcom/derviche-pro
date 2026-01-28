/**
 * Composant ExcludedDatesSection - Gestion des dates exclues
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { ExcludedDatesSectionProps } from '../types';

export function ExcludedDatesSection({
  excludedDates,
  onExcludedDateChange,
  onAddExcludedDate,
  onRemoveExcludedDate,
}: ExcludedDatesSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Dates à exclure</Label>
      <p className="text-xs text-muted-foreground">
        Jours fériés, relâches exceptionnelles...
      </p>
      <div className="space-y-2">
        {excludedDates.map((date, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => onExcludedDateChange(index, e.target.value)}
              className="flex-1"
              aria-label={`Date exclue ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemoveExcludedDate(index)}
              aria-label={`Supprimer la date exclue ${index + 1}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onAddExcludedDate} 
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Ajouter une exclusion
        </Button>
      </div>
    </div>
  );
}
