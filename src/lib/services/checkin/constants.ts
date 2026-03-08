/**
 * Constantes pour le service Check-in
 * Derviche Diffusion
 */

import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy } from '@/types/database';

/** Constante par défaut pour la limite des slots passés (en jours) */
export const DEFAULT_PAST_DAYS_LIMIT = 30;

/** Rôles avec accès aux notes internes Derviche (lecture + écriture) */
export const ADMIN_ROLES: UserRole[] = ['super-admin', 'admin', 'externe'];

/** Rôles valides pour l'accès check-in (utilisés par les RPC) */
export const VALID_CHECKIN_ROLES = ['super-admin', 'admin', 'externe', 'company'] as const;
export type ValidCheckinRole = typeof VALID_CHECKIN_ROLES[number];

/**
 * Type guard pour vérifier si le rôle est valide pour le check-in
 */
export function isValidCheckinRole(role: UserRole): role is ValidCheckinRole {
  return role !== null && VALID_CHECKIN_ROLES.includes(role as ValidCheckinRole);
}

/** Valeurs valides pour hosted_by */
export const VALID_HOSTED_BY: SlotHostedBy[] = ['derviche', 'company', 'externe'];

/** Nombre maximum de places par réservation (cohérence avec AddReservationDrawer) */
export const MAX_PLACES = 20;
