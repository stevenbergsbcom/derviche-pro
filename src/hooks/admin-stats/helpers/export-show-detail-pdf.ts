/**
 * Export PDF - Détail spectacle (drawer latéral)
 * @module hooks/admin-stats/helpers/export-show-detail-pdf
 *
 * Génère un rapport focalisé sur un seul spectacle :
 *  1. Cover : titre du spectacle + compagnie + période
 *  2. KPIs du spectacle (4 boxes)
 *  3. Table des représentations sur la période
 *
 * Réutilise les helpers pdf/pdf-detail.ts. Les dépendances lourdes (jspdf)
 * sont importées dynamiquement pour ne pas alourdir le bundle initial.
 */

import type { ShowDetailRow, ShowStats } from '@/lib/services/admin-stats';

// ============================================
// TYPES
// ============================================

export interface ExportShowDetailPdfInput {
  summary: ShowStats;
  rows: ShowDetailRow[];
  periodLabel: string;
  from: string;
  to: string;
}

// ============================================
// API PRINCIPALE
// ============================================

export async function exportShowDetailPdf(
  input: ExportShowDetailPdfInput,
  filename: string
): Promise<void> {
  const [{ default: jsPDF }, pdfDetail, pdfDetailTables] = await Promise.all([
    import('jspdf'),
    import('./pdf/pdf-detail'),
    import('./pdf/pdf-detail-tables'),
  ]);

  const { renderDetailCover, renderDetailKpis } = pdfDetail;
  const { renderRepresentationsTable } = pdfDetailTables;

  const { PDF_PAGE } = await import('./pdf/pdf-layout');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // --- Page 1 : couverture ---
  renderDetailCover(doc, {
    title: input.summary.showTitle,
    subtitle: input.summary.companyName || undefined,
    periodLabel: input.periodLabel,
    from: input.from,
    to: input.to,
  });

  // --- Page 2 : KPIs + table représentations ---
  doc.addPage();
  let y: number = PDF_PAGE.marginTop;

  // 4 KPIs prioritaires pour la synthèse visuelle (grille 2×2). La colonne
  // "Presse" et les capacités restent accessibles via le tableau détaillé
  // juste en dessous.
  y = renderDetailKpis(doc, {
    entries: [
      { label: 'Représentations', value: input.summary.representationsCount },
      { label: 'Réservations confirmées', value: input.summary.confirmedCount },
      { label: 'Présents', value: input.summary.presentCount },
      { label: 'Absents', value: input.summary.absentCount },
    ],
    startY: y,
  });

  renderRepresentationsTable(doc, input.rows, y);

  doc.save(filename);
}
