/**
 * Types communs — helpers des routes email
 * Derviche Diffusion
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types/database';

/** Client Supabase avec droits service_role (bypass RLS). */
export type AdminClient = SupabaseClient;

/** Rôle utilisateur résolu depuis user_roles (null si absent). */
export type ResolvedUserRole = UserRole | null;

/** Destinataire calculé à partir des champs guest_* ou du profil lié. */
export interface EmailRecipient {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

/** Informations du manager Derviche d'un spectacle. */
export interface ManagerInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
}

/** Options d'autorisation pour une route email. */
export interface EmailRouteAuthOptions {
  /** Autorise le propriétaire (user_id = actor). */
  allowOwner?: boolean;
  /** Autorise super-admin + admin. */
  allowFullAdmin?: boolean;
  /** Autorise externe (vérif hosted_by_id). */
  allowExterne?: boolean;
  /** Autorise company (vérif show.company_id). */
  allowCompany?: boolean;
}

/** Contexte passé au helper d'autorisation. */
export interface AuthorizeContext {
  userId: string;
  userRole: ResolvedUserRole;
  /** user_id de la réservation (null si guest). */
  reservationUserId: string | null;
  /** slots.hosted_by_id — requis pour le check externe. */
  hostedById?: string | null;
  /** shows.company_id — requis pour le check company. */
  showCompanyId?: string | null;
}
