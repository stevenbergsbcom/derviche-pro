/**
 * Service User Preferences - Gestion des préférences utilisateur
 * Derviche Diffusion
 * 
 * Stocke et récupère les préférences utilisateur depuis Supabase
 * Exemples: colonnes visibles, paramètres UI, etc.
 * 
 * Utilise la table user_preferences (types générés dans supabase.ts).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Json } from '@/types/supabase';

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

    // .maybeSingle() retourne null sans erreur si 0 ligne (vs .single() qui retourne 406)
    const { data, error } = await supabase.from('user_preferences')
      .select('preference_value')
      .eq('user_id', user.id)
      .eq('preference_key', key)
      .maybeSingle();

    if (error) {
      logger.error('Erreur récupération préférence', { key, error: error.message });
      return { data: null, error: error.message };
    }

    // data est null si aucune préférence enregistrée → le hook utilisera defaultValue
    return { data: (data?.preference_value as T) ?? null, error: null };
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

    // Upsert sans .select().single() — évite le 406 quand la ligne n'existait pas encore
    const { error } = await supabase.from('user_preferences')
      .upsert({
        user_id: user.id,
        preference_key: key,
        preference_value: value as unknown as Json,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,preference_key',
      });

    if (error) {
      logger.error('Erreur sauvegarde préférence', { key, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info('Préférence sauvegardée', { key });
    // On retourne la valeur qu'on vient d'écrire (pas besoin de relire la DB)
    return { data: value, error: null };
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

    const { error } = await supabase.from('user_preferences')
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

    const { data, error } = await supabase.from('user_preferences')
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
