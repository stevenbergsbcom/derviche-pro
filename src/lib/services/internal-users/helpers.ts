/**
 * Fonctions utilitaires pour les utilisateurs internes et compagnies
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import type { InternalUser, InternalRole } from '@/types/database';
import type { ManagedRole, ManagedUser } from './types';
import { INTERNAL_ROLES, MANAGED_ROLES } from './types';

/**
 * Vérifie si une valeur est un rôle interne valide (sans company)
 */
export function isValidInternalRole(role: unknown): role is InternalRole {
  return typeof role === 'string' && INTERNAL_ROLES.includes(role as InternalRole);
}

/**
 * Vérifie si une valeur est un rôle géré valide (avec company)
 */
export function isValidManagedRole(role: unknown): role is ManagedRole {
  return typeof role === 'string' && MANAGED_ROLES.includes(role as ManagedRole);
}

/**
 * Formate le nom complet d'un utilisateur
 */
export function formatUserName(user: InternalUser | ManagedUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.first_name) {
    return user.first_name;
  }
  if (user.last_name) {
    return user.last_name;
  }
  return user.email;
}

/**
 * Formate le nom abrégé d'un utilisateur (Prénom N.)
 */
export function formatUserNameShort(user: InternalUser | ManagedUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name.charAt(0)}.`;
  }
  return formatUserName(user);
}

/**
 * Traduit un rôle en français
 */
export function translateRole(role: InternalRole | ManagedRole): string {
  const translations: Record<ManagedRole, string> = {
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'externe': 'Externe',
    'company': 'Compagnie',
  };
  return translations[role] || role;
}
