/**
 * Constantes pour la page Admin Utilisateurs
 * Derviche Diffusion
 */

import type { ManagedRole } from '@/hooks/useManagedUsers';
import type { RoleFilter } from './types';

// ============================================
// RÔLES
// ============================================

/** Tous les rôles gérés pour le filtre (incluant 'all') */
export const ALL_ROLES: RoleFilter[] = [
  'all', 
  'super-admin', 
  'admin', 
  'externe', 
  'company',
];

/** Labels des rôles en français */
export const ROLE_LABELS: Record<RoleFilter, string> = {
  'all': 'Tous les rôles',
  'super-admin': 'Super Admin',
  'admin': 'Admin',
  'externe': 'Externe',
  'company': 'Compagnie',
};

// ============================================
// STYLES DES BADGES PAR RÔLE
// ============================================

/** Classes CSS pour les badges de rôle */
export const ROLE_BADGE_CLASSES: Record<ManagedRole, string> = {
  'super-admin': 'bg-purple-100 text-purple-800 border-purple-200',
  'admin': 'bg-blue-100 text-blue-800 border-blue-200',
  'externe': 'bg-amber-100 text-amber-800 border-amber-200',
  'company': 'bg-teal-100 text-teal-800 border-teal-200',
};

/** Classes CSS pour les fonds des badges résumé */
export const ROLE_SUMMARY_BG_CLASSES: Record<ManagedRole, string> = {
  'super-admin': 'bg-purple-50',
  'admin': 'bg-blue-50',
  'externe': 'bg-amber-50',
  'company': 'bg-teal-50',
};

// ============================================
// TEXTES
// ============================================

/** Messages de la page */
export const MESSAGES = {
  LOADING: 'Chargement des utilisateurs...',
  ERROR_PREFIX: 'Erreur lors du chargement des utilisateurs : ',
  NO_USERS: 'Aucun utilisateur enregistré',
  NO_RESULTS: 'Aucun utilisateur trouvé',
  SELF_DELETE_ERROR: 'Vous ne pouvez pas supprimer votre propre compte.',
  DELETE_CONFIRM_TITLE: 'Supprimer cet utilisateur ?',
  SUPER_ADMIN_CANNOT_DISABLE: 'Les Super Admins ne peuvent pas être désactivés',
  ACTION_NOT_ALLOWED: 'Action non autorisée',
  ACTIVATE_ACCOUNT: 'Activer ce compte',
  DEACTIVATE_ACCOUNT: 'Désactiver ce compte',
} as const;

/** Textes des boutons et labels */
export const LABELS = {
  PAGE_TITLE: 'Gestion des Utilisateurs',
  ADD_USER: 'Ajouter un utilisateur',
  SEARCH_PLACEHOLDER: 'Rechercher par nom, email ou compagnie...',
  FILTER_ROLE_PLACEHOLDER: 'Filtrer par rôle',
  VIEW: 'Voir',
  EDIT: 'Modifier',
  DELETE: 'Supprimer',
  ACTIVATE: 'Activer',
  DEACTIVATE: 'Désactiver',
  RETRY: 'Réessayer',
  YOU: 'Vous',
  INACTIVE: 'Inactif',
} as const;

/** Colonnes du tableau */
export const TABLE_COLUMNS = {
  NAME: 'Nom',
  EMAIL: 'Email',
  ROLE: 'Rôle',
  COMPANY: 'Compagnie',
  ACTIONS: 'Actions',
} as const;
