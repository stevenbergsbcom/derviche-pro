/**
 * Paramètres page d'accueil
 * Derviche Diffusion
 */

import type {
  AppSettingResult,
  HomepageSettings,
  HomepageHero,
  HomepageAvantages,
  HomepageSpectacles,
  HomepageImpact,
  HomepageContact,
  HomepageFooter,
} from './types';
import { HOMEPAGE_SETTING_KEYS, HOMEPAGE_DEFAULTS } from './constants';
import { getAppSettings, setAppSettings } from './core';

/**
 * Récupère les paramètres de la page d'accueil
 * Chaque clé est un objet JSON structuré, avec fallback sur HOMEPAGE_DEFAULTS
 */
export async function getHomepageSettings(): Promise<AppSettingResult<HomepageSettings>> {
  const result = await getAppSettings(HOMEPAGE_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      homepage_hero:
        (result.data?.homepage_hero as HomepageHero) ?? HOMEPAGE_DEFAULTS.homepage_hero,
      homepage_avantages:
        (result.data?.homepage_avantages as HomepageAvantages) ??
        HOMEPAGE_DEFAULTS.homepage_avantages,
      homepage_spectacles:
        (result.data?.homepage_spectacles as HomepageSpectacles) ??
        HOMEPAGE_DEFAULTS.homepage_spectacles,
      homepage_impact: {
        ...HOMEPAGE_DEFAULTS.homepage_impact,
        ...((result.data?.homepage_impact as Partial<HomepageImpact>) ?? {}),
      },
      homepage_contact:
        (result.data?.homepage_contact as HomepageContact) ??
        HOMEPAGE_DEFAULTS.homepage_contact,
      homepage_footer:
        (result.data?.homepage_footer as HomepageFooter) ?? HOMEPAGE_DEFAULTS.homepage_footer,
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres de la page d'accueil
 */
export async function setHomepageSettings(
  settings: Partial<HomepageSettings>
): Promise<AppSettingResult<HomepageSettings>> {
  const result = await setAppSettings(settings);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return getHomepageSettings();
}
