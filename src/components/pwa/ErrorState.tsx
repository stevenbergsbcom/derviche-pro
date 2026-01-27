/**
 * ErrorState - Composant générique pour états d'erreur
 * Derviche Diffusion - PWA
 * 
 * Usage :
 * <ErrorState 
 *   message="Une erreur est survenue lors du chargement."
 *   onRetry={() => fetchData()}
 * />
 */

'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ErrorStateProps } from './types';

/**
 * Affiche une erreur avec possibilité de réessayer
 * Inclut les attributs ARIA pour l'accessibilité
 */
export function ErrorState({ 
  message, 
  onRetry, 
  title = 'Erreur de chargement' 
}: ErrorStateProps) {
  /**
   * Gère le clic sur le bouton retry
   * Supporte les callbacks sync et async
   */
  const handleRetry = () => {
    void onRetry();
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-derviche-dark mb-2">{title}</h2>
      <p className="text-base text-muted-foreground max-w-xs mb-4">{message}</p>
      <Button 
        onClick={handleRetry} 
        variant="outline" 
        size="sm"
        aria-label="Réessayer le chargement"
      >
        <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
        Réessayer
      </Button>
    </div>
  );
}
