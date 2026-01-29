/**
 * Stats - Admin Dashboard Service
 * Derviche Diffusion
 * 
 * Récupère les statistiques globales du dashboard
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { AdminDashboardStats, AdminDashboardOptions, QueryResult } from './types';
import { 
  calculateOccupancyRate, 
  getTodayISO, 
  getWeekStartISO, 
  getTodayBounds,
  getSlotIdsForShows,
  UNLIMITED_CAPACITY 
} from './helpers';

// ============================================
// COMPTAGES
// ============================================

/**
 * Compte les spectacles actifs
 */
async function countActiveShows(
  supabase: ReturnType<typeof createClient>,
  assignedShowIds?: string[] | null
): Promise<{ count: number; error: string | null }> {
  let query = supabase
    .from('shows')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null);

  if (assignedShowIds && assignedShowIds.length > 0) {
    query = query.in('id', assignedShowIds);
  }

  const { count, error } = await query;

  if (error) {
    logger.error('Erreur comptage spectacles', { error: error.message });
    return { count: 0, error: 'spectacles' };
  }

  return { count: count ?? 0, error: null };
}

/**
 * Compte les créneaux à venir
 */
async function countUpcomingSlots(
  supabase: ReturnType<typeof createClient>,
  today: string,
  assignedShowIds?: string[] | null
): Promise<{ count: number; error: string | null }> {
  let query = supabase
    .from('slots')
    .select('*', { count: 'exact', head: true })
    .gte('date', today);

  if (assignedShowIds && assignedShowIds.length > 0) {
    query = query.in('show_id', assignedShowIds);
  }

  const { count, error } = await query;

  if (error) {
    logger.error('Erreur comptage créneaux', { error: error.message });
    return { count: 0, error: 'créneaux' };
  }

  return { count: count ?? 0, error: null };
}

/**
 * Compte les réservations confirmées
 */
async function countConfirmedReservations(
  supabase: ReturnType<typeof createClient>,
  slotIdFilter?: string[] | null,
  dateFilter?: { gte?: string; lte?: string }
): Promise<{ count: number; error: string | null }> {
  let query = supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  if (slotIdFilter && slotIdFilter.length > 0) {
    query = query.in('slot_id', slotIdFilter);
  }

  if (dateFilter?.gte) {
    query = query.gte('created_at', dateFilter.gte);
  }

  if (dateFilter?.lte) {
    query = query.lte('created_at', dateFilter.lte);
  }

  const { count, error } = await query;

  if (error) {
    logger.error('Erreur comptage réservations', { error: error.message, dateFilter });
    return { count: 0, error: 'réservations' };
  }

  return { count: count ?? 0, error: null };
}

/**
 * Calcule le taux de remplissage moyen
 */
async function calculateAverageOccupancy(
  supabase: ReturnType<typeof createClient>,
  today: string,
  assignedShowIds?: string[] | null
): Promise<{ rate: number; error: string | null }> {
  let query = supabase
    .from('slots')
    .select('capacity, remaining_capacity')
    .gte('date', today)
    .neq('capacity', UNLIMITED_CAPACITY);

  if (assignedShowIds && assignedShowIds.length > 0) {
    query = query.in('show_id', assignedShowIds);
  }

  const { data: slots, error } = await query;

  if (error) {
    logger.error('Erreur calcul taux remplissage', { error: error.message });
    return { rate: 0, error: 'taux de remplissage' };
  }

  if (!slots || slots.length === 0) {
    return { rate: 0, error: null };
  }

  const totalOccupancy = slots.reduce((sum, slot) => {
    return sum + calculateOccupancyRate(slot.capacity, slot.remaining_capacity);
  }, 0);

  return { 
    rate: Math.round(totalOccupancy / slots.length), 
    error: null 
  };
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Récupère les statistiques globales
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getStats(
  options?: AdminDashboardOptions
): Promise<QueryResult<AdminDashboardStats>> {
  const errors: string[] = [];
  const { assignedShowIds } = options || {};
  const hasFilter = assignedShowIds && assignedShowIds.length > 0;

  try {
    const supabase = createClient();
    const today = getTodayISO();
    const weekStart = getWeekStartISO();
    const todayBounds = getTodayBounds();

    // Préparer le filtre par slots si externe
    let slotIdFilter: string[] | null = null;
    if (hasFilter) {
      const { slotIds, error: slotError } = await getSlotIdsForShows(supabase, assignedShowIds);
      if (slotError) {
        errors.push('slot_ids');
      }
      slotIdFilter = slotIds;
    }

    // Exécuter tous les comptages en parallèle
    const [
      showsResult,
      slotsResult,
      totalResResult,
      todayResResult,
      weekResResult,
      occupancyResult,
    ] = await Promise.all([
      countActiveShows(supabase, assignedShowIds),
      countUpcomingSlots(supabase, today, assignedShowIds),
      countConfirmedReservations(supabase, slotIdFilter),
      countConfirmedReservations(supabase, slotIdFilter, { 
        gte: todayBounds.start, 
        lte: todayBounds.end 
      }),
      countConfirmedReservations(supabase, slotIdFilter, { gte: weekStart }),
      calculateAverageOccupancy(supabase, today, assignedShowIds),
    ]);

    // Collecter les erreurs
    if (showsResult.error) errors.push(showsResult.error);
    if (slotsResult.error) errors.push(slotsResult.error);
    if (totalResResult.error) errors.push('réservations totales');
    if (todayResResult.error) errors.push('réservations du jour');
    if (weekResResult.error) errors.push('réservations de la semaine');
    if (occupancyResult.error) errors.push(occupancyResult.error);

    return {
      data: {
        total_shows_active: showsResult.count,
        total_slots_upcoming: slotsResult.count,
        total_reservations: totalResResult.count,
        reservations_today: todayResResult.count,
        reservations_this_week: weekResResult.count,
        average_occupancy_rate: occupancyResult.rate,
      },
      error: errors.length > 0 ? `Erreur partielle: ${errors.join(', ')}` : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getStats', { message });
    return {
      data: {
        total_shows_active: 0,
        total_slots_upcoming: 0,
        total_reservations: 0,
        reservations_today: 0,
        reservations_this_week: 0,
        average_occupancy_rate: 0,
      },
      error: message,
    };
  }
}
