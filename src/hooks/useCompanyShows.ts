/**
 * Hook useCompanyShows
 * Derviche Diffusion
 *
 * Récupère la liste des spectacles de la compagnie connectée
 * avec leurs statistiques (créneaux, réservations).
 * Réutilise les services existants du company-dashboard.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getCompanyIdForUser,
  getCompanyShowsWithStats,
  type CompanyShowWithStats,
} from '@/lib/services/company-dashboard';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface UseCompanyShowsReturn {
  shows: CompanyShowWithStats[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useCompanyShows(): UseCompanyShowsReturn {
  const [shows, setShows] = useState<CompanyShowWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchShows = useCallback(async () => {
    if (fetchInProgressRef.current) return;

    fetchInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(userError?.message ?? 'Utilisateur non connecté');
      }

      const { companyId, error: companyIdError } = await getCompanyIdForUser(user.id);

      if (companyIdError || !companyId) {
        throw new Error(companyIdError ?? 'Compagnie introuvable');
      }

      const { data, error: showsError } = await getCompanyShowsWithStats(companyId);

      if (!isMountedRef.current) return;

      if (showsError) {
        setError(showsError);
        setShows([]);
      } else {
        setShows(data);
        setError(null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      logger.error('Erreur useCompanyShows', { message });
      setError(message);
      setShows([]);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchShows();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchShows]);

  return { shows, isLoading, error, refresh: fetchShows };
}
