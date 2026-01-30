/**
 * Export Excel des réservations
 * @module hooks/admin-reservations/helpers/export-excel
 */

import * as XLSX from 'xlsx';
import type { AdminReservation } from '@/lib/services/admin-reservations';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import { EXPORT_COLUMN_LABELS } from '../constants';
import { getCellValue } from './formatters';

/**
 * Largeur maximale d'une colonne Excel
 */
const MAX_COLUMN_WIDTH = 50;

/**
 * Marge ajoutée à la largeur des colonnes
 */
const COLUMN_WIDTH_MARGIN = 2;

/**
 * Calcule la largeur optimale pour chaque colonne
 * @param columns - Colonnes à analyser
 * @param data - Données de chaque ligne
 * @returns Configuration de largeur pour xlsx
 */
function calculateColumnWidths(
  columns: ReservationColumn[],
  data: string[][]
): XLSX.ColInfo[] {
  return columns.map((col, index) => {
    const headerLen = EXPORT_COLUMN_LABELS[col].length;
    const maxDataLen = Math.max(
      ...data.map((row) => {
        const cellValue = row[index];
        return cellValue ? String(cellValue).length : 0;
      }),
      0
    );
    const width = Math.min(
      Math.max(headerLen, maxDataLen) + COLUMN_WIDTH_MARGIN,
      MAX_COLUMN_WIDTH
    );
    return { wch: width };
  });
}

/**
 * Convertit les réservations en fichier Excel (Uint8Array)
 * @param reservations - Liste des réservations
 * @param columns - Colonnes à inclure dans l'export
 * @returns Contenu du fichier Excel
 */
export function reservationsToExcel(
  reservations: AdminReservation[],
  columns: ReservationColumn[]
): Uint8Array {
  // En-têtes basés sur les colonnes sélectionnées
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);

  // Données
  const data = reservations.map((reservation) =>
    columns.map((col) => getCellValue(col, reservation))
  );

  // Créer le workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Ajuster la largeur des colonnes
  worksheet['!cols'] = calculateColumnWidths(columns, data);

  // Ajouter la feuille
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Réservations');

  // Générer le fichier
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
