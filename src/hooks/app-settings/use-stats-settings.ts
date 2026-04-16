/**
 * Hook useStatsSettings — Préférences statistiques admin
 * Derviche Diffusion — Phase 4A
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getStatsSettings,
  setStatsSettings,
  type StatsSettings,
} from '@/lib/services/app-settings';
import type { UseAppSettingsReturn } from './types';

/**
 * Hook pour gérer les préférences statistiques admin
 * Utilisé dans l'onglet « Statistiques » de /admin/preferences
 */
export function useStatsSettings(): UseAppSettingsReturn<StatsSettings> {
  const [data, setData] = useState<StatsSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getStatsSettings();

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setData(result.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (
      newValue: Partial<StatsSettings>,
    ): Promise<{ success: boolean; error?: string }> => {
      setIsSaving(true);

      const result = await setStatsSettings(newValue);

      setIsSaving(false);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setData(result.data);
      }

      return { success: true };
    },
    [],
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
