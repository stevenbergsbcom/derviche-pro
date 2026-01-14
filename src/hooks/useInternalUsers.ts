/**
 * Hook React pour la gestion des utilisateurs internes (staff)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit les utilisateurs internes (super-admin, admin, externe-dd) depuis Supabase
 * Remplace mockDervisheUsers pour les composants qui en ont besoin
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getInternalUsers, formatUserName, formatUserNameShort, translateRole } from '@/lib/services/internal-users';
import type { InternalUser, InternalRole } from '@/types/database';

// ============================================
// TYPES
// ============================================

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
 * const { users, isLoading, getUserById } = useInternalUsers();
 * 
 * // Dans un select
 * <Select>
 *   {users.map(user => (
 *     <SelectItem key={user.id} value={user.id}>
 *       {formatName(user)}
 *     </SelectItem>
 *   ))}
 * </Select>
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
   * Trouve un utilisateur par son ID
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
    formatName: formatUserName,
    formatNameShort: formatUserNameShort,
    translateRole,
  };
}

// ============================================
// EXPORT DES UTILITAIRES
// ============================================

export { formatUserName, formatUserNameShort, translateRole };
