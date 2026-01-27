/**
 * Hook useAdminDashboard
 * Derviche Diffusion
 * 
 * Gère l'état et le chargement des données du dashboard admin
 * Supporte le filtrage automatique pour les externes (spectacles assignés)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getAdminDashboard,
  type AdminDashboardData,
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
  refresh: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<InternalRole | null>(null);
  const [assignedShowIds, setAssignedShowIds] = useState<string[] | null>(null);
  
  // Prevent race conditions
  const isLoadingRef = useRef(false);
  const roleLoadedRef = useRef(false);

  // Charger le rôle et les assignations au montage
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

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

        // Si externe, récupérer les spectacles assignés
        if (role === 'externe') {
          const { data: assignments, error: assignError } = await supabase
            .from('user_show_assignments')
            .select('show_id')
            .eq('user_id', user.id);

          if (!assignError && assignments) {
            const showIds = assignments.map(a => a.show_id);
            setAssignedShowIds(showIds);
          } else {
            // Pas d'assignations = aucun accès
            setAssignedShowIds([]);
          }
        }

        roleLoadedRef.current = true;
      } catch (err) {
        console.error('Erreur chargement contexte utilisateur:', err);
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
      const options = userRole === 'externe' && assignedShowIds !== null
        ? { assignedShowIds }
        : undefined;

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
  }, [userRole, assignedShowIds]);

  // Charger le dashboard une fois le contexte utilisateur connu
  useEffect(() => {
    // Attendre que le rôle soit chargé
    // Pour admin/super-admin : userRole !== null suffit
    // Pour externe : userRole !== null ET assignedShowIds !== null
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
    refresh,
  };
}
