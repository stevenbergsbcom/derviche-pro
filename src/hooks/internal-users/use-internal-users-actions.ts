'use client';

/**
 * Actions (mutations) pour les utilisateurs internes
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import { useCallback } from 'react';
import {
  updateInternalUserProfile,
  updateInternalUserRole,
} from '@/lib/services/internal-users';
import { logger } from '@/lib/logger';
import type { CreateUserData, UpdateUserData, OperationResult } from './types';

export interface UseInternalUsersActionsReturn {
  create: (data: CreateUserData) => Promise<OperationResult>;
  update: (userId: string, data: UpdateUserData) => Promise<OperationResult>;
  remove: (userId: string) => Promise<OperationResult>;
  toggleStatus: (userId: string, disabled: boolean) => Promise<OperationResult>;
}

/**
 * Hook interne pour les mutations CRUD des utilisateurs internes
 */
export function useInternalUsersActions(
  loadUsers: () => Promise<void>
): UseInternalUsersActionsReturn {
  /**
   * Crée un nouvel utilisateur (interne ou compagnie) via l'API
   */
  const create = useCallback(
    async (data: CreateUserData): Promise<OperationResult> => {
      try {
        logger.info('useInternalUsers.create - Création', {
          email: data.email,
          role: data.role,
          company_id: data.company_id,
        });

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        // Vérifier le statut HTTP
        if (!response.ok) {
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useInternalUsers.create - Erreur HTTP', {
            status: response.status,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        const result = (await response.json()) as {
          success: boolean;
          error?: string;
          user?: { id: string; email: string };
          reactivated?: boolean;
        };

        if (!result.success) {
          logger.error('useInternalUsers.create - Erreur API', { error: result.error });
          return { success: false, error: result.error || 'Erreur lors de la création' };
        }

        // Rafraîchir la liste (uniquement pour les utilisateurs internes)
        // Les utilisateurs compagnie ne sont pas dans cette liste
        if (data.role !== 'company') {
          await loadUsers();
        }

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
            logger.error('useInternalUsers.update - Erreur profil', {
              error: profileResult.error,
            });
            return { success: false, error: profileResult.error };
          }
        }

        // Mettre à jour le rôle si nécessaire
        if (role) {
          const roleResult = await updateInternalUserRole(userId, role);
          if (roleResult.error) {
            logger.error('useInternalUsers.update - Erreur rôle', {
              error: roleResult.error,
            });
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
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useInternalUsers.remove - Erreur HTTP', {
            status: response.status,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

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
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useInternalUsers.toggleStatus - Erreur HTTP', {
            status: response.status,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useInternalUsers.toggleStatus - Erreur API', {
            error: result.error,
          });
          return {
            success: false,
            error: result.error || 'Erreur lors du changement de statut',
          };
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

  return { create, update, remove, toggleStatus };
}
