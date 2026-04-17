/**
 * Page /admin/statistiques
 * Derviche Diffusion
 *
 * Phase 1 — filtres, KPIs, tableaux, export CSV/Excel.
 * Phase 2 — drawers détail spectacle + lieu, graphique d'évolution.
 * Phase 3A — comparaison entre périodes (KPIs, tables, chart).
 *
 * Permissions : middleware (RESTRICTED_ADMIN_ROUTES).
 */

'use client';

import { Suspense, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminPageHeader } from '@/components/admin';
import { AlertTriangle } from 'lucide-react';
import {
  DEFAULT_PAGE_SIZE,
  STATS_PERIOD_LABELS,
} from '@/lib/services/admin-stats';
import { useStatsSettings } from '@/hooks/app-settings';
import { useStatsDrawers, useStatsExport, useStatsPage } from './hooks';
import { PAGE_SUBTITLE, PAGE_TITLE } from './constants';
import {
  ShowDetailDrawer,
  ShowsStatsTable,
  StatsChart,
  StatsFilters,
  StatsKpis,
  VenueDetailDrawer,
  VenuesStatsTable,
} from './components';

function StatistiquesContent() {
  const statsSettings = useStatsSettings();

  // Défauts préférences workspace (Phase 4B). Peuvent être `undefined` tant
  // que les settings ne sont pas chargés — les hooks reçoivent alors juste
  // le fallback hardcoded.
  // `useMemo` stabilise la référence pour éviter que le `useEffect`
  // d'application dans `useStatsFilters` ne se re-déclenche à chaque render.
  const statsSettingsData = statsSettings.data;
  const filterDefaults = useMemo(
    () =>
      statsSettingsData
        ? {
            period: statsSettingsData.stats_default_period,
            comparePreset: statsSettingsData.stats_default_compare_preset,
          }
        : undefined,
    [statsSettingsData]
  );
  const pageOptions = useMemo(
    () => (filterDefaults ? { filterDefaults } : undefined),
    [filterDefaults]
  );

  const page = useStatsPage(pageOptions);
  const exportApi = useStatsExport({
    data: page.data,
    state: page.filters,
    bounds: page.bounds,
  });
  const drawers = useStatsDrawers({
    shows: page.data?.shows ?? [],
    showDetail: page.showDetail,
    venueDetail: page.venueDetail,
  });

  const periodLabel = STATS_PERIOD_LABELS[page.filters.period];
  // Affichage conditionnel de la colonne "Évolution" : actif uniquement si la
  // comparaison est activée côté filtres.
  const compareMode = page.filters.compareMode ?? false;

  // Préférences admin (Phase 4A + 4B). Fallback pendant le chargement.
  const hiddenColumnsShows = statsSettings.data?.stats_hidden_columns_shows ?? [];
  const hiddenColumnsVenues = statsSettings.data?.stats_hidden_columns_venues ?? [];
  const pageSize =
    statsSettings.data?.stats_default_page_size ?? DEFAULT_PAGE_SIZE;
  const defaultExportFormat =
    statsSettings.data?.stats_default_export_format ?? 'excel';

  return (
    <div className="space-y-4 md:space-y-6">
      <AdminPageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />

      <StatsFilters
        period={page.filters.period}
        {...(page.filters.from ? { from: page.filters.from } : {})}
        {...(page.filters.to ? { to: page.filters.to } : {})}
        companyIds={page.filters.companyIds}
        venueIds={page.filters.venueIds}
        compareMode={compareMode}
        {...(page.filters.comparePreset
          ? { comparePreset: page.filters.comparePreset }
          : {})}
        defaultExportFormat={defaultExportFormat}
        activeFiltersCount={page.activeFiltersCount}
        isLoading={page.isLoading}
        isExporting={exportApi.isExporting}
        onPeriodChange={page.setPeriod}
        onCustomRangeChange={page.setCustomRange}
        onCompanyIdsChange={page.setCompanyIds}
        onVenueIdsChange={page.setVenueIds}
        onCompareModeChange={page.setCompareMode}
        onComparePresetChange={page.setComparePreset}
        onReset={page.reset}
        onExport={exportApi.exportAs}
      />

      {page.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{page.error}</AlertDescription>
        </Alert>
      )}

      <StatsKpis kpis={page.data?.kpis ?? null} isLoading={page.isLoading} />

      <ShowsStatsTable
        rows={page.data?.shows ?? []}
        isLoading={page.isLoading}
        showCompareColumn={compareMode}
        hiddenColumns={hiddenColumnsShows}
        pageSize={pageSize}
        onRowClick={drawers.openShow}
      />

      <VenuesStatsTable
        rows={page.data?.venues ?? []}
        isLoading={page.isLoading}
        showCompareColumn={compareMode}
        hiddenColumns={hiddenColumnsVenues}
        pageSize={pageSize}
        onRowClick={drawers.openVenue}
      />

      <StatsChart
        data={page.data?.chart ?? []}
        granularity={page.data?.chartGranularity ?? 'day'}
        isLoading={page.isLoading}
      />

      <ShowDetailDrawer
        isOpen={page.showDetail.isOpen}
        summary={drawers.selectedShow}
        periodLabel={periodLabel}
        from={page.bounds?.from ?? ''}
        to={page.bounds?.to ?? ''}
        rows={page.showDetail.data}
        isLoading={page.showDetail.isLoading}
        error={page.showDetail.error}
        onOpenChange={(open) => !open && page.showDetail.close()}
      />

      <VenueDetailDrawer
        isOpen={page.venueDetail.isOpen}
        summary={drawers.selectedVenue}
        periodLabel={periodLabel}
        from={page.bounds?.from ?? ''}
        to={page.bounds?.to ?? ''}
        rows={page.venueDetail.data}
        isLoading={page.venueDetail.isLoading}
        error={page.venueDetail.error}
        onOpenChange={(open) => !open && page.venueDetail.close()}
        onShowClick={drawers.openShowFromVenue}
      />
    </div>
  );
}

export default function StatistiquesPage() {
  return (
    <Suspense fallback={null}>
      <StatistiquesContent />
    </Suspense>
  );
}
