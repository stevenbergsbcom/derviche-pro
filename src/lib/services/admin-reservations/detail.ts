/**
 * Fonctions de détail pour le service Admin Reservations
 * 
 * @module admin-reservations/detail
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { 
  AdminReservationResult,
  ReservationRowWithRelations,
} from './types';
import { RESERVATION_SINGLE_SELECT_QUERY, ERROR_MESSAGES } from './constants';
import { transformReservation } from './transformers';

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Récupère une réservation par son ID avec toutes les relations
 * 
 * @param id - UUID de la réservation
 * @returns Réservation complète ou erreur
 * 
 * @remarks
 * Inclut les relations :
 * - slot (date, heure, capacité)
 * - venue (nom, ville)
 * - show (titre, slug)
 * - company (nom)
 * 
 * @example
 * ```ts
 * const result = await getAdminReservationById('123e4567-e89b-12d3-a456-426614174000');
 * if (result.data) {
 *   console.log(`Réservation pour ${result.data.firstName} ${result.data.lastName}`);
 * }
 * ```
 */
export async function getAdminReservationById(id: string): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select(RESERVATION_SINGLE_SELECT_QUERY)
      .eq('id', id)
      .single();

    if (error) {
      logger.error(ERROR_MESSAGES.FETCH_BY_ID, { id, error: error.message });
      return { data: null, error: error.message };
    }

    const reservation = transformReservation(data as unknown as ReservationRowWithRelations);
    return { data: reservation, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getAdminReservationById', { id, message });
    return { data: null, error: message };
  }
}
