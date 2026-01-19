/**
 * Hook usePublicShow - Données pour la page détail spectacle
 * Derviche Diffusion
 * 
 * Charge un spectacle par son slug avec toutes ses représentations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPublicShowBySlug,
  type PublicShow,
} from '@/lib/services/public-catalog';

// ============================================
// TYPES
// ============================================

export interface UsePublicShowReturn {
  /** Le spectacle chargé (null si non trouvé) */
  show: PublicShow | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Les données ont été chargées au moins une fois */
  hasLoaded: boolean;
  /** Spectacle non trouvé (404) */
  notFound: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour récupérer un spectacle par son slug
 * Utilisé par la page détail spectacle
 * 
 * @param slug Le slug du spectacle à charger
 */
export function usePublicShow(slug: string | null): UsePublicShowReturn {
  const [show, setShow] = useState<PublicShow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Si pas de slug, ne rien charger
    if (!slug) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const result = await getPublicShowBySlug(slug);

      if (result.error) {
        setError(result.error);
        setShow(null);
      } else if (!result.data) {
        // Spectacle non trouvé
        setNotFound(true);
        setShow(null);
      } else {
        setShow(result.data);
      }

      setHasLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setShow(null);
      setHasLoaded(true); // Important: marquer comme chargé même en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // Chargement initial et rechargement quand le slug change
  useEffect(() => {
    // Reset des états quand le slug change
    setShow(null);
    setNotFound(false);
    setError(null);
    setHasLoaded(false);
    
    void fetchData();
  }, [fetchData]);

  return {
    show,
    isLoading,
    hasLoaded,
    notFound,
    error,
    refresh: fetchData,
  };
}
