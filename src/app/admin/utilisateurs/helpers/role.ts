/**
 * Helpers pour les rôles utilisateurs
 * Derviche Diffusion
 */

import type { ManagedUser, ManagedRole, InternalRole } from '../types';
import { ROLE_BADGE_CLASSES } from '../constants';

/**
 * Retourne la classe CSS du badge selon le rôle
 */
export function getRoleBadgeClass(role: ManagedRole): string {
  return ROLE_BADGE_CLASSES[role] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Vérifie si un utilisateur peut être supprimé
 * (on ne peut pas se supprimer soi-même)
 */
export function canDeleteUser(
  user: ManagedUser, 
  currentUserId: string | null
): boolean {
  return currentUserId !== user.id;
}

/**
 * Vérifie si l'utilisateur courant peut activer/désactiver un compte
 * - Seuls les Super Admins peuvent faire ça
 * - On ne peut pas se toggle soi-même
 * - On ne peut pas DÉSACTIVER un Super Admin (mais on peut le réactiver)
 */
export function canToggleUserStatus(
  user: ManagedUser,
  currentUserId: string | null,
  currentUserRole: InternalRole | null
): boolean {
  // Seul un Super Admin peut toggle
  if (currentUserRole !== 'super-admin') return false;
  // On ne peut pas se toggle soi-même
  if (currentUserId === user.id) return false;
  // On ne peut pas DÉSACTIVER un Super Admin (mais on peut le réactiver s'il était désactivé)
  if (user.role === 'super-admin' && user.disabled_at === null) return false;
  return true;
}

/**
 * Vérifie si un utilisateur est désactivé
 */
export function isUserDisabled(user: ManagedUser): boolean {
  return user.disabled_at !== null;
}

/**
 * Vérifie si un utilisateur est l'utilisateur courant
 */
export function isCurrentUser(
  user: ManagedUser, 
  currentUserId: string | null
): boolean {
  return currentUserId === user.id;
}
