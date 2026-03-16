/**
 * Fonctions d'écriture pour les utilisateurs internes et compagnies
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';
import type { InternalRole } from '@/types/database';
import type { UserResult } from './types';
import { getInternalUserById } from './list';

// ============================================
// FONCTIONS D'ÉCRITURE
// ============================================

/**
 * Met à jour le rôle d'un utilisateur interne
 * Note: La création d'utilisateurs se fait via Supabase Auth
 */
export async function updateInternalUserRole(
  userId: string,
  newRole: InternalRole
): Promise<UserResult> {
  try {
    logger.info('internal-users.updateInternalUserRole - Mise à jour', { userId, newRole });

    const supabase = createClient();

    // Vérifier que l'utilisateur existe et a un rôle interne
    const existingUser = await getInternalUserById(userId);
    if (existingUser.error || !existingUser.data) {
      return { data: null, error: existingUser.error || 'Utilisateur non trouvé' };
    }

    // Mettre à jour le rôle dans user_roles
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      logger.error('internal-users.updateInternalUserRole - Erreur Supabase', { error });
      return { data: null, error: error.message };
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await getInternalUserById(userId);
    logger.info('internal-users.updateInternalUserRole - Succès', { userId, newRole });
    logActivityClient({
      category: 'system',
      action: 'user_role_update',
      success: true,
      details: {
        user_id: userId,
        new_role: newRole,
        user_name: updatedUser.data ? `${updatedUser.data.first_name ?? ''} ${updatedUser.data.last_name ?? ''}`.trim() : undefined,
      },
    });
    return updatedUser;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.updateInternalUserRole - Exception', { error: message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour le profil d'un utilisateur interne (prénom, nom, téléphone)
 */
export async function updateInternalUserProfile(
  userId: string,
  updates: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  }
): Promise<UserResult> {
  try {
    logger.info('internal-users.updateInternalUserProfile - Mise à jour', { userId, updates });

    const supabase = createClient();

    // Vérifier que l'utilisateur existe et a un rôle interne
    const existingUser = await getInternalUserById(userId);
    if (existingUser.error || !existingUser.data) {
      return { data: null, error: existingUser.error || 'Utilisateur non trouvé' };
    }

    // Mettre à jour le profil
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      logger.error('internal-users.updateInternalUserProfile - Erreur Supabase', { error });
      return { data: null, error: error.message };
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await getInternalUserById(userId);
    logger.info('internal-users.updateInternalUserProfile - Succès', { userId });
    logActivityClient({
      category: 'system',
      action: 'user_profile_update',
      success: true,
      details: {
        user_id: userId,
        user_name: updatedUser.data ? `${updatedUser.data.first_name ?? ''} ${updatedUser.data.last_name ?? ''}`.trim() : undefined,
      },
    });
    return updatedUser;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('internal-users.updateInternalUserProfile - Exception', { error: message });
    return { data: null, error: message };
  }
}
