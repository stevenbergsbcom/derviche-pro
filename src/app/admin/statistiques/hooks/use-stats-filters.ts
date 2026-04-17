/**
 * use-stats-filters - Hook de gestion des filtres + synchronisation URL
 * Derviche Diffusion
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ComparePreset, StatsPeriod } from '@/lib/services/admin-stats';
import { DEFAULT_STATS_PERIOD } from '@/lib/services/admin-stats';
import {
  DEFAULT_COMPARE_PRESET,
  parsePeriodStrict,
  searchParamsFromState,
  stateFromSearchParams,
} from './helpers/stats-filters-url';

// ============================================
// TYPES
// ============================================

export interface StatsFiltersState {
  period: StatsPeriod;
  /** Obligatoire si period = 'custom'. Format YYYY-MM-DD. */
  from?: string;
  /** Obligatoire si period = 'custom'. Format YYYY-MM-DD. */
  to?: string;
  companyIds: string[];
  venueIds: string[];
  /** Active la comparaison entre périodes (Phase 3). */
  compareMode?: boolean;
  /** Preset de comparaison utilisé (Phase 3). */
  comparePreset?: ComparePreset;
}

export interface UseStatsFiltersReturn {
  filters: StatsFiltersState;
  setPeriod: (period: StatsPeriod) => void;
  setCustomRange: (from: string, to: string) => void;
  setCompanyIds: (ids: string[]) => void;
  setVenueIds: (ids: string[]) => void;
  setCompareMode: (enabled: boolean) => void;
  setComparePreset: (preset: ComparePreset) => void;
  reset: () => void;
  activeFiltersCount: number;
}

/**
 * Défauts workspace issus des préférences admin. Appliqués seulement si
 * l'URL ne précise pas le paramètre correspondant (bookmarks préservés).
 * Les settings étant chargés de manière async, l'option peut être `undefined`
 * au premier rendu et devenir définie plus tard.
 */
export interface UseStatsFiltersOptions {
  defaults?: {
    period?: StatsPeriod;
    comparePreset?: ComparePreset;
  };
}


// ============================================
// HOOK
// ============================================

export function useStatsFilters(options?: UseStatsFiltersOptions): UseStatsFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<StatsFiltersState>(() =>
    stateFromSearchParams(new URLSearchParams(searchParams.toString()))
  );

  // Snapshot au mount : l'URL contenait-elle un `?period=` VALIDE ? On traite
  // URL manquante et URL invalide de manière identique (fallback préférence),
  // pour éviter qu'un lien corrompu prive l'utilisateur de son défaut workspace.
  const urlHadValidPeriodAtMountRef = useRef<boolean>(
    parsePeriodStrict(
      new URLSearchParams(searchParams.toString()).get('period')
    ) !== null
  );
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

  // Synchroniser les filtres vers l'URL (sans recharger la page)
  useEffect(() => {
    const query = searchParamsFromState(filters);
    const current = searchParams.toString();
    if (query !== current) {
      router.replace(query ? `?${query}` : '?', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Resync state ← URL lors de la navigation arrière/avant (popstate).
  // Les changements d'URL provoqués par setFilters sont ignorés car le state
  // est déjà à jour — la comparaison JSON évite les boucles.
  useEffect(() => {
    const next = stateFromSearchParams(new URLSearchParams(searchParams.toString()));
    setFilters((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [searchParams]);

  // Application des défauts préférences (workspace) une fois qu'ils sont
  // disponibles. N'écrase jamais un paramètre déjà présent dans l'URL au mount.
  useEffect(() => {
    if (hasAppliedDefaults) return;
    if (!options?.defaults) return;

    // Applique `period` uniquement si l'URL d'origine n'en avait pas de valide.
    if (!urlHadValidPeriodAtMountRef.current && options.defaults.period) {
      const defaultPeriod = options.defaults.period;
      setFilters((prev) =>
        prev.period === DEFAULT_STATS_PERIOD && prev.period !== defaultPeriod
          ? { ...prev, period: defaultPeriod, from: undefined, to: undefined }
          : prev
      );
    }
    setHasAppliedDefaults(true);
    // `comparePreset` : appliqué paresseusement via setCompareMode (voir plus bas).
  }, [options?.defaults, hasAppliedDefaults]);

  const setPeriod = useCallback((period: StatsPeriod) => {
    setFilters((prev) => {
      // Bascule vers/quittant 'custom' : on reset les bornes personnalisées
      if (period !== 'custom') {
        return { ...prev, period, from: undefined, to: undefined };
      }
      return { ...prev, period };
    });
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setFilters((prev) => ({ ...prev, period: 'custom', from, to }));
  }, []);

  const setCompanyIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, companyIds: ids }));
  }, []);

  const setVenueIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, venueIds: ids }));
  }, []);

  const defaultComparePresetFromOptions = options?.defaults?.comparePreset;
  const setCompareMode = useCallback(
    (enabled: boolean) => {
      setFilters((prev) => {
        if (!enabled) {
          // On nettoie aussi le preset lorsqu'on désactive la comparaison.
          const next: StatsFiltersState = {
            period: prev.period,
            ...(prev.from !== undefined ? { from: prev.from } : {}),
            ...(prev.to !== undefined ? { to: prev.to } : {}),
            companyIds: prev.companyIds,
            venueIds: prev.venueIds,
          };
          return next;
        }
        // Active la comparaison ; priorité au preset déjà mémorisé, sinon
        // préférence workspace, sinon hardcoded.
        return {
          ...prev,
          compareMode: true,
          comparePreset:
            prev.comparePreset ??
            defaultComparePresetFromOptions ??
            DEFAULT_COMPARE_PRESET,
        };
      });
    },
    [defaultComparePresetFromOptions]
  );

  const setComparePreset = useCallback((preset: ComparePreset) => {
    setFilters((prev) => ({
      ...prev,
      comparePreset: preset,
      // Si l'utilisateur choisit un preset sans avoir activé le mode, on le
      // considère comme un signal d'activation.
      compareMode: prev.compareMode ?? true,
    }));
  }, []);

  const reset = useCallback(() => {
    // Remise à l'état par défaut strict : on omet explicitement compareMode,
    // comparePreset, from et to (tous optionnels). L'effet URL-sync produit
    // ensuite une URL propre, sans paramètres résiduels.
    setFilters({
      period: DEFAULT_STATS_PERIOD,
      companyIds: [],
      venueIds: [],
    });
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.period !== DEFAULT_STATS_PERIOD) count += 1;
    if (filters.companyIds.length > 0) count += 1;
    if (filters.venueIds.length > 0) count += 1;
    if (filters.compareMode) count += 1;
    return count;
  }, [filters]);

  return {
    filters,
    setPeriod,
    setCustomRange,
    setCompanyIds,
    setVenueIds,
    setCompareMode,
    setComparePreset,
    reset,
    activeFiltersCount,
  };
}
