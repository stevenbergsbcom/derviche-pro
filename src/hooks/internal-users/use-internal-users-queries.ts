'use client';

/**
 * Queries (data fetching) pour les utilisateurs internes
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getInternalUsers } from '@/lib/services/internal-users';
import type { InternalUser, InternalRole } from '@/types/database';

export interface UseInternalUsersQueriesReturn {
  users: InternalUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getUserById: (id: string) => InternalUser | undefined;
  getUsersByRole: (role: InternalRole) => InternalUser[];
  /** Recharge interne (utilisé par les actions) */
  loadUsers: () => Promise<void>;
}

/**
 * Hook interne pour le chargement et le filtrage des utilisateurs internes
 */
export function useInternalUsersQueries(): UseInternalUsersQueriesReturn {
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
    loadUsers,
  };
}
