/**
 * Hook useAdminDashboard
 * Derviche Diffusion
 *
 * Gère l'état et le chargement des données du dashboard admin.
 * Supporte le filtrage automatique pour les externes (spectacles assignés).
 * Gère la période sélectionnée (7j, 30j, saison).
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import {
  getAdminDashboard,
  type AdminDashboardData,
  type DashboardPeriod,
} from '@/lib/services/admin-dashboard';
import type { InternalRole } from '@/types/database';

/** Rôles avec accès complet (tous les menus admin) */
const FULL_ACCESS_ROLES: InternalRole[] = ['super-admin', 'admin'];

interface UseAdminDashboardReturn {
  data: AdminDashboardData | null;
  isLoading: boolean;
  error: string | null;
  /** Rôle de l'utilisateur connecté */
  userRole: InternalRole | null;
  /** L'utilisateur a-t-il un accès complet (super-admin ou admin) ? */
  hasFullAccess: boolean;
  /** Période sélectionnée */
  period: DashboardPeriod;
  /** Changer la période (déclenche un rechargement) */
  setPeriod: (period: DashboardPeriod) => void;
  refresh: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<InternalRole | null>(null);
  const [assignedShowIds, setAssignedShowIds] = useState<string[] | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>('7d');

  // Prevent race conditions
  const isLoadingRef = useRef(false);
  const roleLoadedRef = useRef(false);

  // Charger le rôle et les assignations au montage
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          roleLoadedRef.current = true;
          return;
        }

        // Récupérer le rôle
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError || !roleData) {
          roleLoadedRef.current = true;
          return;
        }

        const role = roleData.role as InternalRole;
        setUserRole(role);
        // Si externe, récupérer les spectacles assignés via slots.hosted_by_id
        // (source de vérité depuis migration 040 — user_show_assignments n'est plus utilisé)
        if (role === 'externe') {
          const { data: slots, error: slotsError } = await supabase
            .from('slots')
            .select('show_id')
            .eq('hosted_by_id', user.id);

          if (slotsError) {
            logger.error('Erreur chargement slots externes', {
              message: slotsError.message,
            });
            setAssignedShowIds([]);
          } else {
            // Dédupliquer les show_ids (un externe peut avoir plusieurs slots par spectacle)
            const showIds = [...new Set((slots ?? []).map((s) => s.show_id as string))];
            setAssignedShowIds(showIds);
          }
        }

        roleLoadedRef.current = true;
      } catch (err) {
        logger.error('Erreur chargement contexte utilisateur', {
          message: err instanceof Error ? err.message : 'Erreur inconnue',
        });
        roleLoadedRef.current = true;
      }
    };

    void loadUserContext();
  }, []);

  const loadDashboard = useCallback(async () => {
    // Attendre que le rôle soit chargé
    if (!roleLoadedRef.current) return;

    // Prevent concurrent loads
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // Préparer les options de filtrage
      const options =
        userRole === 'externe' && assignedShowIds !== null
          ? { assignedShowIds, period }
          : { period };

      const result = await getAdminDashboard(options);

      if (result.error) {
        setError(result.error);
      }

      setData(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [userRole, assignedShowIds, period]);

  // Charger le dashboard une fois le contexte utilisateur connu
  useEffect(() => {
    const roleReady = userRole !== null || roleLoadedRef.current;
    const assignmentsReady = userRole !== 'externe' || assignedShowIds !== null;

    if (roleReady && assignmentsReady) {
      void loadDashboard();
    }
  }, [loadDashboard, userRole, assignedShowIds]);

  const refresh = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  return {
    data,
    isLoading,
    error,
    userRole,
    hasFullAccess: userRole !== null && FULL_ACCESS_ROLES.includes(userRole),
    period,
    setPeriod,
    refresh,
  };
}
