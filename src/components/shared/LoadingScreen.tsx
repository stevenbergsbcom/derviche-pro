/**
 * Composant d'écran de chargement partagé
 * @module shared/LoadingScreen
 */

'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  /** Message à afficher (par défaut: "Chargement de votre espace...") */
  message?: string;
}

/**
 * Écran de chargement plein page
 * Utilisé pendant les vérifications d'authentification/autorisation
 */
function LoadingScreenComponent({
  message = 'Chargement de votre espace...',
}: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="space-y-4 text-center">
        <Loader2
          aria-hidden="true"
          className="mx-auto size-12 animate-spin text-gold"
        />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

LoadingScreenComponent.displayName = 'LoadingScreen';

export const LoadingScreen = memo(LoadingScreenComponent);
