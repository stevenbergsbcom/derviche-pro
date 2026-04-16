/**
 * Export PDF - Statistiques admin
 * @module hooks/admin-stats/helpers/export-pdf
 *
 * Orchestre la génération d'un rapport PDF multi-pages :
 *  1. Page de couverture (titre, période, filtres actifs)
 *  2. KPIs + tables (spectacles, lieux) avec deltas optionnels
 *  3. Capture du graphique d'évolution (html2canvas)
 *
 * Les dépendances lourdes (jspdf, html2canvas) sont importées
 * dynamiquement afin de ne pas alourdir le bundle initial.
 */

import type {
  AdminStatsDataWithComparison,
  ComparePreset,
} from '@/lib/services/admin-stats';
import { COMPARE_PRESET_LABELS } from '@/lib/services/admin-stats';

// ============================================
// TYPES
// ============================================

export interface ExportStatsPdfInput {
  data: AdminStatsDataWithComparison;
  periodLabel: string;
  from: string;
  to: string;
  compareMode: boolean;
  comparePreset?: ComparePreset;
  compareFrom?: string;
  compareTo?: string;
  companyLabels?: string[];
  venueLabels?: string[];
  /** Sélecteur DOM de fallback si aucun élément n'est fourni. */
  chartSelector?: string;
}

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_CHART_SELECTOR = '[data-pdf-chart]';

// ============================================
// HELPERS LOCAUX
// ============================================

/** Récupère l'élément DOM du chart (côté client uniquement). */
function findChartElement(selector: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>(selector);
}

// ============================================
// API PRINCIPALE
// ============================================

export async function exportStatsPdf(
  input: ExportStatsPdfInput,
  filename: string
): Promise<void> {
  // Imports dynamiques : jspdf (~400 KB) et modules PDF isolés du bundle initial.
  const [{ default: jsPDF }, pdfModules] = await Promise.all([
    import('jspdf'),
    import('./pdf'),
  ]);

  const {
    renderCover,
    renderKpis,
    renderShowsTable,
    renderVenuesTable,
    renderChart,
    PDF_MAX_Y,
    PDF_PAGE,
  } = pdfModules;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // --- Page 1 : couverture ---
  const compareLabel =
    input.compareMode && input.comparePreset
      ? COMPARE_PRESET_LABELS[input.comparePreset]
      : undefined;

  renderCover(doc, {
    periodLabel: input.periodLabel,
    from: input.from,
    to: input.to,
    ...(input.companyLabels ? { companyLabels: input.companyLabels } : {}),
    ...(input.venueLabels ? { venueLabels: input.venueLabels } : {}),
    ...(compareLabel ? { compareLabel } : {}),
    ...(input.compareFrom ? { compareFrom: input.compareFrom } : {}),
    ...(input.compareTo ? { compareTo: input.compareTo } : {}),
  });

  // --- Page 2 : KPIs + tables ---
  doc.addPage();
  let y: number = PDF_PAGE.marginTop;

  y = renderKpis(doc, {
    kpis: input.data.kpis,
    compareMode: input.compareMode,
    startY: y,
  });

  y = renderShowsTable(doc, input.data.shows, input.compareMode, y);

  // Saut de page si la 2ᵉ table risque de déborder
  if (y > PDF_MAX_Y - 40) {
    doc.addPage();
    y = PDF_PAGE.marginTop;
  }

  y = renderVenuesTable(doc, input.data.venues, input.compareMode, y);

  // --- Dernière section : chart ---
  const chartEl = findChartElement(input.chartSelector ?? DEFAULT_CHART_SELECTOR);

  // Nouvelle page dédiée au chart s'il reste peu de place.
  if (chartEl && y > PDF_MAX_Y - 80) {
    doc.addPage();
    y = PDF_PAGE.marginTop;
  }

  await renderChart(doc, { chartEl, startY: y });

  doc.save(filename);
}
