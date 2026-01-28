/**
 * Utilitaires pour SpectacleFormDialog
 * Derviche Diffusion - Session 101
 */

/**
 * Génère un slug URL-friendly à partir d'un texte
 * @param text - Texte à transformer en slug
 * @returns Slug normalisé (minuscules, sans accents, tirets)
 * @example slugify("Café de Paris") // "cafe-de-paris"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace caractères spéciaux par tirets
    .replace(/^-+|-+$/g, ''); // Supprime tirets en début/fin
}

/**
 * Valide une URL (basique)
 * @param url - URL à valider
 * @returns true si l'URL semble valide
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Champ optionnel
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formate la durée en texte lisible
 * @param minutes - Durée en minutes
 * @returns Texte formaté (ex: "1h30" ou "45min")
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}
