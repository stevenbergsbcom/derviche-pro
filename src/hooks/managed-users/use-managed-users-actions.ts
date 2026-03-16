'use client';

/**
 * Actions (mutations) pour les utilisateurs gérés
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { CreateManagedUserData, UpdateManagedUserData, OperationResult } from './types';

export interface UseManagedUsersActionsReturn {
  create: (data: CreateManagedUserData) => Promise<OperationResult>;
  update: (userId: string, data: UpdateManagedUserData) => Promise<OperationResult>;
  remove: (userId: string) => Promise<OperationResult>;
  toggleStatus: (userId: string, disabled: boolean) => Promise<OperationResult>;
}

/**
 * Hook interne pour les mutations CRUD des utilisateurs gérés
 */
export function useManagedUsersActions(
  loadUsers: () => Promise<void>
): UseManagedUsersActionsReturn {
  /**
   * Crée un nouvel utilisateur via l'API
   */
  const create = useCallback(
    async (data: CreateManagedUserData): Promise<OperationResult> => {
      try {
        logger.info('useManagedUsers.create - Création', {
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

        if (!response.ok) {
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.create - Erreur HTTP', {
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
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.update - Erreur HTTP', {
            status: response.status,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

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
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.remove - Erreur HTTP', {
            status: response.status,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

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
          const result = (await response.json()) as { success: boolean; error?: string };
          const errorMessage = result.error || `Erreur HTTP ${response.status}`;
          logger.error('useManagedUsers.toggleStatus - Erreur HTTP', {
            status: response.status,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useManagedUsers.toggleStatus - Erreur API', {
            error: result.error,
          });
          return {
            success: false,
            error: result.error || 'Erreur lors du changement de statut',
          };
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

  return { create, update, remove, toggleStatus };
}
