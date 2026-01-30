/**
 * Export CSV des réservations
 * @module hooks/admin-reservations/helpers/export-csv
 */

import type { AdminReservation } from '@/lib/services/admin-reservations';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import { EXPORT_COLUMN_LABELS } from '../constants';
import { getCellValue } from './formatters';

/**
 * Échappe une valeur pour le format CSV
 * Utilise le point-virgule comme délimiteur (standard Excel français)
 * @param value - Valeur à échapper
 * @returns Valeur échappée
 */
function escapeCSV(value: string): string {
  // Si contient point-virgule, virgule, guillemet ou saut de ligne, entourer de guillemets
  if (
    value.includes(';') ||
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convertit les réservations en contenu CSV
 * @param reservations - Liste des réservations
 * @param columns - Colonnes à inclure dans l'export
 * @returns Contenu CSV avec BOM pour Excel
 */
export function reservationsToCSV(
  reservations: AdminReservation[],
  columns: ReservationColumn[]
): string {
  // En-têtes basés sur les colonnes sélectionnées
  const headers = columns.map((col) => EXPORT_COLUMN_LABELS[col]);

  // Lignes de données
  const rows = reservations.map((reservation) =>
    columns.map((col) => escapeCSV(getCellValue(col, reservation)))
  );

  // Assembler le CSV avec BOM pour Excel (reconnaissance UTF-8)
  const BOM = '\uFEFF';
  return BOM + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
}
