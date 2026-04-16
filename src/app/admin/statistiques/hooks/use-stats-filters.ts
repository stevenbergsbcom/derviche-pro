/**
 * use-stats-filters - Hook de gestion des filtres + synchronisation URL
 * Derviche Diffusion
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ComparePreset, StatsPeriod } from '@/lib/services/admin-stats';
import { DEFAULT_STATS_PERIOD } from '@/lib/services/admin-stats';

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

// ============================================
// CONSTANTES
// ============================================

const VALID_PERIODS: readonly StatsPeriod[] = [
  'month_current',
  'month_previous',
  'season_current',
  'year_current',
  'all',
  'custom',
];

const VALID_COMPARE_PRESETS: readonly ComparePreset[] = [
  'year_before',
  'previous_equivalent',
  'previous_season',
];

const DEFAULT_COMPARE_PRESET: ComparePreset = 'year_before';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// HELPERS
// ============================================

function parsePeriod(raw: string | null): StatsPeriod {
  if (raw && (VALID_PERIODS as readonly string[]).includes(raw)) {
    return raw as StatsPeriod;
  }
  return DEFAULT_STATS_PERIOD;
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_REGEX.test(s));
}

function parseDate(raw: string | null): string | undefined {
  if (raw && DATE_REGEX.test(raw)) return raw;
  return undefined;
}

function parseCompareMode(raw: string | null): boolean {
  return raw === '1';
}

function parseComparePreset(raw: string | null): ComparePreset | undefined {
  if (raw && (VALID_COMPARE_PRESETS as readonly string[]).includes(raw)) {
    return raw as ComparePreset;
  }
  return undefined;
}

function stateFromSearchParams(params: URLSearchParams): StatsFiltersState {
  const compareMode = parseCompareMode(params.get('compareMode'));
  const parsedPreset = parseComparePreset(params.get('comparePreset'));
  return {
    period: parsePeriod(params.get('period')),
    from: parseDate(params.get('from')),
    to: parseDate(params.get('to')),
    companyIds: parseIds(params.get('companies')),
    venueIds: parseIds(params.get('venues')),
    ...(compareMode ? { compareMode: true } : {}),
    ...(compareMode
      ? { comparePreset: parsedPreset ?? DEFAULT_COMPARE_PRESET }
      : parsedPreset
        ? { comparePreset: parsedPreset }
        : {}),
  };
}

function searchParamsFromState(state: StatsFiltersState): string {
  const params = new URLSearchParams();
  if (state.period !== DEFAULT_STATS_PERIOD) params.set('period', state.period);
  if (state.period === 'custom') {
    if (state.from) params.set('from', state.from);
    if (state.to) params.set('to', state.to);
  }
  if (state.companyIds.length > 0) params.set('companies', state.companyIds.join(','));
  if (state.venueIds.length > 0) params.set('venues', state.venueIds.join(','));
  if (state.compareMode) {
    params.set('compareMode', '1');
    if (state.comparePreset) params.set('comparePreset', state.comparePreset);
  }
  return params.toString();
}

// ============================================
// HOOK
// ============================================

export function useStatsFilters(): UseStatsFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<StatsFiltersState>(() =>
    stateFromSearchParams(new URLSearchParams(searchParams.toString()))
  );

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

  const setCompareMode = useCallback((enabled: boolean) => {
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
      // Active la comparaison ; applique un preset par défaut si absent.
      return {
        ...prev,
        compareMode: true,
        comparePreset: prev.comparePreset ?? DEFAULT_COMPARE_PRESET,
      };
    });
  }, []);

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
    setFilters({
      period: DEFAULT_STATS_PERIOD,
      from: undefined,
      to: undefined,
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
