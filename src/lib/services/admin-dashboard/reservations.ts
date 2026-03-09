/**
 * Reservations - Admin Dashboard Service
 * Derviche Diffusion
 *
 * Récupère les réservations récentes pour le dashboard
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { AdminRecentReservation, AdminDashboardOptions, QueryResult } from './types';
import { isValidShow, isValidVenue, isValidSlot } from './guards';
import { getSlotIdsForShows } from './helpers';

const DEFAULT_LIMIT = 10;

/**
 * Récupère les réservations récentes.
 *
 * Convention assignedShowIds :
 *   undefined | null → accès complet
 *   []               → externe sans assignation → []
 *   ['id', ...]      → externe filtré
 */
export async function getRecentReservations(
  limit: number = DEFAULT_LIMIT,
  options?: AdminDashboardOptions
): Promise<QueryResult<AdminRecentReservation[]>> {
  try {
    const supabase = createClient();

    // Narrow : string[] si externe, null si accès complet
    const showIdFilter: string[] | null = Array.isArray(options?.assignedShowIds)
      ? options.assignedShowIds
      : null;

    // Externe sans assignation → liste vide
    if (showIdFilter !== null && showIdFilter.length === 0) {
      return { data: [], error: null };
    }

    // Si externe, récupérer les slot_ids pour filtrer les réservations
    let slotIdFilter: string[] | null = null;
    if (showIdFilter !== null) {
      const { slotIds, error } = await getSlotIdsForShows(supabase, showIdFilter);
      if (error) {
        return { data: [], error };
      }
      // Aucun slot = aucune réservation possible pour cet externe
      if (slotIds.length === 0) {
        return { data: [], error: null };
      }
      slotIdFilter = slotIds;
    }

    let query = supabase
      .from('reservations')
      .select(`
        id, created_at, num_places, status,
        guest_first_name, guest_last_name, guest_email, guest_structure,
        slots:slot_id (
          id, date, time,
          shows:show_id (id, title),
          venues:venue_id (id, name, city)
        )
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (slotIdFilter !== null) {
      query = query.in('slot_id', slotIdFilter);
    }

    const { data: reservations, error: resError } = await query;

    if (resError) {
      logger.error('Erreur récupération réservations récentes', { error: resError.message });
      return { data: [], error: resError.message };
    }

    if (!reservations || reservations.length === 0) {
      return { data: [], error: null };
    }

    const recentReservations: AdminRecentReservation[] = reservations.map((res) => {
      const slotData = res.slots;
      const slotIsValid = isValidSlot(slotData);
      const showData = slotIsValid ? slotData.shows : null;
      const venueData = slotIsValid ? slotData.venues : null;

      return {
        id: res.id,
        created_at: res.created_at,
        num_places: res.num_places,
        status: res.status,
        guest_first_name: res.guest_first_name,
        guest_last_name: res.guest_last_name,
        guest_email: res.guest_email,
        guest_structure: res.guest_structure,
        slot: {
          id: slotIsValid ? slotData.id : '',
          date: slotIsValid ? slotData.date : '',
          time: slotIsValid ? slotData.time : '',
          show: isValidShow(showData)
            ? { id: showData.id, title: showData.title }
            : { id: '', title: 'Spectacle inconnu' },
          venue: isValidVenue(venueData)
            ? venueData
            : { id: '', name: 'Lieu inconnu', city: '' },
        },
      };
    });

    return { data: recentReservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getRecentReservations', { message });
    return { data: [], error: message };
  }
}
