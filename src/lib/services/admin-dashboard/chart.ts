/**
 * Chart - Admin Dashboard Service
 * Derviche Diffusion
 *
 * Construit les données pour le graphique d'évolution des réservations.
 * Retourne un point par jour sur la période sélectionnée.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { generateDateRange } from './period';
import type { ReservationChartPoint, PeriodBounds, QueryResult, AdminDashboardOptions } from './types';
import { getSlotIdsForShows } from './helpers';

// ============================================
// FORMATAGE DES LABELS
// ============================================

function formatChartLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================
// REQUÊTE PRINCIPALE
// ============================================

/**
 * Récupère les données pour le graphique des réservations.
 *
 * Convention assignedShowIds :
 *   undefined | null → accès complet
 *   []               → externe sans assignation → tous counts à 0
 *   ['id', ...]      → externe filtré
 */
export async function getChartData(
  bounds: PeriodBounds,
  options?: AdminDashboardOptions
): Promise<QueryResult<ReservationChartPoint[]>> {
  try {
    const supabase = createClient();

    // Narrow : string[] si externe, null si accès complet
    const showIdFilter: string[] | null = Array.isArray(options?.assignedShowIds)
      ? options.assignedShowIds
      : null;

    // Externe sans assignation → graphique vide (tous counts à 0)
    if (showIdFilter !== null && showIdFilter.length === 0) {
      const allDates = generateDateRange(bounds.start, bounds.end);
      return {
        data: allDates.map((date) => ({ label: formatChartLabel(date), date, count: 0 })),
        error: null,
      };
    }

    // Si externe, filtrer par slot_ids
    let slotIdFilter: string[] | null = null;
    if (showIdFilter !== null) {
      const { slotIds, error: slotError } = await getSlotIdsForShows(supabase, showIdFilter);
      if (slotError) {
        logger.error('Erreur slot_ids pour chart', { error: slotError });
      }
      slotIdFilter = slotIds;
    }

    let query = supabase
      .from('reservations')
      .select('created_at')
      .eq('status', 'confirmed')
      .gte('created_at', `${bounds.start}T00:00:00`)
      .lte('created_at', `${bounds.end}T23:59:59`);

    if (slotIdFilter !== null) {
      query = query.in('slot_id', slotIdFilter);
    }

    const { data: reservations, error } = await query;

    if (error) {
      logger.error('Erreur getChartData', { error: error.message });
      return { data: [], error: error.message };
    }

    // Agréger par jour
    const countsByDate = new Map<string, number>();
    for (const r of reservations ?? []) {
      const day = r.created_at.split('T')[0];
      if (day) {
        countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1);
      }
    }

    const allDates = generateDateRange(bounds.start, bounds.end);
    const chartData: ReservationChartPoint[] = allDates.map((date) => ({
      label: formatChartLabel(date),
      date,
      count: countsByDate.get(date) ?? 0,
    }));

    return { data: chartData, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getChartData', { message });
    return { data: [], error: message };
  }
}
