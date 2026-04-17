/**
 * Paramètres statistiques admin (/admin/statistiques)
 * Derviche Diffusion — Phase 4A
 *
 * Stocke les défauts workspace pour la page stats.
 * Pattern identique à `season.ts` — get + set via upsert.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { AppSettingResult, Json, StatsSettings } from './types';
import {
  STATS_DEFAULTS,
  STATS_SETTING_KEYS,
  VALID_COMPARE_PRESETS,
  VALID_EXPORT_FORMATS,
  VALID_STATS_PERIODS,
} from './constants';
import { getAppSettings } from './core';
import { parseNumber, parseStringArray, parseStringEnum } from './helpers';

// `custom` n'est pas acceptable comme période par DÉFAUT (pas de from/to
// paramétrable). On filtre l'enum valide pour ne jamais le renvoyer.
const VALID_DEFAULT_PERIODS = VALID_STATS_PERIODS.filter(
  (p) => p !== 'custom',
);

/**
 * Récupère les paramètres statistiques (avec fallback sur les défauts).
 *
 * Parse chaque setting via les helpers dédiés :
 * - period / compare preset / export format → `parseStringEnum`
 * - page size → `parseNumber` avec plage 10-100
 * - hidden columns → `parseStringArray`
 */
export async function getStatsSettings(): Promise<AppSettingResult<StatsSettings>> {
  const result = await getAppSettings(STATS_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  const raw = result.data ?? {};

  return {
    data: {
      stats_default_period: parseStringEnum(
        raw.stats_default_period,
        VALID_DEFAULT_PERIODS,
        STATS_DEFAULTS.stats_default_period,
      ),
      stats_default_page_size: parseNumber(
        raw.stats_default_page_size,
        STATS_DEFAULTS.stats_default_page_size,
        { min: 10, max: 100 },
      ),
      stats_default_compare_preset: parseStringEnum(
        raw.stats_default_compare_preset,
        VALID_COMPARE_PRESETS,
        STATS_DEFAULTS.stats_default_compare_preset,
      ),
      stats_hidden_columns_shows: parseStringArray(raw.stats_hidden_columns_shows),
      stats_hidden_columns_venues: parseStringArray(raw.stats_hidden_columns_venues),
      stats_default_export_format: parseStringEnum(
        raw.stats_default_export_format,
        VALID_EXPORT_FORMATS,
        STATS_DEFAULTS.stats_default_export_format,
      ),
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres statistiques.
 * Utilise upsert pour garantir la création si les clés n'existent pas encore.
 */
export async function setStatsSettings(
  settings: Partial<StatsSettings>,
): Promise<AppSettingResult<StatsSettings>> {
  try {
    const supabase = createClient();
    const entries = Object.entries(settings);
    const errors: string[] = [];

    for (const [key, value] of entries) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value: value as Json }, { onConflict: 'key' });

      if (error) {
        logger.error('Erreur upsert stats setting', { key, error: error.message });
        errors.push(`${key}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return { data: null, error: errors.join(', ') };
    }

    logger.info('Paramètres stats mis à jour', { keys: Object.keys(settings) });
    return getStatsSettings();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setStatsSettings', { message });
    return { data: null, error: message };
  }
}
