/**
 * Composant LoadingState - État de chargement réutilisable
 * Derviche Diffusion
 */

import { RefreshCw } from 'lucide-react';

export interface LoadingStateProps {
  /** Message à afficher (défaut: "Chargement...") */
  message?: string;
  /** Hauteur minimale du conteneur (défaut: 400px) */
  minHeight?: string;
}

/**
 * Affiche un état de chargement avec spinner
 * 
 * @example
 * ```tsx
 * <LoadingState message="Chargement des utilisateurs..." />
 * ```
 */
export function LoadingState({
  message = 'Chargement...',
  minHeight = '400px',
}: LoadingStateProps) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
