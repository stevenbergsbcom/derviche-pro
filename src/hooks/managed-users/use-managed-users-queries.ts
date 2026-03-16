'use client';

/**
 * Queries (data fetching) pour les utilisateurs gérés
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getManagedUsers,
  type ManagedUser,
  type ManagedRole,
} from '@/lib/services/internal-users';

export interface UseManagedUsersQueriesReturn {
  users: ManagedUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getUserById: (id: string) => ManagedUser | undefined;
  getUsersByRole: (role: ManagedRole) => ManagedUser[];
  /** Recharge interne (utilisé par les actions) */
  loadUsers: () => Promise<void>;
}

/**
 * Hook interne pour le chargement et le filtrage des utilisateurs gérés
 */
export function useManagedUsersQueries(): UseManagedUsersQueriesReturn {
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
