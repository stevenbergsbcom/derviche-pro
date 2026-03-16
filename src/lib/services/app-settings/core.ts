/**
 * Fonctions CRUD génériques pour les paramètres de l'application
 * Derviche Diffusion
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Json } from './types';
import type { AppSettingKey, AppSettingRow, AppSettingResult } from './types';

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère un paramètre global
 */
export async function getAppSetting<T>(key: AppSettingKey): Promise<AppSettingResult<T>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      // PGRST116 = not found
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      logger.error('Erreur récupération paramètre', { key, error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data.value as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAppSetting', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour un paramètre global (super-admin uniquement)
 */
export async function setAppSetting<T>(key: AppSettingKey, value: T): Promise<AppSettingResult<T>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .update({ value: value as Json })
      .eq('key', key)
      .select('value')
      .single();

    if (error) {
      logger.error('Erreur mise à jour paramètre', { key, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info('Paramètre mis à jour', { key });
    return { data: data.value as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setAppSetting', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Récupère plusieurs paramètres en une seule requête
 */
export async function getAppSettings(
  keys: AppSettingKey[]
): Promise<AppSettingResult<Record<string, unknown>>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      logger.error('Erreur récupération paramètres', { keys, error: error.message });
      return { data: null, error: error.message };
    }

    // Transformer en objet clé-valeur
    const settings: Record<string, unknown> = {};
    (data || []).forEach((row: { key: string; value: unknown }) => {
      settings[row.key] = row.value;
    });

    return { data: settings, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAppSettings', { keys, message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour plusieurs paramètres en une seule transaction
 */
export async function setAppSettings(
  settings: Record<string, unknown>
): Promise<AppSettingResult<Record<string, unknown>>> {
  try {
    const supabase = createClient();
    const keys = Object.keys(settings);
    const errors: string[] = [];

    // Mettre à jour chaque paramètre
    for (const key of keys) {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: settings[key] as Json })
        .eq('key', key);

      if (error) {
        errors.push(`${key}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      logger.error('Erreurs mise à jour paramètres', { errors });
      return { data: null, error: errors.join(', ') };
    }

    logger.info('Paramètres mis à jour', { keys });
    return { data: settings, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setAppSettings', { message });
    return { data: null, error: message };
  }
}

/**
 * Récupère tous les paramètres
 */
export async function getAllAppSettings(): Promise<AppSettingResult<AppSettingRow[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('id, key, value, description, updated_at')
      .order('key');

    if (error) {
      logger.error('Erreur récupération tous les paramètres', { error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data as AppSettingRow[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAllAppSettings', { message });
    return { data: null, error: message };
  }
}
