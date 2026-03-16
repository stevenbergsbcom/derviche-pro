'use client';

/**
 * Hook React pour la gestion des utilisateurs gérés (internes + compagnies)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit tous les utilisateurs gérés par les admins depuis Supabase
 * avec capacités CRUD complètes :
 * - Internes : super-admin, admin, externe
 * - Compagnies : company (avec company_id obligatoire)
 */

import {
  formatUserName,
  formatUserNameShort,
  translateRole,
} from '@/lib/services/internal-users';
import { useManagedUsersQueries } from './use-managed-users-queries';
import { useManagedUsersActions } from './use-managed-users-actions';
import type { UseManagedUsersReturn } from './types';

// Re-export types
export type {
  CreateManagedUserData,
  UpdateManagedUserData,
  OperationResult,
  UseManagedUsersReturn,
  ManagedUser,
  ManagedRole,
} from './types';

// Re-export sub-hooks for direct use
export { useManagedUsersQueries } from './use-managed-users-queries';
export { useManagedUsersActions } from './use-managed-users-actions';

// Re-export utilities
export { formatUserName, formatUserNameShort, translateRole };

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
  const {
    users,
    isLoading,
    error,
    refresh,
    getUserById,
    getUsersByRole,
    loadUsers,
  } = useManagedUsersQueries();

  const { create, update, remove, toggleStatus } = useManagedUsersActions(loadUsers);

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
