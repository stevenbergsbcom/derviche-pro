/**
 * Queries Company Dashboard
 * Derviche Diffusion
 *
 * Fonctions individuelles de requêtes pour le dashboard compagnie
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { CompanyRow, ShowStatus, SlotHostedBy, VenueRow } from '@/types/database';
import type { CompanyShowWithStats, UpcomingSlot } from './types';

/**
 * Récupère le company_id de l'utilisateur connecté
 */
export async function getCompanyIdForUser(userId: string): Promise<{ companyId: string | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Erreur récupération company_id', { userId, error: error.message });
      return { companyId: null, error: error.message };
    }

    if (!data?.company_id) {
      logger.warn('Utilisateur sans company_id', { userId });
      return { companyId: null, error: 'Aucune compagnie associée à cet utilisateur' };
    }

    return { companyId: data.company_id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanyIdForUser', { message });
    return { companyId: null, error: message };
  }
}

/**
 * Récupère les informations de la compagnie
 */
export async function getCompanyInfo(companyId: string): Promise<{ data: CompanyRow | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Erreur récupération compagnie', { companyId, error: error.message });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanyInfo', { message });
    return { data: null, error: message };
  }
}

/**
 * Récupère les spectacles d'une compagnie avec leurs statistiques
 */
export async function getCompanyShowsWithStats(companyId: string): Promise<{ data: CompanyShowWithStats[]; error: string | null }> {
  try {
    const supabase = createClient();

    // 1. Récupérer les spectacles de la compagnie
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (showsError) {
      logger.error('Erreur récupération spectacles compagnie', { companyId, error: showsError.message });
      return { data: [], error: showsError.message };
    }

    if (!shows || shows.length === 0) {
      return { data: [], error: null };
    }

    const showIds = shows.map(s => s.id);

    // 2. Récupérer les créneaux pour ces spectacles
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, show_id, capacity')
      .in('show_id', showIds);

    if (slotsError) {
      logger.error('Erreur récupération créneaux', { error: slotsError.message });
      // Continuer avec des stats à 0
    }

    const slotsByShow: Record<string, { count: number; totalCapacity: number; slotIds: string[] }> = {};
    (slots || []).forEach(slot => {
      if (!slotsByShow[slot.show_id]) {
        slotsByShow[slot.show_id] = { count: 0, totalCapacity: 0, slotIds: [] };
      }
      slotsByShow[slot.show_id].count++;
      // Gérer la capacité illimitée (999999)
      const capacity = slot.capacity === 999999 ? 0 : slot.capacity;
      slotsByShow[slot.show_id].totalCapacity += capacity;
      slotsByShow[slot.show_id].slotIds.push(slot.id);
    });

    // 3. Récupérer les réservations confirmées pour ces créneaux
    const allSlotIds = (slots || []).map(s => s.id);
    const reservationsBySlot: Record<string, number> = {};

    if (allSlotIds.length > 0) {
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('slot_id, num_places')
        .in('slot_id', allSlotIds)
        .eq('status', 'confirmed');

      if (resError) {
        logger.error('Erreur récupération réservations', { error: resError.message });
      } else {
        (reservations || []).forEach(res => {
          reservationsBySlot[res.slot_id] = (reservationsBySlot[res.slot_id] || 0) + res.num_places;
        });
      }
    }

    // 4. Construire les stats par spectacle
    const showsWithStats: CompanyShowWithStats[] = shows.map(show => {
      const showSlots = slotsByShow[show.id] || { count: 0, totalCapacity: 0, slotIds: [] };

      let totalReservations = 0;
      showSlots.slotIds.forEach(slotId => {
        totalReservations += reservationsBySlot[slotId] || 0;
      });

      const occupancyRate = showSlots.totalCapacity > 0
        ? Math.round((totalReservations / showSlots.totalCapacity) * 100)
        : 0;

      return {
        ...show,
        status: show.status as ShowStatus,
        total_slots: showSlots.count,
        total_reservations: totalReservations,
        total_capacity: showSlots.totalCapacity,
        occupancy_rate: occupancyRate,
      };
    });

    return { data: showsWithStats, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanyShowsWithStats', { message });
    return { data: [], error: message };
  }
}

export type SlotRangeMode = 'upcoming' | 'past';

/**
 * Récupère les créneaux d'une compagnie, soit à venir (`upcoming`), soit passés (`past`).
 *
 * - `upcoming` : tri chronologique ascendant, limité à `limit` (défaut 5)
 * - `past`     : tri chronologique **descendant** (plus récent d'abord),
 *                limit optionnelle (0 = toutes)
 */
export async function getUpcomingSlots(
  companyId: string,
  limit: number = 5,
  range: SlotRangeMode = 'upcoming',
): Promise<{ data: UpcomingSlot[]; error: string | null }> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Récupérer les spectacles de la compagnie (pour filtrer)
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('id, title, slug, image_url')
      .eq('company_id', companyId)
      .is('deleted_at', null);

    if (showsError || !shows || shows.length === 0) {
      return { data: [], error: showsError?.message || null };
    }

    const showIds = shows.map(s => s.id);
    const showsMap = new Map(shows.map(s => [s.id, s]));

    // 2. Récupérer les créneaux selon le mode
    //    - upcoming : date >= today, tri ASC, limité à `limit`
    //    - past     : date <  today, tri DESC (plus récent d'abord), limit
    //                 ignorée si === 0 (toutes les représentations passées)
    let slotsQuery = supabase
      .from('slots')
      .select(`
        *,
        venues:venue_id (id, name, city)
      `)
      .in('show_id', showIds);

    if (range === 'upcoming') {
      slotsQuery = slotsQuery
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
    } else {
      slotsQuery = slotsQuery
        .lt('date', today)
        .order('date', { ascending: false })
        .order('time', { ascending: false });
    }

    if (limit > 0) {
      slotsQuery = slotsQuery.limit(limit);
    }

    const { data: slots, error: slotsError } = await slotsQuery;

    if (slotsError) {
      logger.error('Erreur récupération créneaux à venir', { error: slotsError.message });
      return { data: [], error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }

    // 3. Récupérer les réservations + statuts check-in par créneau
    const slotIds = slots.map(s => s.id);
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('slot_id, num_places, checkin_status')
      .in('slot_id', slotIds)
      .eq('status', 'confirmed');

    const reservationsBySlot: Record<string, number> = {};
    const checkinBySlot: Record<string, number> = {};

    if (!resError && reservations) {
      reservations.forEach((res: { slot_id: string; num_places: number; checkin_status: string | null }) => {
        reservationsBySlot[res.slot_id] = (reservationsBySlot[res.slot_id] || 0) + res.num_places;
        // Présents = sum des num_places (checkin_status défini et différent de 'absent')
        // Une réservation peut couvrir plusieurs personnes → sommer num_places
        if (res.checkin_status && res.checkin_status !== 'absent') {
          checkinBySlot[res.slot_id] = (checkinBySlot[res.slot_id] || 0) + res.num_places;
        }
      });
    }

    // 4. Construire les données
    const upcomingSlots: UpcomingSlot[] = slots.map(slot => {
      const show = showsMap.get(slot.show_id);
      const venue = slot.venues as unknown as Pick<VenueRow, 'id' | 'name' | 'city'>;

      return {
        id: slot.id,
        show_id: slot.show_id,
        venue_id: slot.venue_id,
        date: slot.date,
        time: slot.time,
        capacity: slot.capacity,
        remaining_capacity: slot.remaining_capacity,
        hosted_by: slot.hosted_by as SlotHostedBy,
        hosted_by_id: slot.hosted_by_id,
        created_at: slot.created_at,
        updated_at: slot.updated_at,
        show: show || { id: slot.show_id, title: 'Spectacle inconnu', slug: '', image_url: null },
        venue: venue || { id: slot.venue_id, name: 'Lieu inconnu', city: '' },
        reservations_count: reservationsBySlot[slot.id] || 0,
        checkin_count: checkinBySlot[slot.id] || 0,
      };
    });

    return { data: upcomingSlots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getUpcomingSlots', { message });
    return { data: [], error: message };
  }
}
