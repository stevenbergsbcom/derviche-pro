/**
 * PreferencesDirtyProvider
 * Derviche Diffusion
 *
 * Monté dans `/admin/layout.tsx` pour que la sidebar et la page preferences
 * partagent la même source de vérité sur l'état dirty.
 *
 * Responsabilités :
 *  - maintenir un Record<sectionId, boolean> des sections dirty
 *  - exposer `requestNavigation(href)` — déclenche le dialog si dirty
 *  - rendre le `UnsavedChangesDialog` centralisé
 *  - câbler `useUnsavedChangesWarning` sur le flag agrégé (beforeunload browser)
 */

'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { UnsavedChangesDialog } from '@/app/admin/preferences/components/shared';
import {
  PreferencesDirtyContext,
  type PreferencesDirtyContextValue,
} from './context';

interface PreferencesDirtyProviderProps {
  children: ReactNode;
}

export function PreferencesDirtyProvider({ children }: PreferencesDirtyProviderProps) {
  const router = useRouter();
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const hasUnsavedChanges = useMemo(
    () => Object.values(dirtyMap).some(Boolean),
    [dirtyMap],
  );

  // beforeunload natif (recharge page / fermeture onglet)
  useUnsavedChangesWarning(hasUnsavedChanges);

  const setDirty = useCallback((sectionId: string, isDirty: boolean) => {
    setDirtyMap((prev) => {
      if (prev[sectionId] === isDirty) return prev;
      return { ...prev, [sectionId]: isDirty };
    });
  }, []);

  const resetAll = useCallback(() => {
    setDirtyMap({});
  }, []);

  const requestNavigation = useCallback(
    (href: string) => {
      if (hasUnsavedChanges) {
        setPendingHref(href);
      } else {
        router.push(href);
      }
    },
    [hasUnsavedChanges, router],
  );

  const handleConfirm = useCallback(() => {
    if (pendingHref) {
      resetAll();
      router.push(pendingHref);
      setPendingHref(null);
    }
  }, [pendingHref, resetAll, router]);

  const handleCancel = useCallback(() => {
    setPendingHref(null);
  }, []);

  const value = useMemo<PreferencesDirtyContextValue>(
    () => ({ hasUnsavedChanges, setDirty, resetAll, requestNavigation }),
    [hasUnsavedChanges, setDirty, resetAll, requestNavigation],
  );

  return (
    <PreferencesDirtyContext.Provider value={value}>
      {children}
      <UnsavedChangesDialog
        open={pendingHref !== null}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </PreferencesDirtyContext.Provider>
  );
}
