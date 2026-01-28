/**
 * Composant PreviewSection - Aperçu des représentations générées
 */

import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { AlertBanner } from './AlertBanner';
import { formatDateFr } from '../utils';
import type { PreviewSectionProps } from '../types';

export function PreviewSection({
  generatedRepresentations,
  exactDuplicatesCount,
  conflictsCount,
  includeExactDuplicates,
  includeConflicts,
  onIncludeExactDuplicatesChange,
  onIncludeConflictsChange,
}: PreviewSectionProps) {
  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">
          Aperçu : {generatedRepresentations.length} représentation{generatedRepresentations.length > 1 ? 's' : ''}
        </h3>
      </div>

      {/* Alerte doublons exacts */}
      {exactDuplicatesCount > 0 && (
        <AlertBanner
          variant="error"
          title={`${exactDuplicatesCount} représentation${exactDuplicatesCount > 1 ? 's' : ''} existe${exactDuplicatesCount > 1 ? 'nt' : ''} déjà (même lieu)`}
          checkboxLabel="Inclure les doublons existants"
          checkboxId="includeExactDuplicates"
          checked={includeExactDuplicates}
          onCheckedChange={onIncludeExactDuplicatesChange}
        />
      )}

      {/* Alerte conflits */}
      {conflictsCount > 0 && (
        <AlertBanner
          variant="warning"
          title={`${conflictsCount} créneau${conflictsCount > 1 ? 'x' : ''} en conflit (autre lieu, même horaire)`}
          checkboxLabel="Inclure les créneaux en conflit"
          checkboxId="includeConflicts"
          checked={includeConflicts}
          onCheckedChange={onIncludeConflictsChange}
        />
      )}

      {/* Liste des représentations */}
      {generatedRepresentations.length > 0 ? (
        <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-3 bg-muted/50">
          {generatedRepresentations.map((rep) => {
            const willBeCreated =
              rep.status === 'ok' ||
              (rep.status === 'exact_duplicate' && includeExactDuplicates) ||
              (rep.status === 'conflict' && includeConflicts);

            // Classes conditionnelles
            const statusClasses = {
              exact_duplicate: 'text-red-700',
              conflict: 'text-orange-700',
              ok: 'text-foreground',
            };

            return (
              <div
                key={`${rep.date}-${rep.time}-${rep.venueId}`}
                className={`text-sm flex items-center gap-2 ${statusClasses[rep.status]} ${!willBeCreated ? 'opacity-50 line-through' : ''}`}
              >
                <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{formatDateFr(rep.date)} à {rep.time}</span>
                
                {rep.status === 'exact_duplicate' && (
                  <Badge 
                    variant="outline" 
                    className="ml-auto text-xs bg-red-100 text-red-700 border-red-300"
                  >
                    Existant
                  </Badge>
                )}
                {rep.status === 'conflict' && (
                  <Badge 
                    variant="outline" 
                    className="ml-auto text-xs bg-orange-100 text-orange-700 border-orange-300"
                  >
                    Conflit
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic p-3 border rounded-md bg-muted/50">
          Aucune représentation générée. Remplissez les champs requis pour voir l&apos;aperçu.
        </div>
      )}
    </div>
  );
}
