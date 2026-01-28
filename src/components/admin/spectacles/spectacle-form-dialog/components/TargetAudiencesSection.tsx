/**
 * Section publics cibles
 * Derviche Diffusion - Session 101
 */

'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';
import type { TargetAudiencesSectionProps } from '../types';

export function TargetAudiencesSection({
  targetAudienceIds,
  targetAudiences,
  onTargetAudienceChange,
  onOpenTargetAudiencesManager,
}: TargetAudiencesSectionProps) {
  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Publics cibles</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenTargetAudiencesManager}
          >
            <Settings className="w-4 h-4 mr-2" />
            Gérer
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Sélectionnez un ou plusieurs publics cibles pour ce spectacle.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {targetAudiences.map((targetAudience) => (
            <div key={targetAudience.id} className="flex items-center space-x-2">
              <Checkbox
                id={`target-audience-${targetAudience.id}`}
                checked={targetAudienceIds.includes(targetAudience.id)}
                onCheckedChange={(checked) => {
                  onTargetAudienceChange(targetAudience.id, checked === true);
                }}
              />
              <Label
                htmlFor={`target-audience-${targetAudience.id}`}
                className="font-normal cursor-pointer"
              >
                {targetAudience.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
