/**
 * Hook useRgpdSettings — Paramètres RGPD
 * Derviche Diffusion — S186
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getRgpdSettings,
  setAppSettings,
  type RgpdSettings,
} from '@/lib/services/app-settings';
import type { UseAppSettingsReturn } from './types';

/**
 * Hook pour gérer les paramètres RGPD
 */
export function useRgpdSettings(): UseAppSettingsReturn<RgpdSettings> {
  const [data, setData] = useState<RgpdSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<RgpdSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getRgpdSettings();

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

  const update = useCallback(
    async (newValue: Partial<RgpdSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        setData(previousValue);
        return { success: false, error: result.error };
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
