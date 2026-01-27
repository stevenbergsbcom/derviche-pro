/**
 * Hook useAdminPermissions
 * Derviche Diffusion
 * 
 * Gère les permissions et accès des utilisateurs admin
 * Détecte le rôle et récupère les spectacles assignés pour les externes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { InternalRole } from '@/types/database';

/** Rôles avec accès admin complet */
const FULL_ACCESS_ROLES: InternalRole[] = ['super-admin', 'admin'];

interface UseAdminPermissionsReturn {
  /** Rôle de l'utilisateur connecté */
  userRole: InternalRole | null;
  /** L'utilisateur a-t-il un accès complet (super-admin ou admin) ? */
  hasFullAccess: boolean;
  /** L'utilisateur est-il un externe ? */
  isExterne: boolean;
  /** IDs des spectacles assignés (uniquement pour les externes, null sinon) */
  assignedShowIds: string[] | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Rafraîchir les données */
  refresh: () => Promise<void>;
}

export function useAdminPermissions(): UseAdminPermissionsReturn {
  const [userRole, setUserRole] = useState<InternalRole | null>(null);
  const [assignedShowIds, setAssignedShowIds] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserRole(null);
        setAssignedShowIds(null);
        setIsLoading(false);
        return;
      }

      // Récupérer le rôle
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !roleData) {
        setUserRole(null);
        setError('Impossible de récupérer le rôle utilisateur');
        setIsLoading(false);
        return;
      }

      const role = roleData.role as InternalRole;
      setUserRole(role);

      // Si externe, récupérer les spectacles assignés via slots.hosted_by_id
      if (role === 'externe') {
        // hosted_by_id contient directement l'ID utilisateur (auth.users.id)
        const { data: slots, error: slotsError } = await supabase
          .from('slots')
          .select('show_id')
          .eq('hosted_by_id', user.id);

        if (slotsError) {
          setError('Impossible de récupérer les spectacles assignés');
          setAssignedShowIds([]);
        } else {
          // Extraire les show_id uniques
          const uniqueShowIds = [...new Set(slots?.map(s => s.show_id) || [])];
          setAssignedShowIds(uniqueShowIds);
        }
      } else {
        // Pour admin/super-admin, pas de filtrage
        setAssignedShowIds(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  return {
    userRole,
    hasFullAccess: userRole !== null && FULL_ACCESS_ROLES.includes(userRole),
    isExterne: userRole === 'externe',
    assignedShowIds,
    isLoading,
    error,
    refresh: loadPermissions,
  };
}
