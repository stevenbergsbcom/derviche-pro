/**
 * Hook useLegalSettings — Paramètres des pages légales
 * Derviche Diffusion — S186
 *
 * Gère les 3 pages : Mentions légales, Politique de confidentialité, CGU
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getLegalSettings,
  setLegalSettings as saveLegalSettings,
  type LegalSettings,
} from '@/lib/services/app-settings';
import type { UseAppSettingsReturn } from './types';

/**
 * Hook pour gérer les paramètres des pages légales
 * Gère les 3 pages : Mentions légales, Politique de confidentialité, CGU
 */
export function useLegalSettings(): UseAppSettingsReturn<LegalSettings> {
  const [data, setData] = useState<LegalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter le problème de closure stale
  const dataRef = useRef<LegalSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Charger les paramètres
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getLegalSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Mettre à jour les paramètres
  const update = useCallback(
    async (
      newValue: Partial<LegalSettings>
    ): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      // Mise à jour optimiste
      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await saveLegalSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        // Rollback en cas d'erreur
        setData(previousValue);
        return { success: false, error: result.error };
      }

      // Mettre à jour avec les données retournées
      if (result.data) {
        setData(result.data);
      }

      return { success: true };
    },
    []
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    update,
    refresh: load,
  };
}
