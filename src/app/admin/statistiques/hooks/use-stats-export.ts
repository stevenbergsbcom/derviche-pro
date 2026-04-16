/**
 * use-stats-export - Dispatch des exports (CSV, Excel, PDF)
 * Derviche Diffusion
 *
 * Phase 3B : l'export PDF est désormais fonctionnel. La signature du
 * `exportAs` reste synchrone : l'orchestrateur PDF (qui est async) est
 * enveloppé dans une IIFE afin d'éviter de modifier les appelants.
 */

'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type {
  AdminStatsDataWithComparison,
  ComparePreset,
} from '@/lib/services/admin-stats';
import { STATS_PERIOD_LABELS } from '@/lib/services/admin-stats';
import {
  exportStatsCSV,
  exportStatsExcel,
  exportStatsPdf,
} from '@/hooks/admin-stats';
import { EXPORT_FILENAME_PREFIX } from '../constants';
import type { StatsFiltersState } from './use-stats-filters';

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface UseStatsExportReturn {
  isExporting: boolean;
  exportAs: (format: ExportFormat) => void;
}

// ============================================
// HELPERS
// ============================================

function buildFilename(prefix: string, from: string, to: string, ext: string): string {
  return `${prefix}_${from}_${to}.${ext}`;
}

// ============================================
// HOOK
// ============================================

export interface UseStatsExportProps {
  data: AdminStatsDataWithComparison | null;
  state: StatsFiltersState;
  bounds: { from: string; to: string } | null;
  /** Libellés des compagnies filtrées (optionnel, pour la cover PDF). */
  companyLabels?: string[];
  /** Libellés des lieux filtrés (optionnel, pour la cover PDF). */
  venueLabels?: string[];
}

export function useStatsExport({
  data,
  state,
  bounds,
  companyLabels,
  venueLabels,
}: UseStatsExportProps): UseStatsExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportAs = useCallback(
    (format: ExportFormat) => {
      if (!data || !bounds) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      const periodLabel = STATS_PERIOD_LABELS[state.period];

      if (format === 'pdf') {
        // PDF est async : on enveloppe dans une IIFE pour garder la signature
        // synchrone de `exportAs` (aucun appelant n'a besoin d'await).
        setIsExporting(true);
        void (async () => {
          try {
            const filename = buildFilename(
              EXPORT_FILENAME_PREFIX,
              bounds.from,
              bounds.to,
              'pdf'
            );
            const comparePreset: ComparePreset | undefined = state.comparePreset;
            await exportStatsPdf(
              {
                data,
                periodLabel,
                from: bounds.from,
                to: bounds.to,
                compareMode: !!state.compareMode,
                ...(comparePreset ? { comparePreset } : {}),
                ...(data.compareBounds
                  ? {
                      compareFrom: data.compareBounds.start,
                      compareTo: data.compareBounds.end,
                    }
                  : {}),
                ...(companyLabels && companyLabels.length > 0
                  ? { companyLabels }
                  : {}),
                ...(venueLabels && venueLabels.length > 0
                  ? { venueLabels }
                  : {}),
              },
              filename
            );
            toast.success('Export PDF téléchargé');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur export PDF');
          } finally {
            setIsExporting(false);
          }
        })();
        return;
      }

      setIsExporting(true);
      try {
        if (format === 'csv') {
          exportStatsCSV(
            {
              shows: data.shows,
              venues: data.venues,
              periodLabel,
              from: bounds.from,
              to: bounds.to,
            },
            buildFilename(EXPORT_FILENAME_PREFIX, bounds.from, bounds.to, 'csv')
          );
          toast.success('Export CSV téléchargé');
          return;
        }

        if (format === 'excel') {
          exportStatsExcel(
            { shows: data.shows, venues: data.venues },
            buildFilename(EXPORT_FILENAME_PREFIX, bounds.from, bounds.to, 'xlsx')
          );
          toast.success('Export Excel téléchargé');
          return;
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur export');
      } finally {
        setIsExporting(false);
      }
    },
    [data, state, bounds, companyLabels, venueLabels]
  );

  return { isExporting, exportAs };
}
