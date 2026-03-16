/**
 * Helpers d'export pour les réservations compagnie
 * Derviche Diffusion
 *
 * Fonctions utilitaires pures pour la génération CSV/Excel.
 */

import * as XLSX from 'xlsx';
import type {
  CompanyReservation,
  CompanyReservationFilters,
  CompanyExportColumn,
} from '@/lib/services/company-reservations';
import type { ExportFormat, ExportPeriod } from './types';
import { formatDateExport } from '@/lib/utils/format-date';

// ============================================
// LABELS
// ============================================

/** Labels des colonnes pour l'export */
const EXPORT_COLUMN_LABELS: Record<CompanyExportColumn, string> = {
  date: 'Date représentation',
  spectacle: 'Spectacle',
  venue: 'Lieu',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  emailSecondary: 'Email secondaire',
  phoneSecondary: 'Tél. secondaire',
  organization: 'Structure',
  function: 'Fonction',
  afcNumber: 'N° AFC',
  address: 'Adresse complète',
  numPlaces: 'Nb places',
  status: 'Statut',
  checkinStatus: 'Check-in',
  specialRequests: 'Demandes spéciales',
  checkinNotes: 'Notes check-in',
  checkinVenueNotes: 'Notes lieu',
  createdAt: 'Créé le',
};

// ============================================
// TRADUCTIONS
// ============================================

/** Traduit le statut réservation */
function translateStatus(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'Confirmée',
    cancelled: 'Annulée',
    no_show: 'No-show',
  };
  return map[status] || status;
}

/** Traduit le statut check-in */
function translateCheckin(status: string | null): string {
  if (!status) return '-';
  const map: Record<string, string> = {
    present_loved: 'A aimé',
    present_press: 'Presse',
    present_neutral: 'Neutre',
    absent: 'Absent',
  };
  return map[status] || status;
}

// formatDateExport importé depuis @/lib/utils/format-date

// ============================================
// CELL VALUE
// ============================================

/** Obtient la valeur d'une colonne pour l'export */
function getCellValue(col: CompanyExportColumn, r: CompanyReservation): string {
  switch (col) {
    case 'date':
      return r.slot?.date ? formatDateExport(r.slot.date) : '-';
    case 'spectacle':
      return r.slot?.show?.title || '-';
    case 'venue':
      return r.slot?.venue?.name || '-';
    case 'firstName':
      return r.firstName || '-';
    case 'lastName':
      return r.lastName || '-';
    case 'email':
      return r.email || '-';
    case 'phone':
      return r.phone || '-';
    case 'emailSecondary':
      return r.emailSecondary || '-';
    case 'phoneSecondary':
      return r.phoneSecondary || '-';
    case 'organization':
      return r.organization || '-';
    case 'function':
      return r.function || '-';
    case 'afcNumber':
      return r.afcNumber || '-';
    case 'address': {
      const parts = [r.address, r.postalCode, r.city].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : '-';
    }
    case 'numPlaces':
      return String(r.numPlaces);
    case 'status':
      return translateStatus(r.status);
    case 'checkinStatus':
      return translateCheckin(r.checkinStatus);
    case 'specialRequests':
      return r.specialRequests || '-';
    case 'checkinNotes':
      return r.checkinNotes || '-';
    case 'checkinVenueNotes':
      return r.checkinVenueNotes || '-';
    case 'createdAt':
      return r.createdAt ? formatDateExport(r.createdAt.split('T')[0]) : '-';
    default:
      return '-';
  }
}

// ============================================
// FILENAME
// ============================================

/** Génère un nom de fichier intelligent basé sur les filtres */
export function generateCompanyExportFilename(
  filters: CompanyReservationFilters,
  format: ExportFormat,
  period: ExportPeriod,
  showTitle?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const parts: string[] = ['reservations'];

  if (showTitle) {
    const cleanTitle = showTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    parts.push(cleanTitle);
  }

  if (period === 'upcoming') {
    parts.push('a-venir');
  } else if (period === 'past') {
    parts.push('passees');
  } else {
    parts.push('toutes');
  }

  if (filters.status) {
    parts.push(filters.status);
  }

  parts.push(date);

  return `${parts.join('_')}.${format}`;
}

// ============================================
// CSV / EXCEL
// ============================================

/**
 * Convertit les réservations en CSV avec colonnes personnalisées
 */
export function reservationsToCSV(
  reservations: CompanyReservation[],
  columns: CompanyExportColumn[]
): string {
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);

  const escapeCSV = (value: string): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = reservations.map((r) => columns.map((col) => escapeCSV(getCellValue(col, r))));

  const BOM = '\uFEFF';
  return BOM + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
}

/**
 * Convertit les réservations en Excel avec colonnes personnalisées
 */
export function reservationsToExcel(
  reservations: CompanyReservation[],
  columns: CompanyExportColumn[]
): Uint8Array {
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);
  const data = reservations.map((r) => columns.map((col) => getCellValue(col, r)));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  const colWidths = columns.map((col, index) => {
    const headerLen = EXPORT_COLUMN_LABELS[col].length;
    const maxDataLen = Math.max(
      ...data.map((row) => {
        const cellValue = row[index];
        return cellValue ? String(cellValue).length : 0;
      }),
      0
    );
    return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Réservations');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

// ============================================
// DOWNLOAD (partagé depuis @/lib/utils/export-helpers)
// ============================================

export { downloadCSV, downloadExcel } from '@/lib/utils/export-helpers';
