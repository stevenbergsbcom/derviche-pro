/**
 * Types pour la gestion des utilisateurs internes et compagnies
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import type { InternalUser, InternalRole } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Rôles gérés par les admins (internes + company) */
export type ManagedRole = InternalRole | 'company';

/** Utilisateur géré (interne ou company) */
export interface ManagedUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ManagedRole;
  company_id: string | null;
  company_name: string | null; // Pour affichage
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
}

/** Résultat d'une opération sur un utilisateur */
export interface UserResult {
  data: InternalUser | null;
  error: string | null;
}

/** Résultat d'une opération sur un utilisateur géré */
export interface ManagedUserResult {
  data: ManagedUser | null;
  error: string | null;
}

/** Résultat d'une liste d'utilisateurs internes */
export interface UsersListResult {
  data: InternalUser[];
  error: string | null;
}

/** Résultat d'une liste d'utilisateurs gérés */
export interface ManagedUsersListResult {
  data: ManagedUser[];
  error: string | null;
}

/** Rôles internes pour filtrage (sans company) */
export const INTERNAL_ROLES: InternalRole[] = ['super-admin', 'admin', 'externe'];

/** Tous les rôles gérés par les admins */
export const MANAGED_ROLES: ManagedRole[] = ['super-admin', 'admin', 'externe', 'company'];
