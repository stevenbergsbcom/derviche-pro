/**
 * Utilitaire — Extraction de message d'erreur
 *
 * Remplace le pattern répété :
 *   const message = err instanceof Error ? err.message : 'Erreur inconnue';
 */

/**
 * Extrait un message lisible depuis une erreur inconnue.
 * À utiliser dans les blocs catch des routes API et services.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Erreur inconnue';
}
