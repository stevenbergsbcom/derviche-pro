/**
 * Types pour le hook useManagedUsers
 * Derviche Diffusion - Plateforme de réservation professionnelle
 */

import type { ManagedUser, ManagedRole } from '@/lib/services/internal-users';

/** Données pour créer un utilisateur (interne ou compagnie) */
export interface CreateManagedUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: ManagedRole;
  company_id?: string; // Obligatoire si role = 'company'
  must_change_password?: boolean;
}

/** Données pour mettre à jour un utilisateur */
export interface UpdateManagedUserData {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: ManagedRole;
}

/** Résultat d'une opération CRUD */
export interface OperationResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string };
  reactivated?: boolean;
}

export interface UseManagedUsersReturn {
  /** Liste des utilisateurs gérés (internes + company) */
  users: ManagedUser[];
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Recharge la liste des utilisateurs */
  refresh: () => Promise<void>;
  /** Trouve un utilisateur par son ID */
  getUserById: (id: string) => ManagedUser | undefined;
  /** Filtre les utilisateurs par rôle */
  getUsersByRole: (role: ManagedRole) => ManagedUser[];
  /** Crée un nouvel utilisateur (interne ou compagnie) */
  create: (data: CreateManagedUserData) => Promise<OperationResult>;
  /** Met à jour un utilisateur (profil et/ou rôle) */
  update: (userId: string, data: UpdateManagedUserData) => Promise<OperationResult>;
  /** Supprime un utilisateur (soft delete) */
  remove: (userId: string) => Promise<OperationResult>;
  /** Active ou désactive un utilisateur (seul Super Admin peut faire ça) */
  toggleStatus: (userId: string, disabled: boolean) => Promise<OperationResult>;
  /** Formate le nom complet d'un utilisateur */
  formatName: (user: ManagedUser) => string;
  /** Formate le nom abrégé d'un utilisateur */
  formatNameShort: (user: ManagedUser) => string;
  /** Traduit un rôle en français */
  translateRole: (role: ManagedRole) => string;
}

// Re-export service types for consumers
export type { ManagedUser, ManagedRole };
