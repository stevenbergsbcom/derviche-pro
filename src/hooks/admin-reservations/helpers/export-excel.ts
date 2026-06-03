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
 * Colonnes dont la valeur doit être forcée en TEXTE dans Excel (S175).
 *
 * Sans ce forçage, Excel interprète les IDs CRM 17 chiffres comme un nombre
 * et bascule en notation scientifique (`7,06E+16`) ce qui corrompt
 * silencieusement la donnée à l'ouverture. Les UUIDs ne sont pas concernés
 * (caractères non numériques) mais on les force aussi par défense.
 */
const FORCE_TEXT_COLUMNS: ReadonlySet<ReservationColumn> = new Set([
  'crmIdPro',
  'crmIdStructure',
  'userUuid',
  'addressPostalCode',
]);

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

  // Données (string brutes, utilisées pour le calcul de largeur des colonnes)
  const data = reservations.map((reservation) =>
    columns.map((col) => getCellValue(col, reservation))
  );

  // Créer le workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // S175 — Forçage type texte pour les colonnes IDs CRM / UUID / CP.
  // Sans ce traitement, Excel convertit `70611000000487416` en `7,06E+16`
  // (notation scientifique) à l'ouverture du fichier. On réécrit chaque
  // cellule concernée avec un cell-object `{ t: 's', v: ... }` pour forcer
  // le type string au niveau XLSX.
  columns.forEach((col, colIndex) => {
    if (!FORCE_TEXT_COLUMNS.has(col)) return;
    reservations.forEach((_, rowIndex) => {
      // +1 pour sauter la ligne d'en-tête
      const cellAddr = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      const value = data[rowIndex]?.[colIndex] ?? '';
      worksheet[cellAddr] = { t: 's', v: value };
    });
  });

  // Ajuster la largeur des colonnes
  worksheet['!cols'] = calculateColumnWidths(columns, data);

  // Ajouter la feuille
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Réservations');

  // Générer le fichier
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
