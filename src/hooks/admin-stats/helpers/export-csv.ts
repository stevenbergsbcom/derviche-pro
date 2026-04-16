/**
 * Export CSV - Statistiques admin
 * @module hooks/admin-stats/helpers/export-csv
 *
 * Produit un fichier CSV à deux sections (Spectacles, Lieux) avec une
 * en-tête résumant la période sélectionnée.
 */

import { downloadCSV } from '@/lib/utils/export-helpers';
import type { ShowStats, VenueStats } from '@/lib/services/admin-stats';

// ============================================
// CONSTANTES
// ============================================

/** BOM UTF-8 pour compatibilité Excel (mêmes caractères spéciaux affichés). */
const UTF8_BOM = '\uFEFF';

const CSV_SEPARATOR = ';';

// ============================================
// HELPERS
// ============================================

/** Échappe une cellule CSV (délimite + double quotes si nécessaire). */
function escapeCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes(',')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: (string | number)[]): string {
  return cells.map(escapeCell).join(CSV_SEPARATOR);
}

// ============================================
// SECTIONS
// ============================================

const SHOWS_HEADERS = [
  'Spectacle',
  'Compagnie',
  'Représentations',
  'Confirmées',
  'Annulées',
  'Présents',
  'Absents',
  'Presse',
];

const VENUES_HEADERS = [
  'Lieu',
  'Ville',
  'Représentations',
  'Spectacles distincts',
  'Confirmées',
  'Présents',
  'Absents',
  'Presse',
];

function showsSection(shows: ShowStats[]): string {
  const lines = [row(SHOWS_HEADERS)];
  for (const s of shows) {
    lines.push(row([
      s.showTitle,
      s.companyName,
      s.representationsCount,
      s.confirmedCount,
      s.cancelledCount,
      s.presentCount,
      s.absentCount,
      s.pressCount,
    ]));
  }
  return lines.join('\n');
}

function venuesSection(venues: VenueStats[]): string {
  const lines = [row(VENUES_HEADERS)];
  for (const v of venues) {
    lines.push(row([
      v.venueName,
      v.venueCity,
      v.representationsCount,
      v.showsCount,
      v.confirmedCount,
      v.presentCount,
      v.absentCount,
      v.pressCount,
    ]));
  }
  return lines.join('\n');
}

// ============================================
// API
// ============================================

export interface ExportStatsCSVInput {
  shows: ShowStats[];
  venues: VenueStats[];
  /** Résumé de la période affiché en tête du fichier. */
  periodLabel: string;
  from: string;
  to: string;
}

export function exportStatsCSV(input: ExportStatsCSVInput, filename: string): void {
  const header = [
    row(['Statistiques Derviche Diffusion']),
    row(['Période', input.periodLabel]),
    row(['Du', input.from, 'Au', input.to]),
    '',
  ].join('\n');

  const content = [
    UTF8_BOM + header,
    row(['Par spectacle']),
    showsSection(input.shows),
    '',
    row(['Par lieu']),
    venuesSection(input.venues),
  ].join('\n');

  downloadCSV(content, filename);
}
