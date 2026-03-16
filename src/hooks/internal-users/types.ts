/**
 * Types pour le hook useInternalUsers
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import type { ManagedRole } from '@/lib/services/internal-users';
import type { InternalUser, InternalRole } from '@/types/database';

/** Données pour mettre à jour un utilisateur */
export interface UpdateUserData {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: InternalRole;
}

/** Données pour créer un utilisateur (interne ou compagnie) */
export interface CreateUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: ManagedRole; // Inclut 'company'
  company_id?: string; // Obligatoire si role = 'company'
  must_change_password?: boolean;
}

/** Résultat d'une opération CRUD */
export interface OperationResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string };
}

export interface UseInternalUsersReturn {
  /** Liste des utilisateurs internes */
  users: InternalUser[];
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Recharge la liste des utilisateurs */
  refresh: () => Promise<void>;
  /** Trouve un utilisateur par son ID */
  getUserById: (id: string) => InternalUser | undefined;
  /** Filtre les utilisateurs par rôle */
  getUsersByRole: (role: InternalRole) => InternalUser[];
  /** Crée un nouvel utilisateur (interne ou compagnie) */
  create: (data: CreateUserData) => Promise<OperationResult>;
  /** Met à jour un utilisateur (profil et/ou rôle) */
  update: (userId: string, data: UpdateUserData) => Promise<OperationResult>;
  /** Supprime un utilisateur interne (soft delete) */
  remove: (userId: string) => Promise<OperationResult>;
  /** Active ou désactive un utilisateur (seul Super Admin peut faire ça) */
  toggleStatus: (userId: string, disabled: boolean) => Promise<OperationResult>;
  /** Formate le nom complet d'un utilisateur */
  formatName: (user: InternalUser) => string;
  /** Formate le nom abrégé d'un utilisateur */
  formatNameShort: (user: InternalUser) => string;
  /** Traduit un rôle en français */
  translateRole: (role: InternalRole | ManagedRole) => string;
}
