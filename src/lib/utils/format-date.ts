/**
 * Utilitaires de formatage de dates et heures
 * Partagés entre les routes API email et les services.
 */

/**
 * Formate une date ISO en date lisible en français.
 * Ex: "2026-01-15" → "Jeudi 15 janvier 2026"
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
