/**
 * Constantes pour le service Check-in
 * Derviche Diffusion
 */

import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy } from '@/types/database';

/** Constante par défaut pour la limite des slots passés (en jours) */
export const DEFAULT_PAST_DAYS_LIMIT = 30;

/** Rôles avec accès complet (admin) */
export const ADMIN_ROLES: UserRole[] = ['super-admin', 'admin'];

/** Valeurs valides pour hosted_by */
export const VALID_HOSTED_BY: SlotHostedBy[] = ['derviche', 'company', 'externe'];

/** Nombre maximum de places par réservation (cohérence avec AddReservationDrawer) */
export const MAX_PLACES = 20;
