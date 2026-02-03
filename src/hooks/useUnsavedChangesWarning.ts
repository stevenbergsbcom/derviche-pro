/**
 * Hook useUnsavedChangesWarning
 * Affiche un avertissement navigateur si l'utilisateur tente de quitter avec des modifications non sauvegardées
 * Derviche Diffusion
 */

'use client';

import { useEffect } from 'react';

/**
 * Hook pour avertir l'utilisateur avant de quitter la page s'il y a des modifications non sauvegardées.
 * Gère l'événement beforeunload du navigateur (fermeture d'onglet, actualisation, navigation externe).
 * 
 * @param hasUnsavedChanges - Indique si des modifications sont en attente
 * @param message - Message personnalisé (non affiché par les navigateurs modernes mais requis)
 * 
 * @note Si vous passez un message personnalisé, utilisez une constante ou une ref
 * pour éviter de ré-enregistrer le listener à chaque render.
 * 
 * @example
 * ```tsx
 * // Utilisation simple (message par défaut)
 * useUnsavedChangesWarning(hasChanges);
 * 
 * // Avec message personnalisé (utiliser une constante)
 * const MESSAGE = 'Vos modifications seront perdues.';
 * useUnsavedChangesWarning(hasChanges, MESSAGE);
 * ```
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  message: string = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?'
) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Chrome requiert returnValue, même si le message n'est plus affiché
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);
}
