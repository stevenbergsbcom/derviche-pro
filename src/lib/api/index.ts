/**
 * Utilitaires API — Point d'entrée
 *
 * Réexporte les helpers partagés pour les routes API :
 * - requireAuth : vérification auth + rôle
 * - Réponses standardisées (errorResponse, successResponse, etc.)
 * - getErrorMessage : extraction de message d'erreur
 */

// Guard
export { requireAuth, ADMIN_ROLES, STAFF_ROLES } from './admin-guard';
export type { AuthResult, AuthSuccess, AuthFailure } from './admin-guard';

// Réponses
export {
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from './responses';

// Erreurs
export { getErrorMessage } from './errors';
