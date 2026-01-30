/**
 * Utilitaires partagés pour les sidebars
 * @module shared-sidebar/utils
 */

/**
 * Vérifie si une route est active
 * - Pour le dashboard (baseHref), match exact uniquement
 * - Pour les autres routes, match exact ou sous-routes
 *
 * @param pathname - Chemin actuel (peut être null)
 * @param href - Lien de l'item de navigation
 * @param baseHref - Lien du dashboard (pour match exact)
 * @returns true si la route est active
 */
export function isRouteActive(
  pathname: string | null,
  href: string,
  baseHref: string
): boolean {
  if (!pathname) return false;
  // Dashboard = match exact uniquement
  if (href === baseHref) return pathname === baseHref;
  // Autres routes = match exact ou sous-routes
  return pathname === href || pathname.startsWith(href + '/');
}
