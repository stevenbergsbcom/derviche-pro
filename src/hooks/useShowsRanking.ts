/**
 * Hook useShowsRanking — Classement éditorial des spectacles (migration 111)
 * Derviche Diffusion
 *
 * Utilisé par l'onglet /admin/preferences?tab=classement.
 *
 * Expose :
 *  - `shows`   : liste complète (ordre global : display_order asc, title asc)
 *  - `featured`: sous-liste des is_featured, triée par display_order puis title
 *  - Mutations optimistes : `setFeatured`, `setDisplayOrder`, `reorderAll`,
 *    `reorderFeatured`, `resetGlobalOrder`.
 *
 * Pattern `useRef` synchronisé (comme `useCategories`) pour accès stable au
 * state dans les callbacks sans recréation.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchShowsForRanking,
  reorderShows,
  setShowFeatured as apiSetFeatured,
  setShowDisplayOrder as apiSetDisplayOrder,
  resetGlobalOrder as apiResetGlobalOrder,
  type ShowRanking,
  type RankingMutationResult,
} from '@/lib/services/shows/ranking';
import { logger } from '@/lib/logger';

export interface UseShowsRankingReturn {
  /** Liste brute triée (display_order asc NULLS LAST, title asc). */
  shows: ShowRanking[];
  /** Vedettes triées (display_order asc NULLS LAST, title asc). */
  featured: ShowRanking[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Mutations
  setFeatured: (id: string, value: boolean) => Promise<RankingMutationResult>;
  setDisplayOrder: (id: string, order: number | null) => Promise<RankingMutationResult>;
  /** Réorganise toute la liste selon l'ordre `orderedIds` (index = nouveau display_order). */
  reorderAll: (orderedIds: string[]) => Promise<RankingMutationResult>;
  /** Réorganise uniquement les vedettes. */
  reorderFeatured: (orderedIds: string[]) => Promise<RankingMutationResult>;
  /** Réinitialise tous les display_order à null. */
  resetGlobalOrder: () => Promise<RankingMutationResult>;
}

function sortShows(list: ShowRanking[]): ShowRanking[] {
  return [...list].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title, 'fr');
  });
}

export function useShowsRanking(): UseShowsRankingReturn {
  const [shows, setShows] = useState<ShowRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref synchronisée pour snapshot stable (rollback optimiste sans dep)
  const showsRef = useRef<ShowRanking[]>([]);
  useEffect(() => {
    showsRef.current = shows;
  }, [shows]);

  // ============================================
  // FETCH
  // ============================================

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchShowsForRanking();
    if (result.error) {
      setError(result.error);
      logger.error('useShowsRanking — chargement', { error: result.error });
    } else {
      setShows(sortShows(result.data));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ============================================
  // SET FEATURED
  // ============================================

  const setFeatured = useCallback(
    async (id: string, value: boolean): Promise<RankingMutationResult> => {
      const snapshot = showsRef.current;
      // Optimistic : toggle + (si activation) display_order en fin de liste featured
      const featuredCount = snapshot.filter((s) => s.isFeatured).length;
      const nextOrder = value ? featuredCount : snapshot.find((s) => s.id === id)?.displayOrder ?? null;

      setShows((prev) =>
        sortShows(
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isFeatured: value,
                  displayOrder: value ? nextOrder : s.displayOrder,
                }
              : s,
          ),
        ),
      );

      // Persistance : si on active, on envoie aussi display_order pour positionner
      // en fin de liste vedette (sinon les doublons 0 cassent l'ordre).
      const result = value
        ? await reorderShows([{ id, is_featured: true, display_order: nextOrder }])
        : await apiSetFeatured(id, value);

      if (!result.success) {
        setShows(snapshot); // Rollback
      }
      return result;
    },
    [],
  );

  // ============================================
  // SET DISPLAY ORDER (input numérique unitaire)
  // ============================================

  const setDisplayOrder = useCallback(
    async (id: string, order: number | null): Promise<RankingMutationResult> => {
      const snapshot = showsRef.current;
      setShows((prev) =>
        sortShows(prev.map((s) => (s.id === id ? { ...s, displayOrder: order } : s))),
      );
      const result = await apiSetDisplayOrder(id, order);
      if (!result.success) {
        setShows(snapshot);
      }
      return result;
    },
    [],
  );

  // ============================================
  // REORDER ALL (drag&drop zone 2)
  // ============================================

  const reorderAll = useCallback(
    async (orderedIds: string[]): Promise<RankingMutationResult> => {
      const snapshot = showsRef.current;
      // Optimistic : chaque id dans orderedIds prend un display_order = son index
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
      setShows((prev) =>
        sortShows(
          prev.map((s) =>
            orderMap.has(s.id)
              ? { ...s, displayOrder: orderMap.get(s.id) ?? null }
              : s,
          ),
        ),
      );
      const updates = orderedIds.map((id, i) => ({ id, display_order: i }));
      const result = await reorderShows(updates);
      if (!result.success) {
        setShows(snapshot);
      }
      return result;
    },
    [],
  );

  // ============================================
  // REORDER FEATURED (drag&drop zone 1)
  // ============================================

  const reorderFeatured = useCallback(
    async (orderedIds: string[]): Promise<RankingMutationResult> => {
      const snapshot = showsRef.current;
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
      setShows((prev) =>
        sortShows(
          prev.map((s) =>
            orderMap.has(s.id)
              ? { ...s, displayOrder: orderMap.get(s.id) ?? null }
              : s,
          ),
        ),
      );
      const updates = orderedIds.map((id, i) => ({
        id,
        display_order: i,
        is_featured: true,
      }));
      const result = await reorderShows(updates);
      if (!result.success) {
        setShows(snapshot);
      }
      return result;
    },
    [],
  );

  // ============================================
  // RESET GLOBAL ORDER
  // ============================================

  const resetGlobalOrder = useCallback(async (): Promise<RankingMutationResult> => {
    const snapshot = showsRef.current;
    setShows((prev) => sortShows(prev.map((s) => ({ ...s, displayOrder: null }))));
    const result = await apiResetGlobalOrder();
    if (!result.success) {
      setShows(snapshot);
    }
    return result;
  }, []);

  // ============================================
  // DERIVED
  // ============================================

  const featured = useMemo(() => shows.filter((s) => s.isFeatured), [shows]);

  return {
    shows,
    featured,
    isLoading,
    error,
    refresh: load,
    setFeatured,
    setDisplayOrder,
    reorderAll,
    reorderFeatured,
    resetGlobalOrder,
  };
}
