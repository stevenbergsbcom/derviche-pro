/**
 * État vide - Aucun spectacle
 * Derviche Diffusion - PWA Check-in
 */

import { Theater } from 'lucide-react';
import type { EmptyStateProps } from '../types';

/**
 * Affiche un message quand aucun spectacle n'est disponible
 */
export function EmptyState({ isAdmin }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-label="Aucun spectacle disponible"
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Theater className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">Aucun spectacle</h2>
      <p className="text-base text-muted-foreground max-w-xs">
        {isAdmin
          ? 'Aucun spectacle avec des représentations à venir.'
          : "Vous n'êtes assigné à aucune représentation à venir."}
      </p>
    </div>
  );
}
