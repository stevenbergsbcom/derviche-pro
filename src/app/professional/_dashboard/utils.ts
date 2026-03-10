/**
 * utils.ts — Dashboard Professionnel
 * Derviche Diffusion
 *
 * Fonctions utilitaires partagées entre les cartes du dashboard pro.
 */

/**
 * Formate une date ISO (YYYY-MM-DD) en format long français.
 * Ex : "lundi 14 avril 2025"
 * Utilisé dans NextShowCard (prochain spectacle hero).
 */
export function formatDateLong(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date ISO (YYYY-MM-DD) en format court français.
 * Ex : "14 avr."
 * Utilisé dans UpcomingReservationsCard et DiscoverShowsCard.
 */
export function formatDateShort(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Extrait l'heure HH:MM depuis un champ time PostgreSQL (HH:MM:SS).
 */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}
