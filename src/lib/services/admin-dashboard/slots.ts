/**
 * Slots - Admin Dashboard Service
 * Derviche Diffusion
 * 
 * Récupère les créneaux à venir pour le dashboard
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { SlotHostedBy } from '@/types/database';
import type { AdminUpcomingSlot, AdminDashboardOptions, QueryResult } from './types';
import { isValidShow, isValidVenue } from './guards';
import { calculateBooked, calculateOccupancyRate, getTodayISO } from './helpers';

// ============================================
// CONSTANTES
// ============================================

/** Nombre de créneaux par défaut */
const DEFAULT_LIMIT = 10;

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Récupère les prochains créneaux
 * @param limit - Nombre maximum de créneaux à retourner
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getUpcomingSlots(
  limit: number = DEFAULT_LIMIT,
  options?: AdminDashboardOptions
): Promise<QueryResult<AdminUpcomingSlot[]>> {
  try {
    const supabase = createClient();
    const today = getTodayISO();
    const { assignedShowIds } = options || {};
    const hasFilter = assignedShowIds && assignedShowIds.length > 0;

    // Construire la requête
    let query = supabase
      .from('slots')
      .select(`
        id, show_id, venue_id, date, time, capacity, remaining_capacity, hosted_by,
        shows:show_id (id, title, slug, image_url),
        venues:venue_id (id, name, city)
      `)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(limit);

    // Appliquer le filtre si externe
    if (hasFilter) {
      query = query.in('show_id', assignedShowIds);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      logger.error('Erreur récupération créneaux à venir', { error: slotsError.message });
      return { data: [], error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }

    // Transformer les données avec validation
    const upcomingSlots: AdminUpcomingSlot[] = slots.map(slot => {
      // Utiliser les type guards pour valider les données
      const show = isValidShow(slot.shows)
        ? slot.shows
        : { id: slot.show_id, title: 'Spectacle inconnu', slug: '', image_url: null };

      const venue = isValidVenue(slot.venues)
        ? slot.venues
        : { id: slot.venue_id, name: 'Lieu inconnu', city: '' };

      const reservationsCount = calculateBooked(slot.capacity, slot.remaining_capacity);
      const occupancyRate = calculateOccupancyRate(slot.capacity, slot.remaining_capacity);

      return {
        id: slot.id,
        show_id: slot.show_id,
        venue_id: slot.venue_id,
        date: slot.date,
        time: slot.time,
        capacity: slot.capacity,
        remaining_capacity: slot.remaining_capacity,
        hosted_by: slot.hosted_by as SlotHostedBy,
        show,
        venue,
        reservations_count: reservationsCount,
        occupancy_rate: occupancyRate,
      };
    });

    return { data: upcomingSlots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getUpcomingSlots', { message });
    return { data: [], error: message };
  }
}
