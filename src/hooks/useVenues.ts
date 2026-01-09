/**
 * Hook useVenues - Gestion des lieux avec Supabase
 * Derviche Diffusion
 * 
 * Encapsule le service venues et gère les états React
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VenueRow, VenueInsert, VenueUpdate } from '@/types/database';
import {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  isVenueUsed,
} from '@/lib/services/venues';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface UseVenuesReturn {
  /** Liste des lieux */
  venues: VenueRow[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Recharger les données */
  refresh: () => Promise<void>;
  /** Créer un lieu */
  create: (venue: VenueInsert) => Promise<{ success: boolean; data?: VenueRow; error?: string }>;
  /** Mettre à jour un lieu */
  update: (id: string, venue: VenueUpdate) => Promise<{ success: boolean; data?: VenueRow; error?: string }>;
  /** Supprimer un lieu */
  remove: (id: string) => Promise<{ success: boolean; error?: string }>;
  /** Vérifier si un lieu est utilisé */
  checkUsage: (id: string) => Promise<{ used: boolean; count: number; error: string | null }>;
}

// ============================================
// HOOK
// ============================================

export function useVenues(): UseVenuesReturn {
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les lieux
  const loadVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getVenues();

    if (result.error) {
      setError(result.error);
      logger.error('useVenues - Erreur chargement', { error: result.error });
    } else {
      setVenues(result.data);
    }

    setIsLoading(false);
  }, []);

  // Charger au montage
  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Créer un lieu
  const create = useCallback(async (venue: VenueInsert) => {
    const result = await createVenue(venue);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Ajouter le nouveau lieu à la liste et re-trier
      setVenues((prev) => 
        [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name))
      );
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue lors de la création' };
  }, []);

  // Mettre à jour un lieu
  const update = useCallback(async (id: string, venue: VenueUpdate) => {
    const result = await updateVenue(id, venue);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Mettre à jour le lieu dans la liste et re-trier
      setVenues((prev) =>
        prev
          .map((v) => (v.id === id ? result.data! : v))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Erreur inconnue lors de la mise à jour' };
  }, []);

  // Supprimer un lieu
  const remove = useCallback(async (id: string) => {
    const result = await deleteVenue(id);

    if (result.error) {
      return { success: false, error: result.error };
    }

    // Retirer le lieu de la liste
    setVenues((prev) => prev.filter((v) => v.id !== id));
    return { success: true };
  }, []);

  // Vérifier si un lieu est utilisé
  const checkUsage = useCallback(async (id: string) => {
    const result = await isVenueUsed(id);
    if (result.error) {
      // En cas d'erreur, on considère le lieu comme utilisé par sécurité
      logger.error('Erreur vérification usage venue', { error: result.error });
      return { used: true, count: 0, error: result.error };
    }
    return { used: result.used, count: result.count, error: null };
  }, []);

  return {
    venues,
    isLoading,
    error,
    refresh: loadVenues,
    create,
    update,
    remove,
    checkUsage,
  };
}
