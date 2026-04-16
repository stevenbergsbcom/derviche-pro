/**
 * use-stats-data - Fetch des données stats (KPIs + shows + venues)
 * Derviche Diffusion
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { getSeasonSettings } from '@/lib/services/app-settings';
import type { SeasonSettings } from '@/lib/services/app-settings';
import {
  getAdminStats,
  resolveStatsBounds,
  type AdminStatsData,
  type StatsFilters,
} from '@/lib/services/admin-stats';
import type { StatsFiltersState } from './use-stats-filters';

// ============================================
// TYPES
// ============================================

export interface UseStatsDataReturn {
  data: AdminStatsData | null;
  isLoading: boolean;
  error: string | null;
  /** Bornes effectivement utilisées (résolues depuis la période). */
  bounds: { from: string; to: string } | null;
  /** Recharge manuel. */
  refresh: () => void;
}

// ============================================
// DÉFAUTS
// ============================================

const DEFAULT_SEASON: SeasonSettings = { season_start: '09-01', season_end: '06-30' };

// ============================================
// HOOK
// ============================================

export function useStatsData(state: StatsFiltersState): UseStatsDataReturn {
  const [season, setSeason] = useState<SeasonSettings>(DEFAULT_SEASON);
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Requête ID pour ignorer les réponses obsolètes
  const requestIdRef = useRef(0);

  // Charger les paramètres de saison une seule fois
  useEffect(() => {
    let cancelled = false;
    void getSeasonSettings().then((res) => {
      if (cancelled) return;
      if (res.data) setSeason(res.data);
      else if (res.error) {
        logger.warn('[admin/statistiques] Erreur lecture saison, fallback', {
          error: res.error,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Résolution des bornes depuis la période sélectionnée
  const bounds = useMemo(() => {
    const b = resolveStatsBounds({
      period: state.period,
      from: state.from,
      to: state.to,
      season,
    });
    return { from: b.start, to: b.end };
  }, [state.period, state.from, state.to, season]);

  // Stabiliser les dépendances des arrays
  const companiesKey = state.companyIds.join(',');
  const venuesKey = state.venueIds.join(',');

  const load = useCallback(async () => {
    const filters: StatsFilters = {
      from: bounds.from,
      to: bounds.to,
      companyIds: state.companyIds.length ? state.companyIds : undefined,
      venueIds: state.venueIds.length ? state.venueIds : undefined,
    };

    const reqId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    const result = await getAdminStats(filters);

    // Ignorer si une nouvelle requête a été émise entre-temps
    if (reqId !== requestIdRef.current) return;

    if (result.error) setError(result.error);
    setData(result.data);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.from, bounds.to, companiesKey, venuesKey]);

  // Charger à chaque changement de filtres
  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    bounds,
    refresh: () => {
      void load();
    },
  };
}
