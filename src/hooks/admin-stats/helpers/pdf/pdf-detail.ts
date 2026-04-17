/**
 * Cover + KPIs PDF pour les exports de drawer (détail spectacle / détail lieu)
 * @module hooks/admin-stats/helpers/pdf/pdf-detail
 *
 * Fournit une cover spécifique (titre + sous-titre centrés) et une grille KPIs
 * générique (pas les 4 labels fixes du pdf-kpis.ts global).
 *
 * Les tables spécifiques (représentations, spectacles joués) sont dans
 * pdf-detail-tables.ts.
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

// ============================================
// COVER DÉDIÉE DRAWER
// ============================================

export interface RenderDetailCoverInput {
  /** Ligne principale (ex: nom du spectacle / lieu). */
  title: string;
  /** Sous-titre (ex: compagnie / ville). */
  subtitle?: string;
  /** Libellé de la période (ex: "Mois en cours"). */
  periodLabel: string;
  /** Bornes exactes. */
  from: string;
  to: string;
}

/** Ligne accent Derviche sous le titre. */
function renderAccentLine(doc: jsPDF, y: number): void {
  const [r, g, b] = PDF_COLORS_RGB.accent;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.6);
  const lineWidth = 60;
  const x = (PDF_PAGE.width - lineWidth) / 2;
  doc.line(x, y, x + lineWidth, y);
}

/** Rend une ligne `Label : valeur` centrée, incrémente et retourne le y. */
function renderInfoRow(doc: jsPDF, label: string, value: string, y: number): number {
  const centerX = PDF_PAGE.width / 2;
  const [mr, mg, mb] = PDF_COLORS_RGB.muted;
  const [tr, tg, tb] = PDF_COLORS_RGB.text;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONTS.body.size);
  const labelText = `${label} :`;
  const labelWidth = doc.getTextWidth(labelText);

  doc.setFont('helvetica', 'bold');
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

export function renderDetailCover(doc: jsPDF, input: RenderDetailCoverInput): void {
  const centerX = PDF_PAGE.width / 2;
  let y = PDF_PAGE.height * 0.3;

  // === Bandeau titre ===
  const [ar, ag, ab] = PDF_COLORS_RGB.accent;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONTS.body.size);
  doc.setTextColor(ar, ag, ab);
  doc.text('Derviche Diffusion — Rapport', centerX, y, { align: 'center' });
  y += 10;

  // === Titre principal ===
  doc.setFont('helvetica', PDF_FONTS.title.style);
  doc.setFontSize(PDF_FONTS.title.size);
  doc.text(input.title, centerX, y, {
    align: 'center',
    maxWidth: PDF_CONTENT_WIDTH,
  });
  y += 9;

  // === Sous-titre ===
  if (input.subtitle) {
    const [mr, mg, mb] = PDF_COLORS_RGB.muted;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONTS.h3.size);
    doc.setTextColor(mr, mg, mb);
    doc.text(input.subtitle, centerX, y, {
      align: 'center',
      maxWidth: PDF_CONTENT_WIDTH,
    });
    y += 7;
  }

  renderAccentLine(doc, y + 2);
  y += 12;

  // === Période ===
  y = renderInfoRow(doc, 'Période', input.periodLabel, y);
  y = renderInfoRow(
    doc,
    'Du',
    `${formatDateFR(input.from)} au ${formatDateFR(input.to)}`,
    y
  );

  // === Footer génération ===
  const footerY = PDF_PAGE.height - PDF_PAGE.marginBottom - 5;
  const [mr, mg, mb] = PDF_COLORS_RGB.muted;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_FONTS.small.size);
  doc.setTextColor(mr, mg, mb);
  doc.text(`Généré le ${formatGeneratedAt()}`, centerX, footerY, {
    align: 'center',
    maxWidth: PDF_CONTENT_WIDTH,
  });
}

// ============================================
// GRILLE KPIs GÉNÉRIQUE (2x2)
// ============================================

export interface DetailKpiEntry {
  label: string;
  value: number;
}

export interface RenderDetailKpisInput {
  entries: DetailKpiEntry[];
  startY: number;
}

function renderDetailKpiCard(
  doc: jsPDF,
  entry: DetailKpiEntry,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const [bgR, bgG, bgB] = PDF_COLORS_RGB.bg;
  const [bdR, bdG, bdB] = PDF_COLORS_RGB.border;
  const [tR, tG, tB] = PDF_COLORS_RGB.text;
  const [mR, mG, mB] = PDF_COLORS_RGB.muted;

  doc.setFillColor(bgR, bgG, bgB);
  doc.setDrawColor(bdR, bdG, bdB);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  doc.setFont('helvetica', PDF_FONTS.kpiLabel.style);
  doc.setFontSize(PDF_FONTS.kpiLabel.size);
  doc.setTextColor(mR, mG, mB);
  doc.text(entry.label, x + width / 2, y + 6, { align: 'center' });

  doc.setFont('helvetica', PDF_FONTS.kpiValue.style);
  doc.setFontSize(PDF_FONTS.kpiValue.size);
  doc.setTextColor(tR, tG, tB);
  doc.text(String(entry.value), x + width / 2, y + 17, { align: 'center' });
}

export function renderDetailKpis(doc: jsPDF, input: RenderDetailKpisInput): number {
  const { entries, startY } = input;
  const gap = 4;
  const cardWidth = (PDF_CONTENT_WIDTH - gap) / 2;
  const cardHeight = 24;
  const baseX = PDF_PAGE.marginX;

  for (let i = 0; i < entries.length; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = baseX + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    renderDetailKpiCard(doc, entries[i], x, y, cardWidth, cardHeight);
  }

  const rowCount = Math.ceil(entries.length / 2);
  return startY + rowCount * (cardHeight + gap) + 4;
}

