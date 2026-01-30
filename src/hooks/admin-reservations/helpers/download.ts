/**
 * Helpers de téléchargement de fichiers
 * @module hooks/admin-reservations/helpers/download
 */

/**
 * Type MIME pour les fichiers CSV
 */
const CSV_MIME_TYPE = 'text/csv;charset=utf-8;';

/**
 * Type MIME pour les fichiers Excel
 */
const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Déclenche le téléchargement d'un fichier via un lien temporaire
 * @param blob - Contenu du fichier
 * @param filename - Nom du fichier
 */
function triggerDownload(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Télécharge un fichier CSV
 * @param content - Contenu CSV (avec BOM)
 * @param filename - Nom du fichier (avec extension .csv)
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: CSV_MIME_TYPE });
  triggerDownload(blob, filename);
}

/**
 * Télécharge un fichier Excel
 * @param content - Contenu Excel (Uint8Array)
 * @param filename - Nom du fichier (avec extension .xlsx)
 */
export function downloadExcel(content: Uint8Array, filename: string): void {
  // Créer une copie du buffer pour compatibilité Blob
  const blob = new Blob([Uint8Array.from(content) as BlobPart], {
    type: EXCEL_MIME_TYPE,
  });
  triggerDownload(blob, filename);
}
