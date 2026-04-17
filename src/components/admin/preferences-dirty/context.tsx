/**
 * PreferencesDirtyContext — Contexte partagé pour la protection des modifs
 * non sauvegardées sur `/admin/preferences`.
 * Derviche Diffusion
 *
 * Consommé par :
 *  - `PreferencesContent` : déclare des sections dirty via `setDirty`
 *  - `ConfirmableNavLink` + `PreferencesSubmenu` : interrompent la navigation
 *    via `requestNavigation(href)` et laissent le Provider afficher le dialog.
 */

'use client';

import { createContext, useContext } from 'react';

export interface PreferencesDirtyContextValue {
  /** Vrai dès qu'au moins une section est dirty. */
  hasUnsavedChanges: boolean;
  /** Déclare/efface le flag dirty d'une section. */
  setDirty: (sectionId: string, isDirty: boolean) => void;
  /** Réinitialise toutes les sections (appelé sur confirm du dialog). */
  resetAll: () => void;
  /**
   * Demande une navigation protégée :
   *  - si dirty → ouvre le dialog, stocke l'href en attente
   *  - sinon → navigue immédiatement
   */
  requestNavigation: (href: string) => void;
}

export const PreferencesDirtyContext =
  createContext<PreferencesDirtyContextValue | null>(null);

export function usePreferencesDirty(): PreferencesDirtyContextValue {
  const ctx = useContext(PreferencesDirtyContext);
  if (!ctx) {
    throw new Error(
      'usePreferencesDirty doit être utilisé à l\'intérieur de <PreferencesDirtyProvider>',
    );
  }
  return ctx;
}
