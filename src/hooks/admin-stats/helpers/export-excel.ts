/**
 * Export Excel - Statistiques admin
 * @module hooks/admin-stats/helpers/export-excel
 *
 * Produit un classeur XLSX avec deux feuilles ("Spectacles", "Lieux")
 * et auto-ajustement des colonnes.
 */

import * as XLSX from 'xlsx';
import { downloadExcel } from '@/lib/utils/export-helpers';
import type { ShowStats, VenueStats } from '@/lib/services/admin-stats';

// ============================================
// CONSTANTES
// ============================================

const MAX_COLUMN_WIDTH = 50;
const COLUMN_WIDTH_MARGIN = 2;

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

// ============================================
// HELPERS
// ============================================

function calculateWidths(
  headers: string[],
  rows: (string | number)[][]
): XLSX.ColInfo[] {
  return headers.map((header, colIdx) => {
    const maxDataLen = rows.reduce((max, r) => {
      const v = r[colIdx];
      const len = v !== undefined && v !== null ? String(v).length : 0;
      return len > max ? len : max;
    }, 0);
    const width = Math.min(
      Math.max(header.length, maxDataLen) + COLUMN_WIDTH_MARGIN,
      MAX_COLUMN_WIDTH
    );
    return { wch: width };
  });
}

function buildSheet(
  headers: string[],
  rows: (string | number)[][]
): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = calculateWidths(headers, rows);
  return sheet;
}

// ============================================
// API
// ============================================

export interface ExportStatsExcelInput {
  shows: ShowStats[];
  venues: VenueStats[];
}

export function exportStatsExcel(input: ExportStatsExcelInput, filename: string): void {
  const workbook = XLSX.utils.book_new();

  const showRows = input.shows.map((s) => [
    s.showTitle,
    s.companyName,
    s.representationsCount,
    s.confirmedCount,
    s.cancelledCount,
    s.presentCount,
    s.absentCount,
    s.pressCount,
  ] as (string | number)[]);

  const venueRows = input.venues.map((v) => [
    v.venueName,
    v.venueCity,
    v.representationsCount,
    v.showsCount,
    v.confirmedCount,
    v.presentCount,
    v.absentCount,
    v.pressCount,
  ] as (string | number)[]);

  XLSX.utils.book_append_sheet(
    workbook,
    buildSheet(SHOWS_HEADERS, showRows),
    'Spectacles'
  );

  XLSX.utils.book_append_sheet(
    workbook,
    buildSheet(VENUES_HEADERS, venueRows),
    'Lieux'
  );

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadExcel(new Uint8Array(buffer), filename);
}
