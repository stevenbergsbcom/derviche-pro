/**
 * Utilitaires pour RepresentationFormDialog
 * Derviche Diffusion - Session 103
 */

import type { MockUser } from './types';
import { ROLE_LABELS } from './constants';

// ============================================
// FONCTIONS DATE
// ============================================

/**
 * Obtient la date locale au format YYYY-MM-DD
 * @param date - Date à formater (défaut: aujourd'hui)
 * @returns Date au format YYYY-MM-DD
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================
// FONCTIONS UTILISATEUR
// ============================================

/**
 * Formate le nom complet d'un utilisateur
 * @param user - Utilisateur à formater
 * @returns Nom formaté ou email si pas de nom
 */
export function formatUserName(user: MockUser): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email;
}

/**
 * Obtient le label du rôle d'un utilisateur
 * @param role - Rôle de l'utilisateur
 * @returns Label formaté
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}

/**
 * Formate un utilisateur pour l'affichage dans le sélecteur
 * @param user - Utilisateur à formater
 * @returns Texte formaté pour l'affichage
 */
export function formatUserForSelect(user: MockUser): string {
  return `${formatUserName(user)} - [${getRoleLabel(user.role)}]`;
}

// ============================================
// FONCTIONS LIEU
// ============================================

/**
 * Formate un lieu pour l'affichage dans le sélecteur
 * @param name - Nom du lieu
 * @param city - Ville du lieu
 * @returns Texte formaté pour l'affichage
 */
export function formatVenueForSelect(name: string, city: string): string {
  return city ? `${name} - ${city}` : name;
}
