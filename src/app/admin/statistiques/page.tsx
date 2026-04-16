/**
 * Page /admin/statistiques
 * Derviche Diffusion
 *
 * Phase 1 (MVP) — filtres (période, compagnies, lieux), KPIs, tableaux
 * spectacles & lieux, export CSV/Excel.
 *
 * Permissions : contrôlées par le middleware (RESTRICTED_ADMIN_ROUTES).
 * Pas de contrôle supplémentaire côté client.
 */

'use client';

import { Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminPageHeader } from '@/components/admin';
import { AlertTriangle } from 'lucide-react';
import { useStatsPage, useStatsExport } from './hooks';
import { PAGE_SUBTITLE, PAGE_TITLE } from './constants';
import { StatsFilters, StatsKpis, ShowsStatsTable, VenuesStatsTable } from './components';

// ============================================
// COMPOSANT INTERNE (useSearchParams → Suspense requis)
// ============================================

function StatistiquesContent() {
  const page = useStatsPage();
  const exportApi = useStatsExport({
    data: page.data,
    state: page.filters,
    bounds: page.bounds,
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <AdminPageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />

      <StatsFilters
        period={page.filters.period}
        {...(page.filters.from ? { from: page.filters.from } : {})}
        {...(page.filters.to ? { to: page.filters.to } : {})}
        companyIds={page.filters.companyIds}
        venueIds={page.filters.venueIds}
        activeFiltersCount={page.activeFiltersCount}
        isLoading={page.isLoading}
        isExporting={exportApi.isExporting}
        onPeriodChange={page.setPeriod}
        onCustomRangeChange={page.setCustomRange}
        onCompanyIdsChange={page.setCompanyIds}
        onVenueIdsChange={page.setVenueIds}
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

      <ShowsStatsTable rows={page.data?.shows ?? []} isLoading={page.isLoading} />

      <VenuesStatsTable rows={page.data?.venues ?? []} isLoading={page.isLoading} />
    </div>
  );
}

// ============================================
// EXPORT — wrappé dans <Suspense> pour useSearchParams
// ============================================

export default function StatistiquesPage() {
  return (
    <Suspense fallback={null}>
      <StatistiquesContent />
    </Suspense>
  );
}
