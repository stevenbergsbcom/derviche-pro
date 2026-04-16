/**
 * Rendu des KPIs dans le PDF (4 boxes en grille 2x2)
 * @module hooks/admin-stats/helpers/pdf/pdf-kpis
 *
 * Affiche 4 KPIs sous forme de cartes arrondies. Quand la comparaison
 * est active, chaque carte intègre un badge delta (↑/↓ + pourcentage).
 */

import type jsPDF from 'jspdf';
import type {
  DeltaValue,
  StatsKpisWithDelta,
} from '@/lib/services/admin-stats';
import {
  PDF_COLORS_RGB,
  PDF_CONTENT_WIDTH,
  PDF_FONTS,
  PDF_PAGE,
} from './pdf-layout';

export interface RenderKpisInput {
  kpis: StatsKpisWithDelta;
  compareMode: boolean;
  startY: number;
}

interface KpiEntry {
  label: string;
  value: number;
  delta?: DeltaValue;
}

/** Formatte le badge de delta en texte court (ex: "↑ +15 (+12%)"). */
function formatDeltaText(delta: DeltaValue): {
  text: string;
  color: [number, number, number];
} {
  const { delta: d, deltaPercent } = delta;
  const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '◆';
  const sign = d > 0 ? '+' : '';
  const pctText = deltaPercent === null ? '—' : `${sign}${deltaPercent}%`;
  const text = `${arrow} ${sign}${d} (${pctText})`;

  const color: [number, number, number] =
    d > 0
      ? PDF_COLORS_RGB.success
      : d < 0
        ? PDF_COLORS_RGB.danger
        : PDF_COLORS_RGB.muted;

  return { text, color };
}

/** Rend une carte KPI individuelle dans un cadre (x,y) de largeur w. */
function renderKpiCard(
  doc: jsPDF,
  entry: KpiEntry,
  x: number,
  y: number,
  width: number,
  height: number,
  compareMode: boolean
): void {
  const [bgR, bgG, bgB] = PDF_COLORS_RGB.bg;
  const [bdR, bdG, bdB] = PDF_COLORS_RGB.border;
  const [tR, tG, tB] = PDF_COLORS_RGB.text;
  const [mR, mG, mB] = PDF_COLORS_RGB.muted;

  // Fond + bordure
  doc.setFillColor(bgR, bgG, bgB);
  doc.setDrawColor(bdR, bdG, bdB);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Label en haut
  doc.setFont('helvetica', PDF_FONTS.kpiLabel.style);
  doc.setFontSize(PDF_FONTS.kpiLabel.size);
  doc.setTextColor(mR, mG, mB);
  doc.text(entry.label, x + width / 2, y + 6, { align: 'center' });

  // Valeur principale
  doc.setFont('helvetica', PDF_FONTS.kpiValue.style);
  doc.setFontSize(PDF_FONTS.kpiValue.size);
  doc.setTextColor(tR, tG, tB);
  const valueY = compareMode && entry.delta ? y + 15 : y + 17;
  doc.text(String(entry.value), x + width / 2, valueY, { align: 'center' });

  // Delta (si compare mode et delta présent)
  if (compareMode && entry.delta) {
    const { text, color } = formatDeltaText(entry.delta);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONTS.small.size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x + width / 2, y + height - 3, { align: 'center' });
  }
}

export function renderKpis(doc: jsPDF, input: RenderKpisInput): number {
  const { kpis, compareMode, startY } = input;

  const entries: KpiEntry[] = [
    {
      label: 'Réservations confirmées',
      value: kpis.totalConfirmed,
      ...(kpis.totalConfirmedDelta ? { delta: kpis.totalConfirmedDelta } : {}),
    },
    {
      label: 'Places confirmées',
      value: kpis.totalPlacesConfirmed,
      ...(kpis.totalPlacesConfirmedDelta
        ? { delta: kpis.totalPlacesConfirmedDelta }
        : {}),
    },
    {
      label: 'Annulations',
      value: kpis.totalCancelled,
      ...(kpis.totalCancelledDelta ? { delta: kpis.totalCancelledDelta } : {}),
    },
    {
      label: 'Spectacles',
      value: kpis.totalShows,
      ...(kpis.totalShowsDelta ? { delta: kpis.totalShowsDelta } : {}),
    },
  ];

  // Grille 2x2
  const gap = 4;
  const cardWidth = (PDF_CONTENT_WIDTH - gap) / 2;
  const cardHeight = compareMode ? 28 : 24;
  const baseX = PDF_PAGE.marginX;

  for (let i = 0; i < entries.length; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = baseX + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    renderKpiCard(doc, entries[i], x, y, cardWidth, cardHeight, compareMode);
  }

  const rowCount = Math.ceil(entries.length / 2);
  return startY + rowCount * (cardHeight + gap) + 4;
}
