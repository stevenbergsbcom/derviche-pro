/**
 * Hook useNotificationSettings — Paramètres de notifications email admin
 * Derviche Diffusion — S186
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getNotificationSettings,
  setAppSettings,
  type NotificationSettings,
} from '@/lib/services/app-settings';
import type { UseAppSettingsReturn } from './types';

/**
 * Hook pour gérer les paramètres de notifications email admin
 * Config globale, modifiable par super-admin uniquement
 */
export function useNotificationSettings(): UseAppSettingsReturn<NotificationSettings> {
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<NotificationSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getNotificationSettings();

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
    async (
      newValue: Partial<NotificationSettings>
    ): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      setIsSaving(true);
      const result = await setAppSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        // Rollback uniquement si on avait des données chargées
        if (previousValue !== null) {
          setData(previousValue);
        }
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
