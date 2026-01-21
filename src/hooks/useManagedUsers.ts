/**
 * Hook React pour la gestion des utilisateurs gérés (internes + compagnies)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit tous les utilisateurs gérés par les admins depuis Supabase
 * avec capacités CRUD complètes :
 * - Internes : super-admin, admin, externe
 * - Compagnies : company (avec company_id obligatoire)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getManagedUsers,
  formatUserName,
  formatUserNameShort,
  translateRole,
  type ManagedUser,
  type ManagedRole,
} from '@/lib/services/internal-users';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Données pour créer un utilisateur (interne ou compagnie) */
export interface CreateManagedUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: ManagedRole;
  company_id?: string; // Obligatoire si role = 'company'
  must_change_password?: boolean;
}

/** Données pour mettre à jour un utilisateur */
export interface UpdateManagedUserData {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: ManagedRole;
}

/** Résultat d'une opération CRUD */
export interface OperationResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string };
  reactivated?: boolean;
}

export interface UseManagedUsersReturn {
  /** Liste des utilisateurs gérés (internes + company) */
  users: ManagedUser[];
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Recharge la liste des utilisateurs */
  refresh: () => Promise<void>;
  /** Trouve un utilisateur par son ID */
  getUserById: (id: string) => ManagedUser | undefined;
  /** Filtre les utilisateurs par rôle */
  getUsersByRole: (role: ManagedRole) => ManagedUser[];
  /** Crée un nouvel utilisateur (interne ou compagnie) */
  create: (data: CreateManagedUserData) => Promise<OperationResult>;
  /** Met à jour un utilisateur (profil et/ou rôle) */
  update: (userId: string, data: UpdateManagedUserData) => Promise<OperationResult>;
  /** Supprime un utilisateur (soft delete) */
  remove: (userId: string) => Promise<OperationResult>;
  /** Active ou désactive un utilisateur (seul Super Admin peut faire ça) */
  toggleStatus: (userId: string, disabled: boolean) => Promise<OperationResult>;
  /** Formate le nom complet d'un utilisateur */
  formatName: (user: ManagedUser) => string;
  /** Formate le nom abrégé d'un utilisateur */
  formatNameShort: (user: ManagedUser) => string;
  /** Traduit un rôle en français */
  translateRole: (role: ManagedRole) => string;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour charger et gérer les utilisateurs gérés (internes + company)
 * 
 * @example
 * ```tsx
 * const { users, isLoading, create, update, remove } = useManagedUsers();
 * 
 * // Créer un utilisateur interne
 * const result = await create({ email: 'user@example.com', password: 'Secret123!', role: 'admin' });
 * 
 * // Créer un utilisateur compagnie
 * const result = await create({ 
 *   email: 'compagnie@example.com', 
 *   password: 'Secret123!', 
 *   role: 'company',
 *   company_id: 'uuid-compagnie'
 * });
 * ```
 */
export function useManagedUsers(): UseManagedUsersReturn {
  const [users, setUsers] = useState<ManagedUser[]>([]);
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

    const result = await getManagedUsers();

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
    (id: string): ManagedUser | undefined => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  /**
   * Filtre les utilisateurs par rôle
   */
  const getUsersByRole = useCallback(
    (role: ManagedRole): ManagedUser[] => {
      return users.filter((user) => user.role === role);
    },
    [users]
  );

  /**
   * Crée un nouvel utilisateur via l'API
   */
  const create = useCallback(
    async (data: CreateManagedUserData): Promise<OperationResult> => {
      try {
        logger.info('useManagedUsers.create - Création', { 
          email: data.email, 
          role: data.role,
          company_id: data.company_id 
        });

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.create - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { 
          success: boolean; 
          error?: string; 
          user?: { id: string; email: string }; 
          reactivated?: boolean 
        };

        if (!result.success) {
          logger.error('useManagedUsers.create - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors de la création' };
        }

        // Rafraîchir la liste
        await loadUsers();

        if (result.reactivated) {
          logger.info('useManagedUsers.create - Compte réactivé', { user: result.user });
        } else {
          logger.info('useManagedUsers.create - Succès', { user: result.user });
        }
        
        return { success: true, user: result.user, reactivated: result.reactivated };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useManagedUsers.create - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadUsers]
  );

  /**
   * Met à jour un utilisateur (profil et/ou rôle)
   */
  const update = useCallback(
    async (userId: string, data: UpdateManagedUserData): Promise<OperationResult> => {
      try {
        logger.info('useManagedUsers.update - Mise à jour', { userId, data });

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.update - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useManagedUsers.update - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors de la mise à jour' };
        }

        // Rafraîchir la liste
        await loadUsers();

        logger.info('useManagedUsers.update - Succès', { userId });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useManagedUsers.update - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadUsers]
  );

  /**
   * Supprime un utilisateur (soft delete) via l'API
   */
  const remove = useCallback(
    async (userId: string): Promise<OperationResult> => {
      try {
        logger.info('useManagedUsers.remove - Suppression', { userId });

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.remove - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useManagedUsers.remove - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors de la suppression' };
        }

        // Rafraîchir la liste
        await loadUsers();

        logger.info('useManagedUsers.remove - Succès', { userId });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useManagedUsers.remove - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadUsers]
  );

  /**
   * Active ou désactive un utilisateur via l'API
   */
  const toggleStatus = useCallback(
    async (userId: string, disabled: boolean): Promise<OperationResult> => {
      try {
        const action = disabled ? 'Désactivation' : 'Réactivation';
        logger.info(`useManagedUsers.toggleStatus - ${action}`, { userId });

        const response = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ disabled }),
        });

        if (!response.ok) {
          const result = await response.json() as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.toggleStatus - Erreur HTTP', { status: response.status, error: errorMessage });
          return { success: false, error: errorMessage };
        }

        const result = await response.json() as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useManagedUsers.toggleStatus - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors du changement de statut' };
        }

        // Rafraîchir la liste
        await loadUsers();

        logger.info('useManagedUsers.toggleStatus - Succès', { userId, disabled });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useManagedUsers.toggleStatus - Exception', { error: message });
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
export type { ManagedUser, ManagedRole };
