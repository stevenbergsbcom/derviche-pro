/**
 * Hook usePublicCatalog - Données pour les pages publiques
 * Derviche Diffusion
 * 
 * Fournit les spectacles et leurs représentations pour :
 * - La page d'accueil
 * - Le catalogue
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPublicCatalog,
  getPublicVenues,
  type PublicShow,
} from '@/lib/services/public-catalog';

// ============================================
// TYPES
// ============================================

export interface UsePublicCatalogReturn {
  /** Liste des spectacles publiés avec leurs représentations */
  shows: PublicShow[];
  /** Liste des lieux utilisés (pour les filtres) */
  venues: Array<{ id: string; name: string; city: string }>;
  /** Chargement en cours */
  isLoading: boolean;
  /** Les données ont été chargées au moins une fois */
  hasLoaded: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour récupérer le catalogue public
 * Charge les spectacles publiés et les lieux utilisés
 */
export function usePublicCatalog(): UsePublicCatalogReturn {
  const [shows, setShows] = useState<PublicShow[]>([]);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Charger en parallèle les spectacles et les lieux
      const [catalogResult, venuesResult] = await Promise.all([
        getPublicCatalog(),
        getPublicVenues(),
      ]);

      if (catalogResult.error) {
        setError(catalogResult.error);
        setShows([]); // Vider les données obsolètes en cas d'erreur
      } else {
        setShows(catalogResult.data);
      }

      if (venuesResult.error) {
        // On ne bloque pas pour une erreur sur les lieux
        console.warn('Erreur récupération lieux:', venuesResult.error);
      } else {
        setVenues(venuesResult.data);
      }

      setHasLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setShows([]); // Vider les données obsolètes en cas d'erreur
      setVenues([]); // Vider aussi les lieux
      setHasLoaded(true); // Important: marquer comme chargé même en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    shows,
    venues,
    isLoading,
    hasLoaded,
    error,
    refresh: fetchData,
  };
}
