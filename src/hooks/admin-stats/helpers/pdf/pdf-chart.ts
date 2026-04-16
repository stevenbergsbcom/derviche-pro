/**
 * Capture du graphique d'évolution via html2canvas puis insertion dans le PDF
 * @module hooks/admin-stats/helpers/pdf/pdf-chart
 *
 * Si l'élément cible n'est pas trouvé (chart replié, page sans chart),
 * on renvoie simplement la position Y courante sans planter.
 */

import type jsPDF from 'jspdf';
import { logger } from '@/lib/logger';
import {
  PDF_COLORS_RGB,
  PDF_CONTENT_WIDTH,
  PDF_FONTS,
  PDF_MAX_Y,
  PDF_PAGE,
} from './pdf-layout';

export interface RenderChartInput {
  /** Élément DOM contenant le chart à capturer. Peut être null. */
  chartEl: HTMLElement | null;
  startY: number;
}

/** Rend un titre de section avant l'image du chart. */
function renderSectionTitle(doc: jsPDF, title: string, y: number): number {
  const [tR, tG, tB] = PDF_COLORS_RGB.accent;
  doc.setFont('helvetica', PDF_FONTS.h2.style);
  doc.setFontSize(PDF_FONTS.h2.size);
  doc.setTextColor(tR, tG, tB);
  doc.text(title, PDF_PAGE.marginX, y);
  return y + 4;
}

/** Ajoute une page si startY + requiredHeight dépasse la zone imprimable. */
function ensureSpace(
  doc: jsPDF,
  startY: number,
  requiredHeight: number
): number {
  if (startY + requiredHeight > PDF_MAX_Y) {
    doc.addPage();
    return PDF_PAGE.marginTop;
  }
  return startY;
}

export async function renderChart(
  doc: jsPDF,
  input: RenderChartInput
): Promise<number> {
  if (!input.chartEl) {
    // Graceful fallback : pas de chart à exporter (ex: chart replié côté UI).
    return input.startY;
  }

  try {
    // Import dynamique : html2canvas est isolé du bundle principal.
    const html2canvasMod = await import('html2canvas');
    const html2canvas = html2canvasMod.default;

    const canvas = await html2canvas(input.chartEl, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = PDF_CONTENT_WIDTH;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    // Espace nécessaire : titre (~7mm) + image + petite marge basse
    const requiredHeight = 7 + imgHeight + 4;
    let y = ensureSpace(doc, input.startY, requiredHeight);

    y = renderSectionTitle(doc, 'Évolution des réservations', y);
    doc.addImage(imgData, 'PNG', PDF_PAGE.marginX, y, imgWidth, imgHeight);

    return y + imgHeight + 6;
  } catch (err) {
    logger.warn('[admin/statistiques] Capture du chart PDF échouée', {
      error: err instanceof Error ? err.message : String(err),
    });
    // On retourne la position courante pour poursuivre l'export sans chart.
    return input.startY;
  }
}
