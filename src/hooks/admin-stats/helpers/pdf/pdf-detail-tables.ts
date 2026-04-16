/**
 * Tables PDF pour les rapports focalisés des drawers
 * @module hooks/admin-stats/helpers/pdf/pdf-detail-tables
 *
 * - renderRepresentationsTable : table des représentations (drawer spectacle)
 * - renderVenueShowsTable      : table des spectacles joués (drawer lieu)
 *
 * Utilise jspdf-autotable v5 (fonction standalone).
 */

import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ShowDetailRow,
  VenueDetailRow,
} from '@/lib/services/admin-stats';
import { PDF_COLORS_RGB, PDF_FONTS, PDF_PAGE, formatDateFR } from './pdf-layout';

// ============================================
// STYLES COMMUNS
// ============================================

const HEAD_STYLES = {
  fillColor: [...PDF_COLORS_RGB.accent] as [number, number, number],
  textColor: [...PDF_COLORS_RGB.white] as [number, number, number],
  fontStyle: 'bold' as const,
  fontSize: 9,
  halign: 'left' as const,
};

const BODY_STYLES = {
  fontSize: 8,
  textColor: [...PDF_COLORS_RGB.text] as [number, number, number],
};

const ALT_ROW_STYLES = {
  fillColor: [...PDF_COLORS_RGB.bg] as [number, number, number],
};

// ============================================
// HELPERS LOCAUX
// ============================================

function getLastAutoTableFinalY(doc: jsPDF): number {
  const d = doc as unknown as { lastAutoTable?: { finalY?: number } };
  return d.lastAutoTable?.finalY ?? 0;
}

function renderSectionTitle(doc: jsPDF, title: string, y: number): number {
  const [tR, tG, tB] = PDF_COLORS_RGB.accent;
  doc.setFont('helvetica', PDF_FONTS.h2.style);
  doc.setFontSize(PDF_FONTS.h2.size);
  doc.setTextColor(tR, tG, tB);
  doc.text(title, PDF_PAGE.marginX, y);
  return y + 4;
}

// ============================================
// API PUBLIQUE
// ============================================

/** Rend la table des représentations d'un spectacle. */
export function renderRepresentationsTable(
  doc: jsPDF,
  rows: ShowDetailRow[],
  startY: number
): number {
  let y = renderSectionTitle(doc, 'Représentations sur la période', startY);

  const columns = [
    'Date',
    'Heure',
    'Lieu',
    'Ville',
    'Capacité',
    'Confirmées',
    'Présents',
    'Absents',
    'Presse',
  ];

  const body = rows.map((r) => [
    formatDateFR(r.slotDate),
    r.slotTime,
    r.venueName,
    r.venueCity,
    r.capacity,
    r.confirmedCount,
    r.presentCount,
    r.absentCount,
    r.pressCount,
  ]);

  autoTable(doc, {
    head: [columns],
    body,
    startY: y,
    theme: 'striped',
    headStyles: HEAD_STYLES,
    bodyStyles: BODY_STYLES,
    alternateRowStyles: ALT_ROW_STYLES,
    margin: { left: PDF_PAGE.marginX, right: PDF_PAGE.marginX },
  });

  y = getLastAutoTableFinalY(doc) + 10;
  return y;
}

/** Rend la table des spectacles joués dans un lieu. */
export function renderVenueShowsTable(
  doc: jsPDF,
  rows: VenueDetailRow[],
  startY: number
): number {
  let y = renderSectionTitle(doc, 'Spectacles joués dans ce lieu', startY);

  const columns = [
    'Spectacle',
    'Compagnie',
    'Représ.',
    'Confirmées',
    'Présents',
    'Absents',
    'Presse',
  ];

  const body = rows.map((r) => [
    r.showTitle,
    r.companyName,
    r.representationsCount,
    r.confirmedCount,
    r.presentCount,
    r.absentCount,
    r.pressCount,
  ]);

  autoTable(doc, {
    head: [columns],
    body,
    startY: y,
    theme: 'striped',
    headStyles: HEAD_STYLES,
    bodyStyles: BODY_STYLES,
    alternateRowStyles: ALT_ROW_STYLES,
    margin: { left: PDF_PAGE.marginX, right: PDF_PAGE.marginX },
  });

  y = getLastAutoTableFinalY(doc) + 10;
  return y;
}
