/**
 * Hook pour SpectacleViewDialog
 * Derviche Diffusion - Session 110
 * 
 * Gère les données dérivées du spectacle
 */

import { useMemo } from 'react';
import type { ShowWithRelations } from '@/lib/services/shows';
import type { ShowCategoryRow, TargetAudienceRow } from '@/types/database';
import type { DervisheUser, DerivedShowData } from '../types';
import { getCategoryNames, getTargetAudienceNames, getManagerName } from '../utils';

// ============================================
// TYPES
// ============================================

interface UseSpectacleViewParams {
  show: ShowWithRelations | null;
  categories: ShowCategoryRow[];
  targetAudiences: TargetAudienceRow[];
  dervisheUsers: DervisheUser[];
}

interface UseSpectacleViewReturn {
  /** Données dérivées calculées */
  derivedData: DerivedShowData;
  /** Le dialog est-il ouvert ? */
  isOpen: boolean;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook pour calculer les données dérivées d'un spectacle
 */
export function useSpectacleView({
  show,
  categories,
  targetAudiences,
  dervisheUsers,
}: UseSpectacleViewParams): UseSpectacleViewReturn {
  
  // Calcul des données dérivées avec mémoïsation
  const derivedData = useMemo<DerivedShowData>(() => {
    if (!show) {
      return {
        categoryNames: [],
        audienceNames: [],
        managerName: null,
      };
    }

    return {
      categoryNames: getCategoryNames(show.category_ids, categories),
      audienceNames: getTargetAudienceNames(show.target_audience_ids, targetAudiences),
      managerName: getManagerName(show.derviche_manager_id, dervisheUsers),
    };
  }, [show, categories, targetAudiences, dervisheUsers]);

  return {
    derivedData,
    isOpen: show !== null,
  };
}
