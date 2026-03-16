/**
 * Paramètres thème et apparence
 * Derviche Diffusion
 */

import type { AppSettingResult, ThemeSettings, CustomThemeColors } from './types';
import { THEME_SETTING_KEYS } from './constants';
import { getAppSettings, setAppSettings } from './core';

/**
 * Récupère les paramètres de thème
 * Note: Les chaînes vides sont converties en null pour les URLs
 */
export async function getThemeSettings(): Promise<AppSettingResult<ThemeSettings>> {
  const result = await getAppSettings(THEME_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Convertir les chaînes vides en null pour les URLs
  const logoWhite = result.data?.logo_white_url as string | undefined;
  const logoDark = result.data?.logo_dark_url as string | undefined;

  // Récupérer les couleurs custom (objet JSON ou null)
  const rawCustomColors = result.data?.custom_theme_colors;
  let customColors: CustomThemeColors | null = null;
  if (rawCustomColors && typeof rawCustomColors === 'object' && !Array.isArray(rawCustomColors)) {
    const obj = rawCustomColors as Record<string, unknown>;
    const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
    const p = String(obj.primary);
    const a = String(obj.accent);
    const s = String(obj.sidebar);
    if (HEX_REGEX.test(p) && HEX_REGEX.test(a) && HEX_REGEX.test(s)) {
      customColors = { primary: p, accent: a, sidebar: s };
    }
  }

  return {
    data: {
      theme_preset: (result.data?.theme_preset as string) ?? 'classic',
      logo_white_url: logoWhite && logoWhite.trim() !== '' ? logoWhite : null,
      logo_dark_url: logoDark && logoDark.trim() !== '' ? logoDark : null,
      custom_theme_colors: customColors,
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres de thème
 * Note: Les URLs null sont converties en chaînes vides pour respecter la contrainte NOT NULL
 */
export async function setThemeSettings(
  settings: Partial<ThemeSettings>
): Promise<AppSettingResult<ThemeSettings>> {
  // Convertir les null en chaînes vides pour les URLs (contrainte NOT NULL sur value)
  // et les objets en JSON pour custom_theme_colors
  const sanitizedSettings: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    if ((key === 'logo_white_url' || key === 'logo_dark_url') && value === null) {
      sanitizedSettings[key] = '';
    } else {
      sanitizedSettings[key] = value;
    }
  }

  const result = await setAppSettings(sanitizedSettings);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return getThemeSettings();
}
