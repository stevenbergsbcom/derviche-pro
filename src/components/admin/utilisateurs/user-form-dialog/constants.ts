/**
 * Constantes pour UserFormDialog
 * Derviche Diffusion - Session 102
 */

import type { ManagedRole } from '@/lib/services/internal-users';
import type { CreateUserFormData } from './types';

// ============================================
// RÔLES
// ============================================

/**
 * Liste des rôles gérés dans le système
 */
export const MANAGED_ROLES: ManagedRole[] = [
  'super-admin',
  'admin',
  'externe',
  'company',
];

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

/**
 * Valeurs par défaut du formulaire (création)
 */
export const DEFAULT_CREATE_FORM_DATA: CreateUserFormData = {
  first_name: '',
  last_name: '',
  phone: '',
  role: 'externe',
  company_id: undefined,
  email: '',
  password: '',
  must_change_password: true,
};

// ============================================
// DESCRIPTIONS DES RÔLES
// ============================================

/**
 * Descriptions des rôles pour l'UI
 */
export const ROLE_DESCRIPTIONS: Record<ManagedRole, string> = {
  'super-admin': 'Accès complet à toutes les fonctionnalités.',
  'admin': 'Gestion des spectacles, réservations et check-in.',
  'externe': 'Accueil et check-in sur les spectacles assignés.',
  'company': 'Accès aux statistiques de la compagnie associée.',
};

// ============================================
// MESSAGES
// ============================================

/**
 * Messages d'erreur de validation
 */
export const VALIDATION_MESSAGES = {
  emailRequired: "L'email est requis",
  emailInvalid: "Format d'email invalide",
  roleInvalid: 'Veuillez sélectionner un rôle valide',
  companyRequired: 'Veuillez sélectionner une compagnie',
} as const;

/**
 * Messages d'aide/information
 */
export const HELP_MESSAGES = {
  emailReadOnly: "L'email ne peut pas être modifié.",
  companyRoleWarning: 'Le rôle d\'un utilisateur compagnie ne peut pas être changé.',
  companyCannotChange: 'La compagnie associée ne peut pas être changée.',
  companyChangeWarning: 'Attention : changer le rôle vers "Compagnie" donnera accès aux statistiques de cette compagnie.',
} as const;

// ============================================
// REGEX
// ============================================

/**
 * Pattern de validation email
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
