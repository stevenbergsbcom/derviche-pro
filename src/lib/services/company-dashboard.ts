/**
 * Service Company Dashboard
 * Derviche Diffusion
 * 
 * Gère la récupération des données pour l'interface compagnie (lecture seule)
 * - Infos compagnie
 * - Spectacles de la compagnie
 * - Statistiques de réservations
 * - Prochains créneaux
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { CompanyRow, ShowRow, VenueRow, ShowStatus, SlotHostedBy } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Spectacle avec statistiques pour le dashboard compagnie */
export interface CompanyShowWithStats {
  id: string;
  slug: string;
  title: string;
  company_id: string;
  short_description: string | null;
  long_description: string | null;
  duration_minutes: number | null;
  practical_info: string | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  status: ShowStatus;
  price_type: string;
  price_amount: number | null;
  max_reservations_per_booking: number;
  period: string | null;
  derviche_manager_id: string | null;
  invitation_policy: string | null;
  closure_dates: string | null;
  folder_url: string | null;
  teaser_url: string | null;
  captation_available: boolean;
  captation_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Stats additionnelles
  total_slots: number;
  total_reservations: number;
  total_capacity: number;
  occupancy_rate: number; // Pourcentage
}

/** Créneau à venir avec détails */
export interface UpcomingSlot {
  id: string;
  show_id: string;
  venue_id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  hosted_by: SlotHostedBy;
  hosted_by_id: string | null;
  created_at: string;
  updated_at: string;
  // Données jointes
  show: Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'>;
  venue: Pick<VenueRow, 'id' | 'name' | 'city'>;
  reservations_count: number;
  /** Nombre de pros ayant effectivement assisté (checkin_status != 'absent' && != null) */
  checkin_count: number;
}

/** Statistiques globales du dashboard */
export interface CompanyDashboardStats {
  total_shows: number;
  total_slots: number;
  total_reservations: number;
  total_capacity: number;
  average_occupancy_rate: number; // Pourcentage
  upcoming_slots_count: number;
}

/** Données complètes du dashboard compagnie */
export interface CompanyDashboardData {
  company: CompanyRow | null;
  stats: CompanyDashboardStats;
  shows: CompanyShowWithStats[];
  upcomingSlots: UpcomingSlot[];
}

/** Résultat d'une opération */
export interface CompanyDashboardResult {
  data: CompanyDashboardData | null;
  error: string | null;
}

// ============================================
// FONCTIONS
// ============================================

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

/**
 * Récupère les prochains créneaux d'une compagnie
 */
export async function getUpcomingSlots(companyId: string, limit: number = 5): Promise<{ data: UpcomingSlot[]; error: string | null }> {
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

    // 2. Récupérer les prochains créneaux
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        *,
        venues:venue_id (id, name, city)
      `)
      .in('show_id', showIds)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(limit);

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
        // Présents = checkin_status défini et différent de 'absent'
        if (res.checkin_status && res.checkin_status !== 'absent') {
          checkinBySlot[res.slot_id] = (checkinBySlot[res.slot_id] || 0) + 1;
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

/**
 * Récupère toutes les données du dashboard compagnie
 */
export async function getCompanyDashboard(userId: string): Promise<CompanyDashboardResult> {
  try {
    // 1. Récupérer le company_id de l'utilisateur
    const { companyId, error: companyIdError } = await getCompanyIdForUser(userId);

    if (companyIdError || !companyId) {
      return { data: null, error: companyIdError || 'Compagnie non trouvée' };
    }

    // 2. Récupérer les données en parallèle
    const [companyResult, showsResult, upcomingSlotsResult] = await Promise.all([
      getCompanyInfo(companyId),
      getCompanyShowsWithStats(companyId),
      getUpcomingSlots(companyId, 10),
    ]);

    // 3. Calculer les statistiques globales
    const shows = showsResult.data;
    const stats: CompanyDashboardStats = {
      total_shows: shows.length,
      total_slots: shows.reduce((sum, s) => sum + s.total_slots, 0),
      total_reservations: shows.reduce((sum, s) => sum + s.total_reservations, 0),
      total_capacity: shows.reduce((sum, s) => sum + s.total_capacity, 0),
      average_occupancy_rate: shows.length > 0
        ? Math.round(shows.reduce((sum, s) => sum + s.occupancy_rate, 0) / shows.length)
        : 0,
      upcoming_slots_count: upcomingSlotsResult.data.length,
    };

    return {
      data: {
        company: companyResult.data,
        stats,
        shows,
        upcomingSlots: upcomingSlotsResult.data,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanyDashboard', { message });
    return { data: null, error: message };
  }
}
