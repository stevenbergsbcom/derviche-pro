/**
 * Utilitaires partagés pour les exports (CSV, Excel)
 * @module lib/utils/export-helpers
 *
 * Centralise les fonctions de téléchargement et d'aide à l'export
 * utilisées par les modules admin et compagnie.
 */

// ============================================
// CONSTANTES INTERNES
// ============================================

/** Type MIME pour les fichiers CSV */
const CSV_MIME_TYPE = 'text/csv;charset=utf-8;';

/** Type MIME pour les fichiers Excel */
const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ============================================
// TÉLÉCHARGEMENT
// ============================================

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

// ============================================
// FORMATAGE TEXTE
// ============================================

/**
 * Tronque une chaîne à une longueur maximale
 * @param str - Chaîne à tronquer (accepte null/undefined)
 * @param maxLength - Longueur maximale avant troncature
 * @returns Chaîne tronquée avec « ... » ou '-' si vide
 */
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '-';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// ============================================
// FILTRES D'EXPORT
// ============================================

/**
 * Interface de base pour les filtres de réservation.
 * Les propriétés communes utilisées par hasActiveFilters et getInitialPeriod.
 */
export interface BaseReservationFilters {
  showId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: 'upcoming' | 'past' | 'all';
}

/** Période de filtrage pour l'export */
export type ExportPeriod = 'all' | 'upcoming' | 'past';

/**
 * Détermine si des filtres de la page sont actifs
 * (period 'upcoming' est le défaut, on l'exclut)
 * @param filters - Filtres de réservation (admin ou compagnie)
 */
export function hasActiveFilters<T extends BaseReservationFilters>(filters: T): boolean {
  return !!(
    filters.showId ||
    filters.status ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.period && filters.period !== 'upcoming')
  );
}

/**
 * Détermine la période initiale basée sur les filtres de la page
 * @param filters - Filtres de réservation (admin ou compagnie)
 */
export function getInitialPeriod<T extends BaseReservationFilters>(filters: T): ExportPeriod {
  if (filters.period === 'upcoming') return 'upcoming';
  if (filters.period === 'past') return 'past';
  return 'all';
}
