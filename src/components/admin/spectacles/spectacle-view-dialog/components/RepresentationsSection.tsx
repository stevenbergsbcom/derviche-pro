/**
 * Section représentations
 * Derviche Diffusion - Session 110
 */

import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RepresentationsSectionProps } from '../types';
import { formatRepresentationsCount } from '../utils';

export function RepresentationsSection({
  representationsCount,
  onNavigate,
}: RepresentationsSectionProps) {
  const hasRepresentations = representationsCount > 0;
  const countText = formatRepresentationsCount(representationsCount);

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/10">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" aria-hidden="true" />
        Représentations
      </h3>
      <div className="space-y-3">
        {hasRepresentations ? (
          <>
            <p className="text-sm text-foreground">{countText}</p>
            <Button
              variant="outline"
              onClick={onNavigate}
              className="w-full sm:w-auto"
            >
              Voir les représentations
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground italic">{countText}</p>
            <Button
              variant="outline"
              onClick={onNavigate}
              className="w-full sm:w-auto"
            >
              Ajouter des représentations
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
