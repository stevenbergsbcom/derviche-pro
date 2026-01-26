/**
 * EmptyState - État liste vide
 * Derviche Diffusion
 */

import { Theater, History } from 'lucide-react';
import type { EmptyStateProps } from '../types';

export function EmptyState({ activeTab }: EmptyStateProps) {
  const isUpcoming = activeTab === 'upcoming';
  
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-label={isUpcoming ? 'Aucune représentation à venir' : 'Aucune représentation passée'}
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        {isUpcoming ? (
          <Theater className="w-8 h-8 text-muted-foreground/50" aria-hidden="true" />
        ) : (
          <History className="w-8 h-8 text-muted-foreground/50" aria-hidden="true" />
        )}
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">
        {isUpcoming ? 'Aucune représentation à venir' : 'Aucune représentation passée'}
      </h2>
      <p className="text-base text-muted-foreground max-w-xs">
        {isUpcoming 
          ? "Ce spectacle n'a pas de représentation à venir accessible."
          : "Ce spectacle n'a pas encore eu de représentation."
        }
      </p>
    </div>
  );
}
