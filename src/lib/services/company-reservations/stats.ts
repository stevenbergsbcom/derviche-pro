/**
 * Statistiques des réservations compagnie
 * Derviche Diffusion
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { CompanyReservationStats } from './types';

/**
 * Récupère les statistiques des réservations pour la compagnie
 */
export async function getCompanyReservationStats(
  filters: { showId?: string; slotId?: string } = {}
): Promise<{ data: CompanyReservationStats | null; error: string | null }> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('reservations')
      .select(`
        id,
        status,
        checkin_status,
        num_places,
        slots!inner (
          show_id
        )
      `);

    if (filters.slotId) {
      query = query.eq('slot_id', filters.slotId);
    }

    if (filters.showId) {
      query = query.eq('slots.show_id', filters.showId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[company-reservations] Erreur récupération stats', error);
      return { data: null, error: error.message };
    }

    const reservations = data || [];
    const stats: CompanyReservationStats = {
      total: reservations.length,
      confirmed: 0,
      cancelled: 0,
      noShow: 0,
      presentLoved: 0,
      presentPress: 0,
      presentNeutral: 0,
      absent: 0,
      totalPlaces: 0,
    };

    reservations.forEach(r => {
      if (r.status === 'confirmed') stats.confirmed++;
      else if (r.status === 'cancelled') stats.cancelled++;
      else if (r.status === 'no_show') stats.noShow++;

      if (r.checkin_status === 'present_loved') stats.presentLoved++;
      else if (r.checkin_status === 'present_press') stats.presentPress++;
      else if (r.checkin_status === 'present_neutral') stats.presentNeutral++;
      else if (r.checkin_status === 'absent') stats.absent++;

      if (r.status === 'confirmed') {
        stats.totalPlaces += r.num_places;
      }
    });

    return { data: stats, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getCompanyReservationStats', { message });
    return { data: null, error: message };
  }
}
