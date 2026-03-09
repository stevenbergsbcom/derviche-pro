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
  UNLIMITED_CAPACITY,
} from './helpers';

// ============================================
// COMPTAGES
// ============================================

/**
 * Compte les spectacles actifs (publiés).
 * @param showIdFilter  string[] = filtre externe | null = accès complet
 */
async function countActiveShows(
  supabase: ReturnType<typeof createClient>,
  showIdFilter: string[] | null
): Promise<{ count: number; error: string | null }> {
  let query = supabase
    .from('shows')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .is('deleted_at', null);

  if (showIdFilter !== null) {
    query = query.in('id', showIdFilter);
  }

  const { count, error } = await query;

  if (error) {
    logger.error('Erreur comptage spectacles', { error: error.message });
    return { count: 0, error: 'spectacles' };
  }

  return { count: count ?? 0, error: null };
}

/**
 * Compte les créneaux à venir.
 * @param showIdFilter  string[] = filtre externe | null = accès complet
 */
async function countUpcomingSlots(
  supabase: ReturnType<typeof createClient>,
  today: string,
  showIdFilter: string[] | null
): Promise<{ count: number; error: string | null }> {
  let query = supabase
    .from('slots')
    .select('*', { count: 'exact', head: true })
    .gte('date', today);

  if (showIdFilter !== null) {
    query = query.in('show_id', showIdFilter);
  }

  const { count, error } = await query;

  if (error) {
    logger.error('Erreur comptage créneaux', { error: error.message });
    return { count: 0, error: 'créneaux' };
  }

  return { count: count ?? 0, error: null };
}

/**
 * Compte les réservations confirmées.
 * @param slotIdFilter  string[] = filtre par slots | null = accès complet
 */
async function countConfirmedReservations(
  supabase: ReturnType<typeof createClient>,
  slotIdFilter: string[] | null,
  dateFilter?: { gte?: string; lte?: string }
): Promise<{ count: number; error: string | null }> {
  let query = supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  if (slotIdFilter !== null) {
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
 * Calcule le taux de remplissage moyen.
 * @param showIdFilter  string[] = filtre externe | null = accès complet
 */
async function calculateAverageOccupancy(
  supabase: ReturnType<typeof createClient>,
  today: string,
  showIdFilter: string[] | null
): Promise<{ rate: number; error: string | null }> {
  let query = supabase
    .from('slots')
    .select('capacity, remaining_capacity')
    .gte('date', today)
    .neq('capacity', UNLIMITED_CAPACITY);

  if (showIdFilter !== null) {
    query = query.in('show_id', showIdFilter);
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
    error: null,
  };
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/** Données vides (utilisateur externe sans assignation) */
const EMPTY_STATS: AdminDashboardStats = {
  total_shows_active: 0,
  total_slots_upcoming: 0,
  total_reservations: 0,
  reservations_today: 0,
  reservations_this_week: 0,
  average_occupancy_rate: 0,
};

/**
 * Récupère les statistiques globales.
 *
 * Convention :
 *   assignedShowIds = undefined | null → accès complet (admin/super-admin)
 *   assignedShowIds = []               → externe sans assignation → tout à 0
 *   assignedShowIds = ['id', ...]      → externe avec assignations → filtré
 */
export async function getStats(
  options?: AdminDashboardOptions
): Promise<QueryResult<AdminDashboardStats>> {
  const errors: string[] = [];

  // Narrow : string[] si externe, null si accès complet
  const showIdFilter: string[] | null = Array.isArray(options?.assignedShowIds)
    ? options.assignedShowIds
    : null;

  // Externe sans aucune assignation → tout à zéro, pas de requêtes
  if (showIdFilter !== null && showIdFilter.length === 0) {
    return { data: EMPTY_STATS, error: null };
  }

  try {
    const supabase = createClient();
    const today = getTodayISO();
    const weekStart = getWeekStartISO();
    const todayBounds = getTodayBounds();

    // Filtre par slot_id pour les réservations (externe seulement)
    let slotIdFilter: string[] | null = null;
    if (showIdFilter !== null) {
      const { slotIds, error: slotError } = await getSlotIdsForShows(supabase, showIdFilter);
      if (slotError) {
        errors.push('slot_ids');
      }
      // Si aucun slot trouvé pour ces spectacles, les comptages seront 0
      slotIdFilter = slotIds;
    }

    // Tous les comptages en parallèle
    const [
      showsResult,
      slotsResult,
      totalResResult,
      todayResResult,
      weekResResult,
      occupancyResult,
    ] = await Promise.all([
      countActiveShows(supabase, showIdFilter),
      countUpcomingSlots(supabase, today, showIdFilter),
      countConfirmedReservations(supabase, slotIdFilter),
      countConfirmedReservations(supabase, slotIdFilter, {
        gte: todayBounds.start,
        lte: todayBounds.end,
      }),
      countConfirmedReservations(supabase, slotIdFilter, { gte: weekStart }),
      calculateAverageOccupancy(supabase, today, showIdFilter),
    ]);

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
    return { data: EMPTY_STATS, error: message };
  }
}
