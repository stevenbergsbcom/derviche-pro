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
  getCompanyIdForUser,
  getUpcomingSlots,
  type CompanyDashboardData,
  type UpcomingSlot,
} from '@/lib/services/company-dashboard';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

interface UseCompanyDashboardReturn {
  /** Données du dashboard (à venir par défaut) */
  data: CompanyDashboardData | null;
  /** Chargement en cours (initial) */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
  /** Représentations passées (chargement lazy via `loadPastSlots`) */
  pastSlots: UpcomingSlot[] | null;
  /** Chargement des passées en cours */
  isPastLoading: boolean;
  /** Erreur de chargement des passées */
  pastError: string | null;
  /** Déclenche le chargement lazy des passées (mémoïsé : ne refetch pas si déjà chargé) */
  loadPastSlots: () => Promise<void>;
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

  // État dédié aux représentations passées (lazy)
  const [pastSlots, setPastSlots] = useState<UpcomingSlot[] | null>(null);
  const [isPastLoading, setIsPastLoading] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);

  // Ref pour éviter les race conditions
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const pastFetchInProgressRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    // Éviter les appels simultanés
    if (fetchInProgressRef.current) {
      return;
    }

    fetchInProgressRef.current = true;
    setIsLoading(true);
    setError(null);
    // Reset le cache des passées pour que le prochain toggle refetch
    // (au cas où des annulations / transferts aient créé de nouvelles
    // représentations passées pertinentes).
    setPastSlots(null);
    setPastError(null);

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
      // Garde isMountedRef : évite un setState après démontage si
      // l'événement arrive juste après unmount (cf. audit Cursor A5).
      if (!isMountedRef.current) return;
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

  // ============================================
  // LAZY — Représentations passées
  // ============================================

  const loadPastSlots = useCallback(async () => {
    if (pastFetchInProgressRef.current) return;
    // Si déjà chargé avec succès, ne pas re-fetch (l'utilisateur peut
    // basculer le switch plusieurs fois sans re-déclencher la requête).
    // En cas d'erreur, on garde `pastSlots = null` pour autoriser un
    // nouveau lazy fetch via toggle OFF→ON (cf. audit Cursor A1).
    if (pastSlots !== null) return;

    pastFetchInProgressRef.current = true;
    setIsPastLoading(true);
    setPastError(null);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error(userError?.message || 'Utilisateur non connecté');
      }

      const { companyId, error: companyError } = await getCompanyIdForUser(user.id);
      if (companyError || !companyId) {
        throw new Error(companyError ?? 'Compagnie introuvable');
      }

      // limit=0 → toutes les représentations passées (décision produit :
      // l'historique complet est attendu ; volumétrie typique d'une
      // compagnie ≤ 200 créneaux / saison).
      const result = await getUpcomingSlots(companyId, 0, 'past');

      if (!isMountedRef.current) return;

      if (result.error) {
        setPastError(result.error);
        // NB: on laisse `pastSlots = null` pour que le guard de cache
        // n'empêche pas une nouvelle tentative via toggle.
      } else {
        setPastSlots(result.data);
        setPastError(null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Erreur de chargement';
      logger.error('Erreur loadPastSlots', { message });
      setPastError(message);
      // idem : pas de `setPastSlots([])` pour autoriser le retry.
    } finally {
      if (isMountedRef.current) setIsPastLoading(false);
      pastFetchInProgressRef.current = false;
    }
  }, [pastSlots]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
    pastSlots,
    isPastLoading,
    pastError,
    loadPastSlots,
  };
}
