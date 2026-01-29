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

// ============================================
// CONSTANTES
// ============================================

/** Nombre de réservations par défaut */
const DEFAULT_LIMIT = 10;

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Récupère les réservations récentes
 * @param limit - Nombre maximum de réservations à retourner
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getRecentReservations(
  limit: number = DEFAULT_LIMIT,
  options?: AdminDashboardOptions
): Promise<QueryResult<AdminRecentReservation[]>> {
  try {
    const supabase = createClient();
    const { assignedShowIds } = options || {};
    const hasFilter = assignedShowIds && assignedShowIds.length > 0;

    // Si externe, récupérer d'abord les slot_ids de leurs spectacles
    let slotIdFilter: string[] | null = null;

    if (hasFilter) {
      const { slotIds, error } = await getSlotIdsForShows(supabase, assignedShowIds);
      
      if (error) {
        return { data: [], error };
      }

      // Aucun slot trouvé = aucune réservation possible
      if (slotIds.length === 0) {
        return { data: [], error: null };
      }

      slotIdFilter = slotIds;
    }

    // Construire la requête
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

    // Appliquer le filtre si externe
    if (slotIdFilter) {
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

    // Transformer les données avec validation
    const recentReservations: AdminRecentReservation[] = reservations.map(res => {
      // Utiliser le type guard pour valider le slot
      const slotData = res.slots;
      const slotIsValid = isValidSlot(slotData);

      // Extraire les données du show et venue avec validation
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
