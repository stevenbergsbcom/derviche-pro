/**
 * Service pour la gestion des utilisateurs internes et compagnies (staff + company)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Gère les opérations CRUD pour les utilisateurs gérés par les admins :
 * - Internes : super-admin, admin, externe
 * - Compagnies : company (avec company_id obligatoire)
 *
 * @module internal-users
 */

// Types et constantes
export type { ManagedRole, ManagedUser, UserResult, ManagedUserResult, UsersListResult, ManagedUsersListResult } from './types';
export { INTERNAL_ROLES, MANAGED_ROLES } from './types';

// Fonctions de lecture
export { getInternalUsers, getManagedUsers, getInternalUserById, getCompanyUser, isInternalUser } from './list';

// Fonctions d'écriture
export { updateInternalUserRole, updateInternalUserProfile } from './mutations';

// Fonctions utilitaires
export { isValidInternalRole, isValidManagedRole, formatUserName, formatUserNameShort, translateRole } from './helpers';
