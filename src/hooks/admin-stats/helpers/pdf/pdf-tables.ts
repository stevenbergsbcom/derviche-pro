/**
 * Rendu des tables (spectacles + lieux) via jspdf-autotable
 * @module hooks/admin-stats/helpers/pdf/pdf-tables
 *
 * Utilise `autoTable(doc, options)` (fonction standalone, v5) pour obtenir
 * des tables au texte sélectionnable, paginées automatiquement.
 * Le mode comparaison ajoute une colonne « Évolution » qui hérite de la
 * couleur du delta (vert / rouge).
 */

import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  DeltaValue,
  ShowStatsWithDelta,
  VenueStatsWithDelta,
} from '@/lib/services/admin-stats';
import { PDF_COLORS_RGB, PDF_FONTS, PDF_PAGE } from './pdf-layout';

/** Formatte un delta sous forme de chaîne courte pour la cell table. */
function formatDeltaCell(delta?: DeltaValue): string {
  if (!delta) return '—';
  const sign = delta.delta > 0 ? '+' : '';
  const pct = delta.deltaPercent === null ? '—' : `${sign}${delta.deltaPercent}%`;
  return `${sign}${delta.delta} (${pct})`;
}

/** Récupère la dernière position Y finale après autoTable. */
function getLastAutoTableFinalY(doc: jsPDF): number {
  // jspdf-autotable expose lastAutoTable sur le doc ; typage volontairement lâche.
  const d = doc as unknown as { lastAutoTable?: { finalY?: number } };
  return d.lastAutoTable?.finalY ?? 0;
}

/** Style de header commun (fond accent Derviche, texte blanc). */
const HEAD_STYLES = {
  fillColor: [...PDF_COLORS_RGB.accent] as [number, number, number],
  textColor: [...PDF_COLORS_RGB.white] as [number, number, number],
  fontStyle: 'bold' as const,
  fontSize: 9,
  halign: 'left' as const,
};

/** Style de rangées alternées (fond clair). */
const ALT_ROW_STYLES = {
  fillColor: [...PDF_COLORS_RGB.bg] as [number, number, number],
};

/** Style de corps commun (texte Derviche). */
const BODY_STYLES = {
  fontSize: 8,
  textColor: [...PDF_COLORS_RGB.text] as [number, number, number],
};

/** Rend un titre de section juste avant une table. */
function renderSectionTitle(doc: jsPDF, title: string, y: number): number {
  const [tR, tG, tB] = PDF_COLORS_RGB.accent;
  doc.setFont('helvetica', PDF_FONTS.h2.style);
  doc.setFontSize(PDF_FONTS.h2.size);
  doc.setTextColor(tR, tG, tB);
  doc.text(title, PDF_PAGE.marginX, y);
  return y + 4;
}

/**
 * Applique une couleur au texte selon le signe du delta. La colonne delta
 * stocke un marker interne pour identifier le signe sans re-parser.
 */
function applyDeltaColorFromRaw(
  raw: unknown
): [number, number, number] | undefined {
  const d = Number(raw);
  if (!Number.isFinite(d) || d === 0) return undefined;
  return d > 0 ? PDF_COLORS_RGB.success : PDF_COLORS_RGB.danger;
}

export function renderShowsTable(
  doc: jsPDF,
  shows: ShowStatsWithDelta[],
  compareMode: boolean,
  startY: number
): number {
  let y = renderSectionTitle(doc, 'Par spectacle', startY);

  const columns = compareMode
    ? [
        'Spectacle',
        'Compagnie',
        'Représ.',
        'Confirmées',
        'Évolution',
        'Présents',
        'Absents',
        'Presse',
      ]
    : ['Spectacle', 'Compagnie', 'Représ.', 'Confirmées', 'Présents', 'Absents', 'Presse'];

  const rows = shows.map((s) => {
    const base = [
      s.showTitle,
      s.companyName,
      s.representationsCount,
      s.confirmedCount,
    ];
    const tail = [s.presentCount, s.absentCount, s.pressCount];
    if (compareMode) {
      return [...base, formatDeltaCell(s.confirmedCountDelta), ...tail];
    }
    return [...base, ...tail];
  });

  const deltaColumnIndex = compareMode ? 4 : -1;

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: y,
    theme: 'striped',
    headStyles: HEAD_STYLES,
    bodyStyles: BODY_STYLES,
    alternateRowStyles: ALT_ROW_STYLES,
    margin: { left: PDF_PAGE.marginX, right: PDF_PAGE.marginX },
    didParseCell: (data) => {
      if (
        compareMode &&
        data.section === 'body' &&
        data.column.index === deltaColumnIndex
      ) {
        // Récupère le delta numérique correspondant à la ligne parsée.
        const show = shows[data.row.index];
        const color = applyDeltaColorFromRaw(show?.confirmedCountDelta?.delta);
        if (color) {
          data.cell.styles.textColor = [...color] as [number, number, number];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  y = getLastAutoTableFinalY(doc) + 10;
  return y;
}

export function renderVenuesTable(
  doc: jsPDF,
  venues: VenueStatsWithDelta[],
  compareMode: boolean,
  startY: number
): number {
  let y = renderSectionTitle(doc, 'Par lieu', startY);

  const columns = compareMode
    ? [
        'Lieu',
        'Ville',
        'Représ.',
        'Spectacles',
        'Confirmées',
        'Évolution',
        'Présents',
        'Absents',
        'Presse',
      ]
    : [
        'Lieu',
        'Ville',
        'Représ.',
        'Spectacles',
        'Confirmées',
        'Présents',
        'Absents',
        'Presse',
      ];

  const rows = venues.map((v) => {
    const base = [
      v.venueName,
      v.venueCity,
      v.representationsCount,
      v.showsCount,
      v.confirmedCount,
    ];
    const tail = [v.presentCount, v.absentCount, v.pressCount];
    if (compareMode) {
      return [...base, formatDeltaCell(v.confirmedCountDelta), ...tail];
    }
    return [...base, ...tail];
  });

  const deltaColumnIndex = compareMode ? 5 : -1;

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: y,
    theme: 'striped',
    headStyles: HEAD_STYLES,
    bodyStyles: BODY_STYLES,
    alternateRowStyles: ALT_ROW_STYLES,
    margin: { left: PDF_PAGE.marginX, right: PDF_PAGE.marginX },
    didParseCell: (data) => {
      if (
        compareMode &&
        data.section === 'body' &&
        data.column.index === deltaColumnIndex
      ) {
        const venue = venues[data.row.index];
        const color = applyDeltaColorFromRaw(venue?.confirmedCountDelta?.delta);
        if (color) {
          data.cell.styles.textColor = [...color] as [number, number, number];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  y = getLastAutoTableFinalY(doc) + 10;
  return y;
}
