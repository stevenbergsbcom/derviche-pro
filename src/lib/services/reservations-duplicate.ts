/**
 * Service partagé — Vérification de doublon de réservation
 * Derviche Diffusion — Session S184
 *
 * Utilise la RPC check_reservation_duplicate (SECURITY DEFINER)
 * pour vérifier côté client si un email a déjà une réservation
 * active sur un créneau donné.
 *
 * Utilisé par les 3 formulaires : public, admin, PWA.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface DuplicateExistingReservation {
  firstName: string | null;
  lastName: string | null;
  numPlaces: number;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  existingReservation?: DuplicateExistingReservation;
}

interface RpcDuplicateResult {
  hasDuplicate: boolean;
  firstName?: string | null;
  lastName?: string | null;
  numPlaces?: number;
}

// ============================================
// SERVICE
// ============================================

/**
 * Vérifie si un email a déjà une réservation active sur un créneau.
 * Appelle la RPC check_reservation_duplicate (SECURITY DEFINER, accessible anon + auth).
 *
 * @param slotId - UUID du créneau
 * @param email - Email à vérifier
 * @returns Résultat avec indication de doublon et infos de la réservation existante
 */
export async function checkDuplicateReservation(
  slotId: string,
  email: string
): Promise<DuplicateCheckResult> {
  try {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('check_reservation_duplicate', {
      p_slot_id: slotId,
      p_email: email.trim(),
    });

    if (error) {
      logger.warn('[reservations-duplicate] Erreur RPC check_reservation_duplicate', { error });
      return { hasDuplicate: false };
    }

    const result = data as RpcDuplicateResult;

    if (result?.hasDuplicate) {
      return {
        hasDuplicate: true,
        existingReservation: {
          firstName: result.firstName ?? null,
          lastName: result.lastName ?? null,
          numPlaces: result.numPlaces ?? 1,
        },
      };
    }

    return { hasDuplicate: false };
  } catch (err) {
    logger.error('[reservations-duplicate] Exception checkDuplicateReservation', { err });
    return { hasDuplicate: false };
  }
}
