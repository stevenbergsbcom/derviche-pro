/**
 * Hook useShows - Gestion des spectacles avec Supabase
 * Derviche Diffusion
 * 
 * Encapsule le service shows et gère les états React
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getShows,
  createShow,
  updateShow,
  deleteShow,
  isShowUsed,
  generateSlug,
  type ShowWithRelations,
  type ShowWithRelationsInput,
} from '@/lib/services/shows';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Type enrichi pour l'affichage avec company en objet */
export interface ShowForDisplay extends ShowWithRelations {
  company: {
    name: string;
  };
}

export interface UseShowsReturn {
  /** Liste des spectacles avec leurs relations */
  shows: ShowWithRelations[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Indique si le chargement initial est terminé (même si erreur) */
  hasLoaded: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Recharger les données */
  refresh: () => Promise<void>;
  /** Récupérer un spectacle par ID */
  getShowById: (id: string) => ShowForDisplay | null;
  /** Créer un spectacle */
  create: (input: ShowWithRelationsInput) => Promise<{ success: boolean; data?: ShowWithRelations; error?: string }>;
  /** Mettre à jour un spectacle */
  update: (id: string, input: ShowWithRelationsInput) => Promise<{ success: boolean; data?: ShowWithRelations; error?: string }>;
  /** Supprimer un spectacle */
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Vérifier si un spectacle est utilisé */
  checkUsage: (id: string) => Promise<{ used: boolean; count: number; error: string | null }>;
  /** Générer un slug à partir du titre */
  generateSlug: (title: string) => string;
}

// ============================================
// HOOK
// ============================================

export function useShows(): UseShowsReturn {
  const [shows, setShows] = useState<ShowWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les spectacles
  const loadShows = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getShows();

    if (result.error) {
      setError(result.error);
      logger.error('useShows - Erreur chargement', { error: result.error });
    } else {
      setShows(result.data);
    }

    setIsLoading(false);
    setHasLoaded(true);
  }, []);

  // Charger au montage
  useEffect(() => {
    loadShows();
  }, [loadShows]);

  // Récupérer un spectacle par ID
  const getShowById = useCallback((id: string): ShowForDisplay | null => {
    const show = shows.find((s) => s.id === id);
    if (!show) return null;
    
    // Enrichir avec l'objet company pour compatibilité
    return {
      ...show,
      company: {
        name: show.company_name,
      },
    };
  }, [shows]);

  // Créer un spectacle
  const create = useCallback(async (input: ShowWithRelationsInput) => {
    const result = await createShow(input);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Ajouter le nouveau spectacle à la liste
      setShows((prev) => 
        [...prev, result.data!].sort((a, b) => a.title.localeCompare(b.title))
      );
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue lors de la création' };
  }, []);

  // Mettre à jour un spectacle
  const update = useCallback(async (id: string, input: ShowWithRelationsInput) => {
    const result = await updateShow(id, input);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Mettre à jour le spectacle dans la liste
      setShows((prev) =>
        prev
          .map((s) => s.id === id ? result.data! : s)
          .sort((a, b) => a.title.localeCompare(b.title))
      );
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue lors de la mise à jour' };
  }, []);

  // Supprimer un spectacle
  const remove = useCallback(async (id: string) => {
    const result = await deleteShow(id);

    if (result.error) {
      return { success: false, error: result.error };
    }

    // Retirer le spectacle de la liste
    setShows((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  }, []);

  // Vérifier si un spectacle est utilisé
  const checkUsage = useCallback(async (id: string) => {
    const result = await isShowUsed(id);
    if (result.error) {
      logger.error('Erreur vérification usage show', { error: result.error });
      return { used: true, count: 0, error: result.error };
    }
    return { used: result.used, count: result.count, error: null };
  }, []);

  return {
    shows,
    isLoading,
    hasLoaded,
    error,
    refresh: loadShows,
    getShowById,
    create,
    update,
    remove,
    checkUsage,
    generateSlug,
  };
}
