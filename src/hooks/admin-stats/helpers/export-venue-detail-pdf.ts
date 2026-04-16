/**
 * Export PDF - Détail lieu (drawer latéral)
 * @module hooks/admin-stats/helpers/export-venue-detail-pdf
 *
 * Génère un rapport focalisé sur un seul lieu :
 *  1. Cover : nom du lieu + ville + période
 *  2. KPIs du lieu (4 boxes)
 *  3. Table des spectacles joués dans ce lieu sur la période
 */

import type { VenueDetailRow, VenueStats } from '@/lib/services/admin-stats';

// ============================================
// TYPES
// ============================================

export interface ExportVenueDetailPdfInput {
  summary: VenueStats;
  rows: VenueDetailRow[];
  periodLabel: string;
  from: string;
  to: string;
}

// ============================================
// API PRINCIPALE
// ============================================

export async function exportVenueDetailPdf(
  input: ExportVenueDetailPdfInput,
  filename: string
): Promise<void> {
  const [{ default: jsPDF }, pdfDetail, pdfDetailTables] = await Promise.all([
    import('jspdf'),
    import('./pdf/pdf-detail'),
    import('./pdf/pdf-detail-tables'),
  ]);

  const { renderDetailCover, renderDetailKpis } = pdfDetail;
  const { renderVenueShowsTable } = pdfDetailTables;

  const { PDF_PAGE } = await import('./pdf/pdf-layout');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // --- Page 1 : couverture ---
  renderDetailCover(doc, {
    title: input.summary.venueName,
    subtitle: input.summary.venueCity || undefined,
    periodLabel: input.periodLabel,
    from: input.from,
    to: input.to,
  });

  // --- Page 2 : KPIs + table spectacles joués ---
  doc.addPage();
  let y: number = PDF_PAGE.marginTop;

  // 4 KPIs prioritaires pour la synthèse visuelle (grille 2×2). Absents et
  // presse restent accessibles via le tableau détaillé juste en dessous, pour
  // ne pas surcharger la cover page du PDF.
  y = renderDetailKpis(doc, {
    entries: [
      { label: 'Représentations', value: input.summary.representationsCount },
      { label: 'Spectacles', value: input.summary.showsCount },
      { label: 'Réservations confirmées', value: input.summary.confirmedCount },
      { label: 'Présents', value: input.summary.presentCount },
    ],
    startY: y,
  });

  renderVenueShowsTable(doc, input.rows, y);

  doc.save(filename);
}
