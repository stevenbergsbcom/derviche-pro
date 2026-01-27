/**
 * Composant ErrorState - État d'erreur réutilisable
 * Derviche Diffusion
 */

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

export interface ErrorStateProps {
  /** Message d'erreur à afficher */
  message: string;
  /** Callback pour réessayer (optionnel) */
  onRetry?: () => void;
  /** Texte du bouton retry (défaut: "Réessayer") */
  retryLabel?: string;
  /** Contenu additionnel au-dessus de l'erreur (ex: header) */
  children?: ReactNode;
}

/**
 * Affiche un état d'erreur avec option de retry
 * 
 * @example
 * ```tsx
 * <ErrorState 
 *   message="Erreur lors du chargement" 
 *   onRetry={refresh}
 * >
 *   <AdminPageHeader title="Utilisateurs" />
 * </ErrorState>
 * ```
 */
export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Réessayer',
  children,
}: ErrorStateProps) {
  return (
    <div className="space-y-6">
      {children}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          {message}
          {onRetry && (
            <Button 
              variant="link" 
              onClick={onRetry} 
              className="ml-2 p-0 h-auto"
              aria-label={retryLabel}
            >
              {retryLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
