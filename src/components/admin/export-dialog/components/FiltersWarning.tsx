/**
 * Avertissement affiché quand des filtres de la page sont actifs
 * Informe l'utilisateur que l'export respectera ces filtres
 */

import { memo } from 'react';
import { ListFilter } from 'lucide-react';
import type { FiltersWarningProps } from '../types';

// ============================================
// COMPOSANT
// ============================================

export const FiltersWarning = memo(function FiltersWarning({ visible }: FiltersWarningProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800"
      role="alert"
      aria-label="Avertissement : filtres actifs"
    >
      <ListFilter className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium">Filtres de la page actifs</p>
        <p className="text-amber-700 text-xs mt-0.5">
          L&apos;export respectera les filtres appliqués sur la page
          (spectacle, statut, recherche, dates).
        </p>
      </div>
    </div>
  );
});

FiltersWarning.displayName = 'FiltersWarning';
