/**
 * Hook useCheckinAccess
 * Gestion de l'accès et des données pour l'interface d'accueil
 * Derviche Diffusion
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import {
  getAccessibleShows,
  getAccessibleSlots,
  type CheckinShow,
  type CheckinSlot,
} from '@/lib/services/checkin';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface UseCheckinAccessReturn {
  /** Spectacles accessibles */
  shows: CheckinShow[];
  /** Chargement des spectacles en cours */
  isLoadingShows: boolean;
  /** Erreur lors du chargement des spectacles */
  showsError: string | null;

  /** Représentations du spectacle sélectionné */
  slots: CheckinSlot[];
  /** Chargement des représentations en cours */
  isLoadingSlots: boolean;
  /** Erreur lors du chargement des représentations */
  slotsError: string | null;

  /** Rôle de l'utilisateur */
  role: string | null;
  /** ID de la compagnie (si rôle company) */
  companyId: string | null;
  /** Nom de la compagnie (si rôle company) */
  companyName: string | null;
  /** L'utilisateur est-il admin (super-admin ou admin) ? */
  isAdmin: boolean;
  /** Chargement de l'auth en cours */
  isAuthLoading: boolean;

  /** Charger les spectacles accessibles */
  loadShows: () => Promise<void>;
  /** Charger les représentations d'un spectacle */
  loadSlots: (showSlug: string) => Promise<void>;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useCheckinAccess(): UseCheckinAccessReturn {
  // Auth
  const { user, role, isLoading: isAuthLoading } = useCurrentUserRole();
  
  // State pour company info
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  // State shows
  const [shows, setShows] = useState<CheckinShow[]>([]);
  const [isLoadingShows, setIsLoadingShows] = useState(false);
  const [showsError, setShowsError] = useState<string | null>(null);

  // State slots
  const [slots, setSlots] = useState<CheckinSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Ref pour éviter les race conditions
  const mountedRef = useRef(true);
  const currentShowSlugRef = useRef<string | null>(null);

  // Déterminer si admin (avec vérification explicite de null)
  const isAdmin = role !== null && (role === 'super-admin' || role === 'admin');

  // Charger les infos compagnie si nécessaire
  useEffect(() => {
    async function loadCompanyInfo() {
      if (!user || role !== 'company') {
        setCompanyId(null);
        setCompanyName(null);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            company_id,
            companies (
              name
            )
          `)
          .eq('id', user.id)
          .single();

        if (error || !data) {
          logger.error('useCheckinAccess - Erreur chargement company info', { error });
          return;
        }

        setCompanyId(data.company_id);
        
        // Extraire le nom de la compagnie
        const companies = data.companies as unknown as { name: string } | null;
        setCompanyName(companies?.name || null);
        
      } catch (err) {
        logger.error('useCheckinAccess - Exception chargement company info', { err });
      }
    }

    void loadCompanyInfo();
  }, [user, role]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Charger les spectacles
  const loadShows = useCallback(async () => {
    if (!user || !role) {
      setShows([]);
      return;
    }

    // Pour company, attendre que companyId soit chargé
    if (role === 'company' && companyId === null) {
      return;
    }

    setIsLoadingShows(true);
    setShowsError(null);

    try {
      const result = await getAccessibleShows(user.id, role, companyId);

      if (!mountedRef.current) return;

      if (result.error) {
        setShowsError(result.error);
        setShows([]);
      } else {
        setShows(result.data);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setShowsError(message);
      setShows([]);
    } finally {
      if (mountedRef.current) {
        setIsLoadingShows(false);
      }
    }
  }, [user, role, companyId]);

  // Charger les représentations d'un spectacle
  const loadSlots = useCallback(async (showSlug: string) => {
    if (!user || !role) {
      setSlots([]);
      return;
    }

    currentShowSlugRef.current = showSlug;
    setIsLoadingSlots(true);
    setSlotsError(null);

    try {
      const result = await getAccessibleSlots(showSlug, user.id, role, companyId);

      if (!mountedRef.current) return;
      if (currentShowSlugRef.current !== showSlug) return; // Requête obsolète

      if (result.error) {
        setSlotsError(result.error);
        setSlots([]);
      } else {
        setSlots(result.data);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setSlotsError(message);
      setSlots([]);
    } finally {
      if (mountedRef.current) {
        setIsLoadingSlots(false);
      }
    }
  }, [user, role, companyId]);

  // Rafraîchir toutes les données
  const refresh = useCallback(async () => {
    await loadShows();
    if (currentShowSlugRef.current) {
      await loadSlots(currentShowSlugRef.current);
    }
  }, [loadShows, loadSlots]);

  // Charger les spectacles au montage (une fois auth prêt)
  useEffect(() => {
    if (!isAuthLoading && user && role) {
      // Pour company, attendre companyId
      if (role === 'company' && companyId === null) {
        return;
      }
      void loadShows();
    }
  }, [isAuthLoading, user, role, companyId, loadShows]);

  return {
    shows,
    isLoadingShows,
    showsError,
    slots,
    isLoadingSlots,
    slotsError,
    role,
    companyId,
    companyName,
    isAdmin,
    isAuthLoading,
    loadShows,
    loadSlots,
    refresh,
  };
}
