/**
 * EmptyState - Composant générique pour états vides
 * Derviche Diffusion - PWA
 * 
 * Usage :
 * <EmptyState 
 *   icon={Theater} 
 *   title="Aucun spectacle" 
 *   message="Aucun spectacle disponible pour le moment."
 * />
 */

'use client';

import type { EmptyStateProps } from './types';

/**
 * Affiche un état vide avec icône, titre et message personnalisables
 * Utilisé quand aucune donnée n'est disponible
 */
export function EmptyState({ icon: Icon, title, message, ariaLabel }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-label={ariaLabel ?? title}
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">{title}</h2>
      <p className="text-base text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
}
