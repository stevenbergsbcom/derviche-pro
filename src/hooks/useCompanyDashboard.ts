/**
 * Hook useCompanyDashboard
 * Derviche Diffusion
 * 
 * Récupère les données du dashboard pour l'interface compagnie
 * - Informations de la compagnie
 * - Statistiques globales
 * - Liste des spectacles avec stats
 * - Prochains créneaux
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getCompanyDashboard,
  type CompanyDashboardData,
} from '@/lib/services/company-dashboard';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface UseCompanyDashboardReturn {
  /** Données du dashboard */
  data: CompanyDashboardData | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook pour récupérer les données du dashboard compagnie
 */
export function useCompanyDashboard(): UseCompanyDashboardReturn {
  const [data, setData] = useState<CompanyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter les race conditions
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    // Éviter les appels simultanés
    if (fetchInProgressRef.current) {
      return;
    }

    fetchInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les données du dashboard
      const result = await getCompanyDashboard(user.id);

      // Vérifier que le composant est toujours monté
      if (!isMountedRef.current) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      logger.error('Erreur useCompanyDashboard', { message });
      setError(message);
      setData(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    isMountedRef.current = true;
    void fetchDashboard();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboard]);

  // Écouter les changements d'authentification
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void fetchDashboard();
      } else {
        setData(null);
        setError('Session expirée');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
