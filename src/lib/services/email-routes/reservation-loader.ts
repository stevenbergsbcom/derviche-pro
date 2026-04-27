/**
 * Helpers de chargement — routes email
 * Derviche Diffusion
 *
 * Factorise les 3 opérations répétées dans les 5 routes email :
 *   - resolveRecipient : reconstruit { email, firstName, lastName, fullName }
 *     depuis guest_* en priorité, puis le profil lié.
 *   - loadManager : charge les infos du manager Derviche du spectacle.
 *   - loadUserRole : récupère le rôle courant depuis user_roles.
 */

import type { UserRole } from '@/types/database';
import type { AdminClient, EmailRecipient, ManagerInfo, ResolvedUserRole } from './types';

// ============================================
// RECIPIENT
// ============================================

type ProfileShape = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};

interface ReservationWithProfile {
  profiles?: ProfileShape | ProfileShape[] | null;
}

interface RecipientSource extends ReservationWithProfile {
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_email?: string | null;
}

/**
 * Normalise le champ `profiles` d'une réservation (Supabase renvoie parfois
 * un tableau pour une relation 1-1). Retourne null si aucun profil.
 *
 * À utiliser partout où on accède à `profiles.phone` / `profiles.email`
 * hors du helper `resolveRecipient` (ex : construction de la notif admin).
 */
export function resolveProfile(
  reservation: ReservationWithProfile,
): ProfileShape | null {
  if (Array.isArray(reservation.profiles)) {
    return reservation.profiles[0] ?? null;
  }
  return reservation.profiles ?? null;
}

/**
 * Résout le destinataire final depuis une réservation chargée.
 * Retourne null si aucun email (ni guest ni profil).
 *
 * Règle d'ordre : guest_* > profiles.* (cohérent avec les 5 routes existantes).
 */
export function resolveRecipient(reservation: RecipientSource): EmailRecipient | null {
  const profile = resolveProfile(reservation);

  const email = reservation.guest_email ?? profile?.email ?? null;
  if (!email) return null;

  const firstName = reservation.guest_first_name ?? profile?.first_name ?? '';
  const lastName = reservation.guest_last_name ?? profile?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Cher professionnel';

  return { email, firstName, lastName, fullName };
}

// ============================================
// MANAGER
// ============================================

/**
 * Charge les infos du manager Derviche depuis son profil.
 * Retourne des champs null si managerId est null ou profil introuvable.
 */
export async function loadManager(
  adminClient: AdminClient,
  managerId: string | null | undefined,
): Promise<ManagerInfo> {
  const empty: ManagerInfo = { name: null, email: null, phone: null };
  if (!managerId) return empty;

  const { data: mgr } = await adminClient
    .from('profiles')
    .select('first_name, last_name, email, phone')
    .eq('id', managerId)
    .maybeSingle();

  if (!mgr) return empty;

  const name = `${mgr.first_name ?? ''} ${mgr.last_name ?? ''}`.trim() || null;
  return {
    name,
    email: (mgr as { email?: string | null }).email ?? null,
    phone: (mgr as { phone?: string | null }).phone ?? null,
  };
}

// ============================================
// ROLE
// ============================================

/**
 * Charge le rôle courant d'un utilisateur depuis user_roles.
 * Retourne null si aucun rôle (cas rare — compte orphelin).
 */
export async function loadUserRole(
  adminClient: AdminClient,
  userId: string,
): Promise<ResolvedUserRole> {
  const { data } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  return (data?.role as UserRole | undefined) ?? null;
}
