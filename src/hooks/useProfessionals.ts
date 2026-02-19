/**
 * Hook React pour la gestion des professionnels (programmateurs)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit la liste des professionnels avec capacités CRUD complètes :
 * chargement, mise à jour du profil, suppression, activation/désactivation.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProfessionals,
  formatProfessionalName,
  formatProfessionalNameShort,
  type Professional,
  type UpdateProfessionalData,
} from '@/lib/services/professionals';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Résultat générique d'une opération CRUD */
export interface ProfessionalOperationResult {
  success: boolean;
  error?: string;
}

export interface UseProfessionalsReturn {
  /** Liste des professionnels */
  professionals: Professional[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Recharge la liste */
  refresh: () => Promise<void>;
  /** Trouve un professionnel par son ID dans le cache local */
  getProfessionalById: (id: string) => Professional | undefined;
  /** Met à jour le profil d'un professionnel */
  update: (id: string, data: UpdateProfessionalData) => Promise<ProfessionalOperationResult>;
  /** Supprime un professionnel (soft delete) */
  remove: (id: string) => Promise<ProfessionalOperationResult>;
  /** Active ou désactive un professionnel */
  toggleStatus: (id: string, disabled: boolean) => Promise<ProfessionalOperationResult>;
  /** Formate le nom complet */
  formatName: (professional: Professional) => string;
  /** Formate le nom abrégé (Prénom N.) */
  formatNameShort: (professional: Professional) => string;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour charger et gérer les professionnels.
 *
 * @example
 * ```tsx
 * const { professionals, isLoading, update, remove } = useProfessionals();
 *
 * // Mettre à jour le profil
 * const result = await update(id, { structure: 'Théâtre de la Ville', city: 'Paris' });
 *
 * // Supprimer
 * const result = await remove(id);
 * ```
 */
export function useProfessionals(): UseProfessionalsReturn {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Évite les race conditions lors de rechargements successifs
  const loadIdRef = useRef(0);

  // ============================================
  // CHARGEMENT
  // ============================================

  const loadProfessionals = useCallback(async () => {
    const currentLoadId = ++loadIdRef.current;
    setIsLoading(true);
    setError(null);

    const result = await getProfessionals();

    // Ignorer si un nouveau chargement a démarré entretemps
    if (currentLoadId !== loadIdRef.current) return;

    if (result.error) {
      setError(result.error);
      setProfessionals([]);
    } else {
      setProfessionals(result.data);
    }

    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    await loadProfessionals();
  }, [loadProfessionals]);

  // ============================================
  // LECTURE LOCALE
  // ============================================

  const getProfessionalById = useCallback(
    (id: string): Professional | undefined => professionals.find((p) => p.id === id),
    [professionals]
  );

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Met à jour le profil complet d'un professionnel via l'API dédiée.
   */
  const update = useCallback(
    async (
      id: string,
      data: UpdateProfessionalData
    ): Promise<ProfessionalOperationResult> => {
      try {
        logger.info('useProfessionals.update - Mise à jour', { id, data });

        const response = await fetch(`/api/admin/professionals/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = (await response.json()) as { success: boolean; error?: string };
          const msg = result.error ?? `Erreur HTTP ${response.status}`;
          logger.error('useProfessionals.update - Erreur HTTP', {
            status: response.status,
            error: msg,
          });
          return { success: false, error: msg };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useProfessionals.update - Erreur API', { error: result.error });
          return { success: false, error: result.error ?? 'Erreur lors de la mise à jour' };
        }

        await loadProfessionals();

        logger.info('useProfessionals.update - Succès', { id });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useProfessionals.update - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadProfessionals]
  );

  /**
   * Soft delete d'un professionnel.
   */
  const remove = useCallback(
    async (id: string): Promise<ProfessionalOperationResult> => {
      try {
        logger.info('useProfessionals.remove - Suppression', { id });

        const response = await fetch(`/api/admin/professionals/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const result = (await response.json()) as { success: boolean; error?: string };
          const msg = result.error ?? `Erreur HTTP ${response.status}`;
          logger.error('useProfessionals.remove - Erreur HTTP', {
            status: response.status,
            error: msg,
          });
          return { success: false, error: msg };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useProfessionals.remove - Erreur API', { error: result.error });
          return { success: false, error: result.error ?? 'Erreur lors de la suppression' };
        }

        await loadProfessionals();

        logger.info('useProfessionals.remove - Succès', { id });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useProfessionals.remove - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadProfessionals]
  );

  /**
   * Active ou désactive un professionnel via l'API de statut existante.
   * Réutilise /api/admin/users/[userId]/status pour ne pas dupliquer la logique.
   */
  const toggleStatus = useCallback(
    async (id: string, disabled: boolean): Promise<ProfessionalOperationResult> => {
      try {
        const action = disabled ? 'Désactivation' : 'Réactivation';
        logger.info(`useProfessionals.toggleStatus - ${action}`, { id });

        const response = await fetch(`/api/admin/professionals/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disabled }),
        });

        if (!response.ok) {
          const result = (await response.json()) as { success: boolean; error?: string };
          const msg = result.error ?? `Erreur HTTP ${response.status}`;
          logger.error('useProfessionals.toggleStatus - Erreur HTTP', {
            status: response.status,
            error: msg,
          });
          return { success: false, error: msg };
        }

        const result = (await response.json()) as { success: boolean; error?: string };

        if (!result.success) {
          logger.error('useProfessionals.toggleStatus - Erreur API', { error: result.error });
          return {
            success: false,
            error: result.error ?? 'Erreur lors du changement de statut',
          };
        }

        await loadProfessionals();

        logger.info('useProfessionals.toggleStatus - Succès', { id, disabled });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('useProfessionals.toggleStatus - Exception', { error: message });
        return { success: false, error: message };
      }
    },
    [loadProfessionals]
  );

  // ============================================
  // EFFETS
  // ============================================

  useEffect(() => {
    void loadProfessionals();
  }, [loadProfessionals]);

  // Avertissement de débogage si aucun professionnel après chargement
  useEffect(() => {
    if (!isLoading && !error && professionals.length === 0) {
      logger.info('useProfessionals - Aucun professionnel trouvé (liste vide)');
    }
  }, [isLoading, error, professionals.length]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    professionals,
    isLoading,
    error,
    refresh,
    getProfessionalById,
    update,
    remove,
    toggleStatus,
    formatName: formatProfessionalName,
    formatNameShort: formatProfessionalNameShort,
  };
}

// ============================================
// EXPORTS
// ============================================

export { formatProfessionalName, formatProfessionalNameShort };
export type { Professional, UpdateProfessionalData };
