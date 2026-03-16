/**
 * Hook orchestrateur pour la page admin/spectacles
 * Compose les sous-hooks et retourne l'API publique
 * S191 - Refactoring : split en useSpectacleFilters + useSpectacleCrud
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Hooks Supabase
import { useShows } from '@/hooks/useShows';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useCategories } from '@/hooks/useCategories';
import { useTargetAudiences } from '@/hooks/useTargetAudiences';
import { useCompanies } from '@/hooks/useCompanies';
import { useInternalUsers } from '@/hooks/useInternalUsers';

// Helpers locaux
import {
  transformShowsToDisplay,
  transformCategoriesToOptions,
  transformTargetAudiencesToOptions,
  transformCompaniesToOptions,
  transformInternalUsersToOptions,
} from '../helpers';

// Sous-hooks
import { useCopyLink } from './useCopyLink';
import { useSpectacleFilters } from './useSpectacleFilters';
import { useSpectacleCrud } from './useSpectacleCrud';

export function useSpectaclesPage() {
  const router = useRouter();

  // ============================================================================
  // Hooks Supabase
  // ============================================================================

  const {
    shows: rawShows,
    isLoading: isLoadingShows,
    error: showsError,
    refresh: refreshShows,
    create: createShow,
    update: updateShow,
    remove: removeShow,
    checkUsage: checkShowUsage,
    generateSlug,
  } = useShows();

  const {
    categories: rawCategories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refresh: refreshCategories,
    create: createCategory,
    remove: removeCategory,
    checkUsage: checkCategoryUsage,
  } = useCategories();

  const {
    targetAudiences: rawTargetAudiences,
    isLoading: isLoadingTargetAudiences,
    error: targetAudiencesError,
    refresh: refreshTargetAudiences,
    create: createTargetAudience,
    remove: removeTargetAudience,
    checkUsage: checkTargetAudienceUsage,
  } = useTargetAudiences();

  const {
    companies: rawCompanies,
    isLoading: isLoadingCompanies,
    error: companiesError,
    refresh: refreshCompanies,
    create: createCompany,
  } = useCompanies();

  const {
    users: rawInternalUsers,
    isLoading: isLoadingInternalUsers,
    error: internalUsersError,
    refresh: refreshInternalUsers,
  } = useInternalUsers();

  const {
    hasFullAccess,
    isExterne,
    assignedShowIds,
    isLoading: isLoadingPermissions,
  } = useAdminPermissions();

  // Hook de copie de lien
  const { copiedShowId, copyError, copyLink, clearCopyError } = useCopyLink();

  // ============================================================================
  // Hydratation SSR
  // ============================================================================

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================================================
  // Données transformées (useMemo)
  // ============================================================================

  const shows = useMemo(
    () => transformShowsToDisplay(rawShows, rawCategories),
    [rawShows, rawCategories]
  );

  const categoryOptions = useMemo(
    () => transformCategoriesToOptions(rawCategories),
    [rawCategories]
  );

  const targetAudiences = useMemo(
    () => transformTargetAudiencesToOptions(rawTargetAudiences),
    [rawTargetAudiences]
  );

  const companies = useMemo(
    () => transformCompaniesToOptions(rawCompanies),
    [rawCompanies]
  );

  const dervisheUsers = useMemo(
    () => transformInternalUsersToOptions(rawInternalUsers),
    [rawInternalUsers]
  );

  // ============================================================================
  // Sous-hooks composés
  // ============================================================================

  const filters = useSpectacleFilters({
    shows,
    isExterne,
    assignedShowIds,
  });

  const crud = useSpectacleCrud({
    rawShows,
    shows,
    rawCategories,
    rawTargetAudiences,
    createShow,
    updateShow,
    removeShow,
    checkShowUsage: checkShowUsage,
    generateSlug,
    createCategory,
    removeCategory,
    checkCategoryUsage: checkCategoryUsage,
    createTargetAudience,
    removeTargetAudience,
    checkTargetAudienceUsage: checkTargetAudienceUsage,
    createCompany,
  });

  // ============================================================================
  // États dérivés globaux
  // ============================================================================

  const isLoading =
    isLoadingShows ||
    isLoadingCategories ||
    isLoadingTargetAudiences ||
    isLoadingCompanies ||
    isLoadingInternalUsers ||
    isLoadingPermissions;

  const loadingError =
    showsError || categoriesError || targetAudiencesError || companiesError || internalUsersError;

  const handleRefetch = useCallback(async () => {
    await Promise.all([
      refreshShows(),
      refreshCategories(),
      refreshTargetAudiences(),
      refreshCompanies(),
      refreshInternalUsers(),
    ]);
  }, [refreshShows, refreshCategories, refreshTargetAudiences, refreshCompanies, refreshInternalUsers]);

  const handleNavigateToRepresentations = useCallback((showId: string) => {
    router.push(`/admin/spectacles/${showId}/representations`);
  }, [router]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    isMounted,
    isLoading,
    loadingError,
    shows,
    rawShows,
    rawCategories,
    rawTargetAudiences,
    categoryOptions,
    targetAudiences,
    companies,
    dervisheUsers,
    hasFullAccess,
    // Filtres et tri
    ...filters,
    // CRUD et modales
    ...crud,
    // Navigation et actions globales
    handleRefetch,
    handleNavigateToRepresentations,
    // Copie de lien
    copiedShowId,
    copyError,
    copyLink,
    clearCopyError,
  };
}
