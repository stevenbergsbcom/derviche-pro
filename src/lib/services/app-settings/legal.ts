/**
 * Paramètres pages légales
 * Derviche Diffusion
 */

import type { AppSettingResult, LegalSettings } from './types';
import { LEGAL_SETTING_KEYS, LEGAL_DEFAULTS } from './constants';
import { getAppSettings, setAppSettings } from './core';

/**
 * Récupère les paramètres des pages légales
 * Chaque clé est un texte brut, avec fallback sur LEGAL_DEFAULTS
 */
export async function getLegalSettings(): Promise<AppSettingResult<LegalSettings>> {
  const result = await getAppSettings(LEGAL_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      legal_mentions:
        (result.data?.legal_mentions as string) || LEGAL_DEFAULTS.legal_mentions,
      legal_privacy:
        (result.data?.legal_privacy as string) || LEGAL_DEFAULTS.legal_privacy,
      legal_cgu:
        (result.data?.legal_cgu as string) || LEGAL_DEFAULTS.legal_cgu,
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres des pages légales
 */
export async function setLegalSettings(
  settings: Partial<LegalSettings>
): Promise<AppSettingResult<LegalSettings>> {
  const result = await setAppSettings(settings);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return getLegalSettings();
}
