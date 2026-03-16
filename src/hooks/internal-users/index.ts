'use client';

/**
 * Hook React pour la gestion des utilisateurs internes et compagnies
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit les utilisateurs gérés par les admins depuis Supabase
 * avec capacités CRUD complètes :
 * - Internes : super-admin, admin, externe
 * - Compagnies : company (avec company_id obligatoire)
 */

import {
  formatUserName,
  formatUserNameShort,
  translateRole,
} from '@/lib/services/internal-users';
import { useInternalUsersQueries } from './use-internal-users-queries';
import { useInternalUsersActions } from './use-internal-users-actions';
import type { UseInternalUsersReturn } from './types';

// Re-export types
export type {
  UpdateUserData,
  CreateUserData,
  OperationResult,
  UseInternalUsersReturn,
} from './types';

// Re-export sub-hooks for direct use
export { useInternalUsersQueries } from './use-internal-users-queries';
export { useInternalUsersActions } from './use-internal-users-actions';

// Re-export utilities
export { formatUserName, formatUserNameShort, translateRole };

/**
 * Hook pour charger et gérer les utilisateurs internes
 *
 * @example
 * ```tsx
 * const { users, isLoading, create, update, remove } = useInternalUsers();
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
 *
 * // Mettre à jour un utilisateur
 * const result = await update(userId, { first_name: 'Jean', role: 'admin' });
 *
 * // Supprimer un utilisateur
 * const result = await remove(userId);
 * ```
 */
export function useInternalUsers(): UseInternalUsersReturn {
  const {
    users,
    isLoading,
    error,
    refresh,
    getUserById,
    getUsersByRole,
    loadUsers,
  } = useInternalUsersQueries();

  const { create, update, remove, toggleStatus } = useInternalUsersActions(loadUsers);

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
