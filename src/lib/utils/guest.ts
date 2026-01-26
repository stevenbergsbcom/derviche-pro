/**
 * Utilitaires Guest - Fonctions partagées pour les données invités
 * Derviche Diffusion
 */

/**
 * Génère le nom complet à partir du prénom et du nom
 * @param firstName - Prénom (peut être null)
 * @param lastName - Nom de famille (peut être null)
 * @returns Nom complet ou 'Sans nom' si vide
 */
export function getFullName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Sans nom';
}
