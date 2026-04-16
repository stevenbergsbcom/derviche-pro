/**
 * Page de couverture du PDF stats
 * @module hooks/admin-stats/helpers/pdf/pdf-cover
 *
 * Rend une page unique centrée visuellement avec :
 *  - Titre principal « Statistiques Derviche Diffusion »
 *  - Libellé de période + bornes
 *  - Filtres actifs (compagnies, lieux) si précisés
 *  - Bornes de comparaison si active
 *  - Date et heure de génération
 */

import type jsPDF from 'jspdf';
import {
  PDF_COLORS_RGB,
  PDF_CONTENT_WIDTH,
  PDF_FONTS,
  PDF_PAGE,
  formatDateFR,
  formatGeneratedAt,
} from './pdf-layout';

export interface RenderCoverInput {
  periodLabel: string;
  from: string;
  to: string;
  companyLabels?: string[];
  venueLabels?: string[];
  compareLabel?: string;
  compareFrom?: string;
  compareTo?: string;
}

/** Ligne discrète sous le titre (séparateur horizontal accent Derviche). */
function renderAccentLine(doc: jsPDF, y: number): void {
  const [r, g, b] = PDF_COLORS_RGB.accent;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.6);
  const lineWidth = 60;
  const x = (PDF_PAGE.width - lineWidth) / 2;
  doc.line(x, y, x + lineWidth, y);
}

/** Rend une rangée `Label : valeur` centrée, incrémente et retourne le nouveau y. */
function renderInfoRow(doc: jsPDF, label: string, value: string, y: number): number {
  const centerX = PDF_PAGE.width / 2;
  const [mr, mg, mb] = PDF_COLORS_RGB.muted;
  const [tr, tg, tb] = PDF_COLORS_RGB.text;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONTS.body.size);
  doc.setTextColor(mr, mg, mb);
  const labelText = `${label} :`;
  const labelWidth = doc.getTextWidth(labelText);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(tr, tg, tb);
  const valueWidth = doc.getTextWidth(value);

  const totalWidth = labelWidth + 3 + valueWidth;
  const startX = centerX - totalWidth / 2;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mr, mg, mb);
  doc.text(labelText, startX, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(tr, tg, tb);
  doc.text(value, startX + labelWidth + 3, y);

  return y + 7;
}

/** Tronque une liste d'items pour éviter un débordement horizontal. */
function joinWithEllipsis(items: string[], maxItems = 4): string {
  if (items.length === 0) return '—';
  if (items.length <= maxItems) return items.join(', ');
  const visible = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  return `${visible.join(', ')} (+${remaining})`;
}

export function renderCover(doc: jsPDF, input: RenderCoverInput): void {
  const centerX = PDF_PAGE.width / 2;
  // Point de départ visuel : ~35% de la hauteur de page
  let y = PDF_PAGE.height * 0.32;

  // === Titre principal ===
  const [ar, ag, ab] = PDF_COLORS_RGB.accent;
  doc.setFont('helvetica', PDF_FONTS.title.style);
  doc.setFontSize(PDF_FONTS.title.size);
  doc.setTextColor(ar, ag, ab);
  doc.text('Statistiques', centerX, y, { align: 'center' });
  y += 9;
  doc.text('Derviche Diffusion', centerX, y, { align: 'center' });
  y += 8;

  renderAccentLine(doc, y);
  y += 12;

  // === Bloc informatif ===
  y = renderInfoRow(doc, 'Période', input.periodLabel, y);
  y = renderInfoRow(
    doc,
    'Du',
    `${formatDateFR(input.from)} au ${formatDateFR(input.to)}`,
    y
  );

  if (input.companyLabels && input.companyLabels.length > 0) {
    y = renderInfoRow(doc, 'Compagnies', joinWithEllipsis(input.companyLabels), y);
  }
  if (input.venueLabels && input.venueLabels.length > 0) {
    y = renderInfoRow(doc, 'Lieux', joinWithEllipsis(input.venueLabels), y);
  }

  if (input.compareLabel) {
    y += 4;
    y = renderInfoRow(doc, 'Comparé à', input.compareLabel, y);
    if (input.compareFrom && input.compareTo) {
      y = renderInfoRow(
        doc,
        'Période comparée',
        `${formatDateFR(input.compareFrom)} au ${formatDateFR(input.compareTo)}`,
        y
      );
    }
  }

  // === Footer : date de génération ===
  const footerY = PDF_PAGE.height - PDF_PAGE.marginBottom - 5;
  const [mr, mg, mb] = PDF_COLORS_RGB.muted;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONTS.small.size);
  doc.setTextColor(mr, mg, mb);
  doc.text(
    `Généré le ${formatGeneratedAt()}`,
    centerX,
    footerY,
    { align: 'center', maxWidth: PDF_CONTENT_WIDTH }
  );
}
