/**
 * Hook useRepresentations - Gestion des représentations avec Supabase
 * Derviche Diffusion
 * 
 * Encapsule le service representations et gère les états React
 * Note : capacity = 0 signifie "places illimitées"
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SlotInsert, SlotUpdate } from '@/types/database';
import {
  getRepresentationsByShowId,
  createRepresentation,
  createMultipleRepresentations,
  updateRepresentation,
  deleteRepresentation,
  countReservationsForSlot,
  type SlotWithRelations,
} from '@/lib/services/representations';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface UseRepresentationsReturn {
  /** Liste des représentations */
  representations: SlotWithRelations[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Recharger les données */
  refresh: () => Promise<{ success: boolean; error?: string }>;
  /** Créer une représentation */
  create: (slot: SlotInsert) => Promise<{ success: boolean; data?: SlotWithRelations; error?: string }>;
  /** Créer plusieurs représentations (série) */
  createBatch: (slots: SlotInsert[]) => Promise<{ success: boolean; count: number; error?: string }>;
  /** Mettre à jour une représentation */
  update: (id: string, slot: SlotUpdate) => Promise<{ success: boolean; data?: SlotWithRelations; error?: string }>;
  /** Supprimer une représentation */
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Compter les réservations d'un slot */
  checkReservations: (id: string) => Promise<{ count: number; error: string | null }>;
}

// ============================================
// HOOK
// ============================================

export function useRepresentations(showId: string): UseRepresentationsReturn {
  const [representations, setRepresentations] = useState<SlotWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter les race conditions et vérifier que le showId correspond toujours
  const loadingRef = useRef<string | null>(null);

  // Charger les représentations
  const loadRepresentations = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // Capturer le showId actuel pour vérifier après l'appel async
    const currentShowId = showId;

    // Éviter les appels multiples simultanés pour le même showId
    if (loadingRef.current === currentShowId) {
      return { success: false, error: 'Chargement déjà en cours' };
    }
    loadingRef.current = currentShowId;

    setIsLoading(true);
    setError(null);

    const result = await getRepresentationsByShowId(currentShowId);

    // Vérifier que le showId n'a pas changé pendant l'appel async
    // Si c'est le cas, ignorer ce résultat (un autre chargement est en cours)
    if (loadingRef.current !== currentShowId) {
      return { success: false, error: 'Le spectacle a changé pendant le chargement' };
    }

    if (result.error) {
      setError(result.error);
      logger.error('useRepresentations - Erreur chargement', { showId: currentShowId, error: result.error });
      setIsLoading(false);
      // Réinitialiser le ref seulement si c'est toujours le même showId
      if (loadingRef.current === currentShowId) {
        loadingRef.current = null;
      }
      return { success: false, error: result.error };
    }

    setRepresentations(result.data);
    setIsLoading(false);
    // Réinitialiser le ref seulement si c'est toujours le même showId
    if (loadingRef.current === currentShowId) {
      loadingRef.current = null;
    }
    return { success: true };
  }, [showId]);

  // Charger au montage et quand showId change
  useEffect(() => {
    if (showId) {
      // Réinitialiser le ref quand le showId change pour permettre le nouveau chargement
      loadingRef.current = null;
      void loadRepresentations();
    }
  }, [showId, loadRepresentations]);

  // Créer une représentation
  const create = useCallback(async (slot: SlotInsert) => {
    const result = await createRepresentation(slot);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Ajouter et re-trier par date/heure
      setRepresentations((prev) =>
        [...prev, result.data!].sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        })
      );
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue lors de la création' };
  }, []);

  // Créer plusieurs représentations (série)
  const createBatch = useCallback(async (slots: SlotInsert[]) => {
    const result = await createMultipleRepresentations(slots);

    if (result.error) {
      return { success: false, count: 0, error: result.error };
    }

    // Recharger toutes les données pour avoir les relations
    const reloadResult = await loadRepresentations();

    if (!reloadResult.success) {
      // Les représentations ont été créées mais le rechargement a échoué
      // Retourner une erreur pour indiquer le problème
      return {
        success: false,
        count: result.count,
        error: reloadResult.error || 'Les représentations ont été créées mais le rechargement a échoué'
      };
    }

    return { success: true, count: result.count };
  }, [loadRepresentations]);

  // Mettre à jour une représentation
  const update = useCallback(async (id: string, slot: SlotUpdate) => {
    const result = await updateRepresentation(id, slot);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Mettre à jour et re-trier
      setRepresentations((prev) =>
        prev
          .map((r) => (r.id === id ? result.data! : r))
          .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
          })
      );
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue lors de la mise à jour' };
  }, []);

  // Supprimer une représentation
  const remove = useCallback(async (id: string) => {
    const result = await deleteRepresentation(id);

    if (!result.success) {
      return { success: false, error: result.error || 'Erreur lors de la suppression' };
    }

    // Retirer de la liste
    setRepresentations((prev) => prev.filter((r) => r.id !== id));
    return { success: true };
  }, []);

  // Vérifier les réservations
  const checkReservations = useCallback(async (id: string) => {
    return await countReservationsForSlot(id);
  }, []);

  return {
    representations,
    isLoading,
    error,
    refresh: loadRepresentations,
    create,
    createBatch,
    update,
    remove,
    checkReservations,
  };
}
