/**
 * Service User Preferences - Gestion des préférences utilisateur
 * Derviche Diffusion
 * 
 * Stocke et récupère les préférences utilisateur depuis Supabase
 * Exemples: colonnes visibles, paramètres UI, etc.
 * 
 * Note: Les casts `as any` sont nécessaires car la table user_preferences
 * n'est pas encore dans les types Supabase auto-générés.
 * TODO: Regénérer les types avec `npx supabase gen types typescript`
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Clés de préférences disponibles */
export type PreferenceKey = 
  | 'admin_reservations_columns'
  | 'admin_reservations_page_size'
  | 'admin_shows_columns'
  | 'company_reservations_columns'
  | 'theme'
  | string; // Extensible

/** Résultat d'une opération sur les préférences */
export interface PreferenceResult<T> {
  data: T | null;
  error: string | null;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère une préférence utilisateur
 */
export async function getUserPreference<T>(
  key: PreferenceKey
): Promise<PreferenceResult<T>> {
  try {
    const supabase = createClient();

    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('user_preferences')
      .select('preference_value')
      .eq('user_id', user.id)
      .eq('preference_key', key)
      .single();

    if (error) {
      // PGRST116 = not found, ce n'est pas une erreur
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      logger.error('Erreur récupération préférence', { key, error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data.preference_value as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getUserPreference', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Enregistre une préférence utilisateur (crée ou met à jour)
 */
export async function setUserPreference<T>(
  key: PreferenceKey,
  value: T
): Promise<PreferenceResult<T>> {
  try {
    const supabase = createClient();

    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // Upsert (insert or update)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('user_preferences')
      .upsert({
        user_id: user.id,
        preference_key: key,
        preference_value: value as unknown,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,preference_key',
      })
      .select('preference_value')
      .single();

    if (error) {
      logger.error('Erreur sauvegarde préférence', { key, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info('Préférence sauvegardée', { key });
    return { data: data.preference_value as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setUserPreference', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Supprime une préférence utilisateur
 */
export async function deleteUserPreference(
  key: PreferenceKey
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('user_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('preference_key', key);

    if (error) {
      logger.error('Erreur suppression préférence', { key, error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('Préférence supprimée', { key });
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteUserPreference', { key, message });
    return { success: false, error: message };
  }
}

/**
 * Récupère toutes les préférences d'un utilisateur
 */
export async function getAllUserPreferences(): Promise<{
  data: Record<string, unknown>;
  error: string | null;
}> {
  try {
    const supabase = createClient();

    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: {}, error: 'Utilisateur non connecté' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('user_preferences')
      .select('preference_key, preference_value')
      .eq('user_id', user.id);

    if (error) {
      logger.error('Erreur récupération toutes préférences', { error: error.message });
      return { data: {}, error: error.message };
    }

    // Transformer en objet clé-valeur
    const preferences: Record<string, unknown> = {};
    (data || []).forEach((row: { preference_key: string; preference_value: unknown }) => {
      preferences[row.preference_key] = row.preference_value;
    });

    return { data: preferences, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAllUserPreferences', { message });
    return { data: {}, error: message };
  }
}
