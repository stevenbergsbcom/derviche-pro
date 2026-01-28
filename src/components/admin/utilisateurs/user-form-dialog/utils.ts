/**
 * Utilitaires pour UserFormDialog
 * Derviche Diffusion - Session 102
 */

import type { InternalUser } from '@/types/database';
import type { ManagedRole, ManagedUser } from '@/lib/services/internal-users';
import { MANAGED_ROLES, ROLE_DESCRIPTIONS, EMAIL_REGEX } from './constants';

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Vérifie si un utilisateur est un ManagedUser (possède company_id)
 */
export function isManagedUser(user: InternalUser | ManagedUser): user is ManagedUser {
  return 'company_id' in user;
}

/**
 * Vérifie si un rôle est valide
 */
export function isValidRole(role: string): role is ManagedRole {
  return MANAGED_ROLES.includes(role as ManagedRole);
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Retourne la description d'un rôle
 */
export function getRoleDescription(role: ManagedRole): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valide le format d'un email
 * Utilise EMAIL_REGEX centralisé dans constants.ts
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}
