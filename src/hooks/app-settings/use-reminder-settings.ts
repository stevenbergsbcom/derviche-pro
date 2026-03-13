/**
 * Hook useReminderSettings — Paramètres de rappels
 * Derviche Diffusion — S186
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getReminderSettings,
  setAppSettings,
  type ReminderSettings,
} from '@/lib/services/app-settings';
import type { UseAppSettingsReturn } from './types';

/**
 * Hook pour gérer les paramètres de rappels
 */
export function useReminderSettings(): UseAppSettingsReturn<ReminderSettings> {
  const [data, setData] = useState<ReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<ReminderSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getReminderSettings();

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
    async (newValue: Partial<ReminderSettings>): Promise<{ success: boolean; error?: string }> => {
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
