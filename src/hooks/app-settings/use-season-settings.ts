/**
 * Hook useSeasonSettings — Paramètres de saison du dashboard
 * Derviche Diffusion — S186
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getSeasonSettings,
  setSeasonSettings,
  type SeasonSettings,
} from '@/lib/services/app-settings';
import type { UseAppSettingsReturn } from './types';

/**
 * Hook pour gérer les paramètres de saison du dashboard
 * Utilisé dans la section Organisation des préférences
 */
export function useSeasonSettings(): UseAppSettingsReturn<SeasonSettings> {
  const [data, setData] = useState<SeasonSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getSeasonSettings();

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(
    async (newValue: Partial<SeasonSettings>): Promise<{ success: boolean; error?: string }> => {
      setIsSaving(true);

      const result = await setSeasonSettings(newValue);

      setIsSaving(false);

      if (result.error) {
        return { success: false, error: result.error };
      }

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
