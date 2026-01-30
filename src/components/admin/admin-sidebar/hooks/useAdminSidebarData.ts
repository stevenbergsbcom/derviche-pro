/**
 * Hook pour charger les données de la sidebar admin
 * @module admin-sidebar/hooks/useAdminSidebarData
 */

import { useMemo, useCallback } from 'react';
import type { InternalRole } from '@/types/database';
import {
  useSidebarUserData,
  type UseSidebarUserDataResult,
} from '@/components/shared-sidebar';
import { ROLE_LABELS, DEFAULT_ROLE_LABEL, ADMIN_NAV_ITEMS } from '../constants';
import type { AdminSidebarUserData, AdminNavItem } from '../types';

/** Query Supabase pour charger le profil admin */
const ADMIN_SELECT_QUERY = `
  first_name,
  last_name,
  email,
  user_roles!inner (role)
`;

/**
 * Résultat du hook admin sidebar
 */
export interface UseAdminSidebarDataResult
  extends UseSidebarUserDataResult<AdminSidebarUserData> {
  /** Items de navigation filtrés selon le rôle */
  filteredNavItems: AdminNavItem[];
}

/**
 * Hook pour charger et gérer les données de la sidebar admin
 * Inclut la logique de filtrage des items par rôle
 */
export function useAdminSidebarData(): UseAdminSidebarDataResult {
  // Transformation des données du profil
  const transformData = useCallback(
    (profile: Record<string, unknown>): AdminSidebarUserData => {
      // Extraire le rôle (peut être un tableau ou un objet)
      const userRoles = profile.user_roles as
        | Array<{ role: string }>
        | { role: string }
        | null;

      let role: InternalRole | null = null;
      let roleLabel = DEFAULT_ROLE_LABEL;

      if (Array.isArray(userRoles) && userRoles.length > 0) {
        role = userRoles[0].role as InternalRole;
        roleLabel = ROLE_LABELS[role] || role;
      } else if (userRoles && typeof userRoles === 'object' && 'role' in userRoles) {
        role = userRoles.role as InternalRole;
        roleLabel = ROLE_LABELS[role] || role;
      }

      return {
        firstName: profile.first_name as string | null,
        lastName: profile.last_name as string | null,
        email: profile.email as string,
        role,
        roleLabel,
      };
    },
    []
  );

  // Utiliser le hook générique
  const { userData, isLoading, displayName } =
    useSidebarUserData<AdminSidebarUserData>({
      selectQuery: ADMIN_SELECT_QUERY,
      transformData,
      contextName: 'admin',
    });

  // Extraire le rôle pour le useMemo (évite l'erreur React Compiler)
  const userRole = userData?.role ?? null;

  // Filtrer les liens de navigation selon le rôle de l'utilisateur
  const filteredNavItems = useMemo(() => {
    // Afficher tous les items pendant le chargement
    if (!userRole) return ADMIN_NAV_ITEMS;

    return ADMIN_NAV_ITEMS.filter((item) => {
      // Si pas de restriction, visible par tous
      if (!item.allowedRoles) return true;
      // Sinon, vérifier que le rôle est dans la liste autorisée
      return item.allowedRoles.includes(userRole);
    });
  }, [userRole]);

  return {
    userData,
    isLoading,
    displayName,
    filteredNavItems,
  };
}
