/**
 * Hook React pour la gestion des utilisateurs internes (staff)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit les utilisateurs internes (super-admin, admin, externe) depuis Supabase
 * avec capacités CRUD complètes
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getInternalUsers,
  updateInternalUserProfile,
  updateInternalUserRole,
  formatUserName,
  formatUserNameShort,
  translateRole,
} from '@/lib/services/internal-users';
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

/** Données pour créer un utilisateur */
export interface CreateUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: InternalRole;
  must_change_password?: boolean;
}

/** Résultat d'une opération CRUD */
export interface OperationResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string };
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
  /** Crée un nouvel utilisateur interne */
  create: (data: CreateUserData) => Promise<OperationResult>;
  /** Met à jour un utilisateur (profil et/ou rôle) */
  update: (userId: string, data: UpdateUserData) => Promise<OperationResult>;
  /** Supprime un utilisateur interne (soft delete) */
  remove: (userId: string) => Promise<OperationResult>;
  /** Active ou désactive un utilisateur (seul Super Admin peut faire ça) */
  toggleStatus: (userId: string, disabled: boolean) => Promise<OperationResult>;
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
 * const { users, isLoading, create, update, remove } = useInternalUsers();
 * 
 * // Créer un utilisateur
 * const result = await create({ email: 'user@example.com', password: 'Secret123!', role: 'admin' });
 * 
 * // Mettre à jour un utilisateur
 * const result = await update(userId, { first_name: 'Jean', role: 'admin' });
 * 
 * // Supprimer un utilisateur
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
   * Crée un nouvel utilisateur interne via l'API
   */
  const create = useCallback(
    async (data: CreateUserData): Promise<OperationResult> => {
      try {
        logger.info('useInternalUsers.create - Création', { email: data.email, role: data.role });

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        // Vérifier le statut HTTP
        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useInternalUsers.create - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { success: boolean; error?: string; user?: { id: string; email: string }; reactivated?: boolean };

        if (!result.success) {
          logger.error('useInternalUsers.create - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors de la création' };
        }

        // Rafraîchir la liste
        await loadUsers();

        // Log différent si réactivation
        if (result.reactivated) {
          logger.info('useInternalUsers.create - Compte réactivé', { user: result.user });
        } else {
          logger.info('useInternalUsers.create - Succès', { user: result.user });
        }
        
        return { success: true, user: result.user };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useInternalUsers.create - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadUsers]
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
   * Supprime un utilisateur interne (soft delete) via l'API
   */
  const remove = useCallback(
    async (userId: string): Promise<OperationResult> => {
      try {
        logger.info('useInternalUsers.remove - Suppression', { userId });

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        // Vérifier le statut HTTP
        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useInternalUsers.remove - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useInternalUsers.remove - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors de la suppression' };
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

  /**
   * Active ou désactive un utilisateur via l'API
   * Seuls les Super Admins peuvent faire cette action
   * Les Super Admins ne peuvent pas être désactivés
   */
  const toggleStatus = useCallback(
    async (userId: string, disabled: boolean): Promise<OperationResult> => {
      try {
        const action = disabled ? 'Désactivation' : 'Réactivation';
        logger.info(`useInternalUsers.toggleStatus - ${action}`, { userId });

        const response = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ disabled }),
        });

        // Vérifier le statut HTTP
        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useInternalUsers.toggleStatus - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useInternalUsers.toggleStatus - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors du changement de statut' };
        }

        // Rafraîchir la liste
        await loadUsers();

        logger.info('useInternalUsers.toggleStatus - Succès', { userId, disabled });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useInternalUsers.toggleStatus - Exception', { error: message });
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
    create,
    update,
    remove,
    toggleStatus,
    formatName: formatUserName,
    formatNameShort: formatUserNameShort,
    translateRole,
  };
}

// ============================================
// EXPORT DES UTILITAIRES
// ============================================

export { formatUserName, formatUserNameShort, translateRole };
