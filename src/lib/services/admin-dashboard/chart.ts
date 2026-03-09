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

/**
 * Formate une date ISO en label lisible court.
 * - 7j  : "3 mars"
 * - 30j : "3 mars"
 * - saison : "3 mars"
 */
function formatChartLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`); // midi UTC pour éviter décalage TZ
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================
// REQUÊTE PRINCIPALE
// ============================================

/**
 * Récupère les données pour le graphique des réservations.
 * Retourne un point par jour (count = 0 si aucune réservation ce jour).
 *
 * @param bounds - Bornes de la période (start, end au format YYYY-MM-DD)
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getChartData(
  bounds: PeriodBounds,
  options?: AdminDashboardOptions
): Promise<QueryResult<ReservationChartPoint[]>> {
  try {
    const supabase = createClient();
    const { assignedShowIds } = options || {};

    // Préparer filtre slot_ids si externe
    let slotIdFilter: string[] | null = null;
    if (assignedShowIds && assignedShowIds.length > 0) {
      const { slotIds, error: slotError } = await getSlotIdsForShows(supabase, assignedShowIds);
      if (slotError) {
        logger.error('Erreur slot_ids pour chart', { error: slotError });
      }
      slotIdFilter = slotIds;
    }

    // Récupérer toutes les réservations confirmées sur la période
    let query = supabase
      .from('reservations')
      .select('created_at')
      .eq('status', 'confirmed')
      .gte('created_at', `${bounds.start}T00:00:00`)
      .lte('created_at', `${bounds.end}T23:59:59`);

    if (slotIdFilter && slotIdFilter.length > 0) {
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

    // Générer tous les jours de la période (avec count=0 si aucune résa)
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
