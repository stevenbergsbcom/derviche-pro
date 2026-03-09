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

const DEFAULT_LIMIT = 10;

/**
 * Récupère les prochains créneaux.
 *
 * Convention assignedShowIds :
 *   undefined | null → accès complet
 *   []               → externe sans assignation → []
 *   ['id', ...]      → externe filtré
 */
export async function getUpcomingSlots(
  limit: number = DEFAULT_LIMIT,
  options?: AdminDashboardOptions
): Promise<QueryResult<AdminUpcomingSlot[]>> {
  try {
    const supabase = createClient();
    const today = getTodayISO();

    // Narrow : string[] si externe, null si accès complet
    const showIdFilter: string[] | null = Array.isArray(options?.assignedShowIds)
      ? options.assignedShowIds
      : null;

    // Externe sans assignation → liste vide
    if (showIdFilter !== null && showIdFilter.length === 0) {
      return { data: [], error: null };
    }

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

    if (showIdFilter !== null) {
      query = query.in('show_id', showIdFilter);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      logger.error('Erreur récupération créneaux à venir', { error: slotsError.message });
      return { data: [], error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }

    const upcomingSlots: AdminUpcomingSlot[] = slots.map((slot) => {
      const show = isValidShow(slot.shows)
        ? slot.shows
        : { id: slot.show_id, title: 'Spectacle inconnu', slug: '', image_url: null };

      const venue = isValidVenue(slot.venues)
        ? slot.venues
        : { id: slot.venue_id, name: 'Lieu inconnu', city: '' };

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
        reservations_count: calculateBooked(slot.capacity, slot.remaining_capacity),
        occupancy_rate: calculateOccupancyRate(slot.capacity, slot.remaining_capacity),
      };
    });

    return { data: upcomingSlots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getUpcomingSlots', { message });
    return { data: [], error: message };
  }
}
