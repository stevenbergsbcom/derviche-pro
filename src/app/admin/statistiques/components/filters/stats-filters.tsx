/**
 * StatsFilters - Barre de filtres de la page Statistiques
 * Derviche Diffusion
 */

'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ComparePreset, StatsPeriod } from '@/lib/services/admin-stats';
import { PeriodSelector } from './period-selector';
import { CompanyFilter } from './company-filter';
import { VenueFilter } from './venue-filter';
import { CompareSelector } from './compare-selector';
import { ExportMenu } from './export-menu';
import type { ExportFormat } from '../../hooks/use-stats-export';

export interface StatsFiltersProps {
  period: StatsPeriod;
  from?: string;
  to?: string;
  companyIds: string[];
  venueIds: string[];
  compareMode: boolean;
  comparePreset?: ComparePreset;
  /** Format d'export sélectionné par défaut dans le split button. */
  defaultExportFormat?: ExportFormat;
  activeFiltersCount: number;
  isLoading?: boolean;
  isExporting?: boolean;
  onPeriodChange: (period: StatsPeriod) => void;
  onCustomRangeChange: (from: string, to: string) => void;
  onCompanyIdsChange: (ids: string[]) => void;
  onVenueIdsChange: (ids: string[]) => void;
  onCompareModeChange: (enabled: boolean) => void;
  onComparePresetChange: (preset: ComparePreset) => void;
  onReset: () => void;
  onExport: (format: ExportFormat) => void;
}

export function StatsFilters(props: StatsFiltersProps) {
  const {
    period,
    from,
    to,
    companyIds,
    venueIds,
    compareMode,
    comparePreset,
    defaultExportFormat,
    activeFiltersCount,
    isLoading,
    isExporting,
    onPeriodChange,
    onCustomRangeChange,
    onCompanyIdsChange,
    onVenueIdsChange,
    onCompareModeChange,
    onComparePresetChange,
    onReset,
    onExport,
  } = props;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card/60 p-3">
      <PeriodSelector
        period={period}
        {...(from ? { from } : {})}
        {...(to ? { to } : {})}
        onPeriodChange={onPeriodChange}
        onCustomRangeChange={onCustomRangeChange}
      />

      <div className="flex items-end gap-2">
        <CompanyFilter selectedIds={companyIds} onChange={onCompanyIdsChange} />
        <VenueFilter selectedIds={venueIds} onChange={onVenueIdsChange} />
      </div>

      <CompareSelector
        enabled={compareMode}
        {...(comparePreset ? { preset: comparePreset } : {})}
        period={period}
        {...(isLoading !== undefined ? { disabled: isLoading } : {})}
        onEnabledChange={onCompareModeChange}
        onPresetChange={onComparePresetChange}
      />

      <div className="ml-auto flex items-center gap-2">
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={activeFiltersCount === 0}
          size="sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <ExportMenu
          onExport={onExport}
          disabled={isLoading}
          {...(defaultExportFormat ? { defaultFormat: defaultExportFormat } : {})}
          {...(isExporting !== undefined ? { isExporting } : {})}
        />
      </div>
    </div>
  );
}
