/**
 * Utilitaires de formatage de dates et heures
 * Source de vérité unique — utilisé par les routes API, services et composants.
 */

// ============================================
// DATES LONGUES
// ============================================

/**
 * Formate une date ISO en date lisible en français (format long).
 * Ex: "2026-01-15" → "jeudi 15 janvier 2026"
 * Utilise T12:00:00 pour éviter les décalages de timezone.
 */
export function formatDateFr(dateStr: string): string {
  try {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================
// DATES COURTES
// ============================================

/**
 * Formate une date ISO en format court français (weekday abrégé + jour + mois abrégé).
 * Ex: "2026-01-15" → "jeu. 15 janv."
 * Utilisé dans les tableaux de réservations admin/company.
 */
export function formatDateShortWeekday(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formate une date ISO en format semi-court français (weekday abrégé + jour + mois abrégé + année).
 * Ex: "2026-01-15" → "jeu. 15 janv. 2026"
 * Utilisé dans les cartes de réservation pro.
 */
export function formatDateShortWithYear(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formate une date ISO en format court français (jour + mois abrégé).
 * Ex: "2026-01-15" → "15 janv."
 * Utilisé dans les cartes du dashboard pro.
 */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formate une date pour l'aperçu export (format court JJ/MM).
 * Ex: "2026-01-15" → "15/01"
 * Utilisé dans les dialogs d'export admin/company.
 */
export function formatDateShortExport(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

// ============================================
// DATES EXPORT
// ============================================

/**
 * Formate une date pour l'export (format français JJ/MM/AAAA).
 * Ex: "2026-01-15" → "15/01/2026"
 * @param dateStr - Date au format ISO ou null
 * @returns Date formatée ou '-' si null
 */
export function formatDateExport(dateStr: string | null): string {
  if (!dateStr) return '-';
  // Ajouter T12:00:00 pour éviter les problèmes de timezone
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ============================================
// DATETIME
// ============================================

/**
 * Formate une date ISO complète (avec heure) en format français.
 * Ex: "2026-01-15T14:30:00Z" → "15 janv. 2026, 14:30"
 * Utilisé pour les dates de création/modification.
 */
export function formatDateTimeFr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// HEURES
// ============================================

/**
 * Formate une heure HH:MM:SS en HHhMM.
 * Ex: "11:00:00" → "11h00"
 */
export function formatTimeFr(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}h${minutes}`;
  } catch {
    return timeStr;
  }
}

/**
 * Extrait l'heure HH:MM depuis un champ time PostgreSQL (HH:MM:SS).
 * Ex: "14:30:00" → "14:30"
 */
export function formatTimeShort(timeStr: string): string {
  return timeStr.slice(0, 5);
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Formate une date en YYYY-MM-DD en utilisant la timezone locale.
 * Évite le problème de décalage UTC avec toISOString().
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
