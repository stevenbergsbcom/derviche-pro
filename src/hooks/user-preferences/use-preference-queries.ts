'use client';

/**
 * Hook de lecture des preferences utilisateur
 * Derviche Diffusion
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getUserPreference,
  setUserPreference,
  type PreferenceKey,
} from '@/lib/services/user-preferences';
import type { UseUserPreferenceReturn } from './types';

/**
 * Hook pour charger une preference utilisateur depuis Supabase
 *
 * @param key - Cle de la preference
 * @param defaultValue - Valeur par defaut si non definie
 */
export function useUserPreference<T>(
  key: PreferenceKey,
  defaultValue: T
): UseUserPreferenceReturn<T> {
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour eviter le probleme de closure stale dans setValue
  const valueRef = useRef<T>(defaultValue);

  // Garder la ref synchronisee avec la valeur
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Charger la preference au montage
  const loadPreference = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getUserPreference<T>(key);

    if (result.error) {
      setError(result.error);
      // Garder la valeur par defaut en cas d'erreur
    } else if (result.data !== null) {
      setValueState(result.data);
    }
    // Si null sans erreur, garder defaultValue

    setIsLoading(false);
  }, [key]);

  useEffect(() => {
    void loadPreference();
  }, [loadPreference]);

  // Mettre a jour la preference
  const setValue = useCallback(async (
    newValue: T
  ): Promise<{ success: boolean; error?: string }> => {
    // Capturer la valeur precedente depuis la ref (pas de stale closure)
    const previousValue = valueRef.current;

    // Mise a jour optimiste
    setValueState(newValue);

    const result = await setUserPreference<T>(key, newValue);

    if (result.error) {
      // Rollback en cas d'erreur
      setValueState(previousValue);
      return { success: false, error: result.error };
    }

    return { success: true };
  }, [key]);

  // Rafraichir depuis Supabase
  const refresh = useCallback(async () => {
    await loadPreference();
  }, [loadPreference]);

  return {
    value,
    isLoading,
    error,
    setValue,
    refresh,
  };
}
