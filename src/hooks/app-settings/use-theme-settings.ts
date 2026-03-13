/**
 * Hook useThemeSettings — Paramètres de thème
 * Derviche Diffusion — S186
 *
 * Applique automatiquement le thème au chargement et à la mise à jour.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getThemeSettings,
  setThemeSettings as saveThemeSettings,
  type ThemeSettings,
} from '@/lib/services/app-settings';
import {
  applyThemeAuto,
  applyThemeColors,
  generateCustomTheme,
  isDarkModeActive,
  DEFAULT_CUSTOM_SEEDS,
  type CustomThemeSeeds,
} from '@/lib/theme';
import type { UseAppSettingsReturn } from './types';

/**
 * Applique le thème custom (depuis les seeds) ou un preset standard
 */
function applyCustomOrPresetTheme(
  presetId: string,
  seeds: { primary: string; accent: string; sidebar: string } | null | undefined
): void {
  if (presetId === 'custom') {
    const effectiveSeeds = seeds ?? DEFAULT_CUSTOM_SEEDS;
    const palette = generateCustomTheme(effectiveSeeds as CustomThemeSeeds);
    const colors = isDarkModeActive() ? palette.dark : palette.light;
    applyThemeColors(colors, 'custom');
  } else {
    applyThemeAuto(presetId);
  }
}

/**
 * Hook pour gérer les paramètres de thème
 * Applique automatiquement le thème au chargement et à la mise à jour
 */
export function useThemeSettings(): UseAppSettingsReturn<ThemeSettings> {
  const [data, setData] = useState<ThemeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<ThemeSettings | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getThemeSettings();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
      // Appliquer le thème au chargement
      if (result.data?.theme_preset) {
        applyCustomOrPresetTheme(result.data.theme_preset, result.data.custom_theme_colors);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (newValue: Partial<ThemeSettings>): Promise<{ success: boolean; error?: string }> => {
      const previousValue = dataRef.current;

      if (previousValue) {
        setData({ ...previousValue, ...newValue });
      }

      // Appliquer le thème immédiatement (optimiste)
      if (newValue.theme_preset) {
        const seeds = newValue.custom_theme_colors ?? previousValue?.custom_theme_colors ?? null;
        applyCustomOrPresetTheme(newValue.theme_preset, seeds);
      }

      setIsSaving(true);
      const result = await saveThemeSettings(newValue);
      setIsSaving(false);

      if (result.error) {
        // Rollback en cas d'erreur
        setData(previousValue);
        if (previousValue?.theme_preset) {
          applyCustomOrPresetTheme(
            previousValue.theme_preset,
            previousValue.custom_theme_colors
          );
        }
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
