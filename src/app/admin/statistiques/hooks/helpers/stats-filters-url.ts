/**
 * Parsers & serializers URL ↔ StatsFiltersState
 * Derviche Diffusion
 *
 * Extrait de `use-stats-filters.ts` pour rester sous la règle des 300 lignes
 * et isoler la logique de sérialisation réutilisable.
 */

import type { ComparePreset, StatsPeriod } from '@/lib/services/admin-stats';
import { DEFAULT_STATS_PERIOD } from '@/lib/services/admin-stats';
import type { StatsFiltersState } from '../use-stats-filters';

// ============================================
// CONSTANTES
// ============================================

export const VALID_PERIODS: readonly StatsPeriod[] = [
  'month_current',
  'month_previous',
  'season_current',
  'year_current',
  'all',
  'custom',
];

export const VALID_COMPARE_PRESETS: readonly ComparePreset[] = [
  'year_before',
  'previous_equivalent',
  'previous_season',
];

export const DEFAULT_COMPARE_PRESET: ComparePreset = 'year_before';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// PARSERS
// ============================================

/** Parse `?period=` avec validation stricte. Retourne `null` si absent ou
 *  invalide — le consommateur décide du fallback. */
export function parsePeriodStrict(raw: string | null): StatsPeriod | null {
  if (raw && (VALID_PERIODS as readonly string[]).includes(raw)) {
    return raw as StatsPeriod;
  }
  return null;
}

/** Parse `?period=` avec fallback sur le défaut système. */
export function parsePeriod(raw: string | null): StatsPeriod {
  return parsePeriodStrict(raw) ?? DEFAULT_STATS_PERIOD;
}

export function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_REGEX.test(s));
}

export function parseDate(raw: string | null): string | undefined {
  if (raw && DATE_REGEX.test(raw)) return raw;
  return undefined;
}

export function parseCompareMode(raw: string | null): boolean {
  return raw === '1';
}

export function parseComparePreset(raw: string | null): ComparePreset | undefined {
  if (raw && (VALID_COMPARE_PRESETS as readonly string[]).includes(raw)) {
    return raw as ComparePreset;
  }
  return undefined;
}

// ============================================
// URL ↔ STATE
// ============================================

export function stateFromSearchParams(params: URLSearchParams): StatsFiltersState {
  const compareMode = parseCompareMode(params.get('compareMode'));
  const parsedPreset = parseComparePreset(params.get('comparePreset'));
  // `comparePreset` sans `compareMode=1` n'a pas de sens métier : on l'ignore
  // pour éviter un état hybride (preset mémorisé mais compa désactivée).
  return {
    period: parsePeriod(params.get('period')),
    from: parseDate(params.get('from')),
    to: parseDate(params.get('to')),
    companyIds: parseIds(params.get('companies')),
    venueIds: parseIds(params.get('venues')),
    ...(compareMode
      ? {
          compareMode: true,
          comparePreset: parsedPreset ?? DEFAULT_COMPARE_PRESET,
        }
      : {}),
  };
}

export function searchParamsFromState(state: StatsFiltersState): string {
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
