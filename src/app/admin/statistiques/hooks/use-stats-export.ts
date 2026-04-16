/**
 * use-stats-export - Dispatch des exports (CSV, Excel)
 * Derviche Diffusion
 *
 * Le PDF est explicitement différé en Phase 3 ; on exporte un type
 * `ExportFormat` qui accepte déjà `pdf` pour que l'UI puisse afficher
 * l'option "grisée" sans casser le typage.
 */

'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { AdminStatsData } from '@/lib/services/admin-stats';
import { STATS_PERIOD_LABELS } from '@/lib/services/admin-stats';
import {
  exportStatsCSV,
  exportStatsExcel,
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
  data: AdminStatsData | null;
  state: StatsFiltersState;
  bounds: { from: string; to: string } | null;
}

export function useStatsExport({ data, state, bounds }: UseStatsExportProps): UseStatsExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportAs = useCallback(
    (format: ExportFormat) => {
      if (!data || !bounds) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      if (format === 'pdf') {
        toast.info('L\'export PDF arrive bientôt');
        return;
      }

      setIsExporting(true);
      try {
        const periodLabel = STATS_PERIOD_LABELS[state.period];

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
    [data, state, bounds]
  );

  return { isExporting, exportAs };
}
