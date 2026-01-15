/**
 * Hook React pour la gestion des utilisateurs internes (staff)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit les utilisateurs internes (super-admin, admin, externe-dd) depuis Supabase
 * avec capacités CRUD complètes
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getInternalUsers,
  getInternalUserById,
  updateInternalUserProfile,
  updateInternalUserRole,
  formatUserName,
  formatUserNameShort,
  translateRole,
} from '@/lib/services/internal-users';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { InternalUser, InternalRole } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Données pour mettre à jour un utilisateur */
export interface UpdateUserData {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: InternalRole;
}

/** Résultat d'une opération CRUD */
export interface OperationResult {
  success: boolean;
  error?: string;
}

export interface UseInternalUsersReturn {
  /** Liste des utilisateurs internes */
  users: InternalUser[];
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Recharge la liste des utilisateurs */
  refresh: () => Promise<void>;
  /** Trouve un utilisateur par son ID */
  getUserById: (id: string) => InternalUser | undefined;
  /** Filtre les utilisateurs par rôle */
  getUsersByRole: (role: InternalRole) => InternalUser[];
  /** Met à jour un utilisateur (profil et/ou rôle) */
  update: (userId: string, data: UpdateUserData) => Promise<OperationResult>;
  /** Supprime un utilisateur interne (soft delete) */
  remove: (userId: string) => Promise<OperationResult>;
  /** Formate le nom complet d'un utilisateur */
  formatName: (user: InternalUser) => string;
  /** Formate le nom abrégé d'un utilisateur */
  formatNameShort: (user: InternalUser) => string;
  /** Traduit un rôle en français */
  translateRole: (role: InternalRole) => string;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour charger et gérer les utilisateurs internes
 * 
 * @example
 * ```tsx
 * const { users, isLoading, update, remove } = useInternalUsers();
 * 
 * // Mettre à jour un utilisateur
 * const result = await update(userId, { first_name: 'Jean', role: 'admin' });
 * 
 * // Désactiver un utilisateur
 * const result = await remove(userId);
 * ```
 */
export function useInternalUsers(): UseInternalUsersReturn {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref pour éviter les race conditions
  const loadIdRef = useRef(0);

  /**
   * Charge les utilisateurs depuis Supabase
   */
  const loadUsers = useCallback(async () => {
    const currentLoadId = ++loadIdRef.current;
    setIsLoading(true);
    setError(null);

    const result = await getInternalUsers();

    // Ignorer le résultat si un nouveau chargement a démarré
    if (currentLoadId !== loadIdRef.current) {
      return;
    }

    if (result.error) {
      setError(result.error);
      setUsers([]);
    } else {
      setUsers(result.data);
    }
    
    setIsLoading(false);
  }, []);

  /**
   * Recharge la liste (fonction exposée)
   */
  const refresh = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  /**
   * Trouve un utilisateur par son ID (dans le cache local)
   */
  const getUserById = useCallback(
    (id: string): InternalUser | undefined => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  /**
   * Filtre les utilisateurs par rôle
   */
  const getUsersByRole = useCallback(
    (role: InternalRole): InternalUser[] => {
      return users.filter((user) => user.role === role);
    },
    [users]
  );

  /**
   * Met à jour un utilisateur (profil et/ou rôle)
   */
  const update = useCallback(
    async (userId: string, data: UpdateUserData): Promise<OperationResult> => {
      try {
        logger.info('useInternalUsers.update - Mise à jour', { userId, data });

        // Mettre à jour le profil si nécessaire
        const { role, ...profileData } = data;
        const hasProfileChanges = Object.keys(profileData).length > 0;

        if (hasProfileChanges) {
          const profileResult = await updateInternalUserProfile(userId, profileData);
          if (profileResult.error) {
            logger.error('useInternalUsers.update - Erreur profil', { error: profileResult.error });
            return { success: false, error: profileResult.error };
          }
        }

        // Mettre à jour le rôle si nécessaire
        if (role) {
          const roleResult = await updateInternalUserRole(userId, role);
          if (roleResult.error) {
            logger.error('useInternalUsers.update - Erreur rôle', { error: roleResult.error });
            return { success: false, error: roleResult.error };
          }
        }

        // Rafraîchir la liste
        await loadUsers();

        logger.info('useInternalUsers.update - Succès', { userId });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useInternalUsers.update - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadUsers]
  );

  /**
   * Supprime un utilisateur interne (soft delete)
   * Vérifie d'abord que l'utilisateur est bien un utilisateur interne
   */
  const remove = useCallback(
    async (userId: string): Promise<OperationResult> => {
      try {
        logger.info('useInternalUsers.remove - Suppression', { userId });

        // Vérifier que l'utilisateur existe et est bien un utilisateur interne
        const existingUser = await getInternalUserById(userId);
        if (existingUser.error || !existingUser.data) {
          const errorMessage = existingUser.error || 'Utilisateur interne non trouvé';
          logger.warn('useInternalUsers.remove - Utilisateur non trouvé ou pas interne', { 
            userId, 
            error: errorMessage 
          });
          return { success: false, error: errorMessage };
        }

        const supabase = createClient();

        // Soft delete : mettre à jour deleted_at
        const { error: deleteError } = await supabase
          .from('profiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', userId);

        if (deleteError) {
          logger.error('useInternalUsers.remove - Erreur Supabase', { error: deleteError });
          return { success: false, error: deleteError.message };
        }

        // Rafraîchir la liste
        await loadUsers();

        logger.info('useInternalUsers.remove - Succès', { userId });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useInternalUsers.remove - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadUsers]
  );

  // Chargement initial
  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return {
    users,
    isLoading,
    error,
    refresh,
    getUserById,
    getUsersByRole,
    update,
    remove,
    formatName: formatUserName,
    formatNameShort: formatUserNameShort,
    translateRole,
  };
}

// ============================================
// EXPORT DES UTILITAIRES
// ============================================

export { formatUserName, formatUserNameShort, translateRole };
