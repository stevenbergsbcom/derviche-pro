/**
 * Paramètres de saison (dashboard)
 * Derviche Diffusion
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { AppSettingResult, SeasonSettings } from './types';
import { SEASON_SETTING_KEYS, SEASON_DEFAULTS } from './constants';
import { getAppSettings } from './core';

/**
 * Récupère les paramètres de saison
 */
export async function getSeasonSettings(): Promise<AppSettingResult<SeasonSettings>> {
  const result = await getAppSettings(SEASON_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Strip des guillemets JSONB si nécessaire
  const strip = (val: unknown, fallback: string): string => {
    if (!val) return fallback;
    return String(val).replace(/^"|"$/g, '') || fallback;
  };

  return {
    data: {
      season_start: strip(result.data?.season_start, SEASON_DEFAULTS.season_start),
      season_end: strip(result.data?.season_end, SEASON_DEFAULTS.season_end),
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres de saison.
 * Utilise upsert pour garantir la création si les clés n'existent pas.
 */
export async function setSeasonSettings(
  settings: Partial<SeasonSettings>
): Promise<AppSettingResult<SeasonSettings>> {
  try {
    const supabase = createClient();
    const entries = Object.entries(settings) as [string, string][];
    const errors: string[] = [];

    for (const [key, value] of entries) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) {
        logger.error('Erreur upsert season setting', { key, error: error.message });
        errors.push(`${key}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return { data: null, error: errors.join(', ') };
    }

    logger.info('Paramètres saison mis à jour', { keys: Object.keys(settings) });
    return getSeasonSettings();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setSeasonSettings', { message });
    return { data: null, error: message };
  }
}
