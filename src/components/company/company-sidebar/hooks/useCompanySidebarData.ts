/**
 * Hook pour charger les données de la sidebar company
 * @module company-sidebar/hooks/useCompanySidebarData
 */

import { useCallback } from 'react';
import {
  useSidebarUserData,
  type UseSidebarUserDataResult,
} from '@/components/shared-sidebar';
import type { CompanySidebarUserData } from '../types';

/** Query Supabase pour charger le profil company */
const COMPANY_SELECT_QUERY = `
  first_name,
  last_name,
  email,
  companies:company_id (name)
`;

/**
 * Hook pour charger les données de la sidebar company
 * Inclut le nom de la compagnie associée
 */
export function useCompanySidebarData(): UseSidebarUserDataResult<CompanySidebarUserData> {
  // Transformation des données du profil
  const transformData = useCallback(
    (profile: Record<string, unknown>): CompanySidebarUserData => {
      // Extraire le nom de la compagnie
      const company = profile.companies as { name: string } | null;

      return {
        firstName: profile.first_name as string | null,
        lastName: profile.last_name as string | null,
        email: profile.email as string,
        companyName: company?.name || null,
      };
    },
    []
  );

  return useSidebarUserData<CompanySidebarUserData>({
    selectQuery: COMPANY_SELECT_QUERY,
    transformData,
    contextName: 'company',
  });
}
