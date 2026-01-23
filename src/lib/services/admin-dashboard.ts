/**
 * Service Admin Dashboard
 * Derviche Diffusion
 * 
 * Récupère les données pour le tableau de bord administrateur
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { ShowRow, VenueRow, SlotHostedBy } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Statistiques globales du dashboard admin */
export interface AdminDashboardStats {
  total_shows_active: number;
  total_slots_upcoming: number;
  total_reservations: number;
  reservations_today: number;
  reservations_this_week: number;
  average_occupancy_rate: number;
}

/** Créneau à venir avec détails */
export interface AdminUpcomingSlot {
  id: string;
  show_id: string;
  venue_id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  hosted_by: SlotHostedBy;
  // Données jointes
  show: Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'>;
  venue: Pick<VenueRow, 'id' | 'name' | 'city'>;
  reservations_count: number;
  occupancy_rate: number;
}

/** Réservation récente */
export interface AdminRecentReservation {
  id: string;
  created_at: string;
  num_places: number;
  status: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_structure: string | null;
  slot: {
    id: string;
    date: string;
    time: string;
    show: Pick<ShowRow, 'id' | 'title'>;
    venue: Pick<VenueRow, 'id' | 'name' | 'city'>;
  };
}

/** Données complètes du dashboard admin */
export interface AdminDashboardData {
  stats: AdminDashboardStats;
  upcomingSlots: AdminUpcomingSlot[];
  recentReservations: AdminRecentReservation[];
}

/** Résultat d'une opération */
export interface AdminDashboardResult {
  data: AdminDashboardData | null;
  error: string | null;
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcule le nombre de places réservées à partir de capacity et remaining_capacity
 */
function calculateBooked(capacity: number, remainingCapacity: number): number {
  // 999999 = capacité illimitée
  if (capacity === 999999) {
    return 999999 - remainingCapacity;
  }
  return capacity - remainingCapacity;
}

/**
 * Calcule le taux de remplissage en pourcentage
 */
function calculateOccupancyRate(capacity: number, remainingCapacity: number): number {
  if (capacity === 999999 || capacity === 0) {
    return 0;
  }
  const booked = calculateBooked(capacity, remainingCapacity);
  return Math.round((booked / capacity) * 100);
}

// ============================================
// FONCTIONS
// ============================================

/**
 * Récupère les statistiques globales
 */
async function getStats(): Promise<{ data: AdminDashboardStats; error: string | null }> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculer le début de la semaine (lundi)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const weekStart = monday.toISOString().split('T')[0];

    // 1. Spectacles actifs
    const { count: showsCount, error: showsError } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('deleted_at', null);

    if (showsError) {
      logger.error('Erreur comptage spectacles', { error: showsError.message });
    }

    // 2. Créneaux à venir
    const { count: slotsCount, error: slotsError } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .gte('date', today);

    if (slotsError) {
      logger.error('Erreur comptage créneaux', { error: slotsError.message });
    }

    // 3. Réservations totales confirmées
    const { count: totalReservations, error: totalResError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    if (totalResError) {
      logger.error('Erreur comptage réservations totales', { error: totalResError.message });
    }

    // 4. Réservations aujourd'hui
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;
    const { count: todayReservations, error: todayResError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    if (todayResError) {
      logger.error('Erreur comptage réservations aujourd\'hui', { error: todayResError.message });
    }

    // 5. Réservations cette semaine
    const { count: weekReservations, error: weekResError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', weekStart);

    if (weekResError) {
      logger.error('Erreur comptage réservations semaine', { error: weekResError.message });
    }

    // 6. Taux de remplissage moyen (sur les créneaux à venir)
    const { data: upcomingSlots, error: occupancyError } = await supabase
      .from('slots')
      .select('capacity, remaining_capacity')
      .gte('date', today)
      .neq('capacity', 999999); // Exclure capacité illimitée

    let averageOccupancy = 0;
    if (!occupancyError && upcomingSlots && upcomingSlots.length > 0) {
      const totalOccupancy = upcomingSlots.reduce((sum, slot) => {
        return sum + calculateOccupancyRate(slot.capacity, slot.remaining_capacity);
      }, 0);
      averageOccupancy = Math.round(totalOccupancy / upcomingSlots.length);
    }

    return {
      data: {
        total_shows_active: showsCount || 0,
        total_slots_upcoming: slotsCount || 0,
        total_reservations: totalReservations || 0,
        reservations_today: todayReservations || 0,
        reservations_this_week: weekReservations || 0,
        average_occupancy_rate: averageOccupancy,
      },
      error: null,
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

/**
 * Récupère les prochains créneaux
 */
async function getUpcomingSlots(limit: number = 10): Promise<{ data: AdminUpcomingSlot[]; error: string | null }> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: slots, error: slotsError } = await supabase
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

    if (slotsError) {
      logger.error('Erreur récupération créneaux à venir', { error: slotsError.message });
      return { data: [], error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }

    const upcomingSlots: AdminUpcomingSlot[] = slots.map(slot => {
      const show = slot.shows as unknown as Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'>;
      const venue = slot.venues as unknown as Pick<VenueRow, 'id' | 'name' | 'city'>;
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
        show: show || { id: slot.show_id, title: 'Spectacle inconnu', slug: '', image_url: null },
        venue: venue || { id: slot.venue_id, name: 'Lieu inconnu', city: '' },
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

/**
 * Récupère les réservations récentes
 */
async function getRecentReservations(limit: number = 10): Promise<{ data: AdminRecentReservation[]; error: string | null }> {
  try {
    const supabase = createClient();

    const { data: reservations, error: resError } = await supabase
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

    if (resError) {
      logger.error('Erreur récupération réservations récentes', { error: resError.message });
      return { data: [], error: resError.message };
    }

    if (!reservations || reservations.length === 0) {
      return { data: [], error: null };
    }

    const recentReservations: AdminRecentReservation[] = reservations.map(res => {
      const slot = res.slots as unknown as {
        id: string;
        date: string;
        time: string;
        shows: Pick<ShowRow, 'id' | 'title'>;
        venues: Pick<VenueRow, 'id' | 'name' | 'city'>;
      };

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
          id: slot?.id || '',
          date: slot?.date || '',
          time: slot?.time || '',
          show: slot?.shows || { id: '', title: 'Spectacle inconnu' },
          venue: slot?.venues || { id: '', name: 'Lieu inconnu', city: '' },
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

/**
 * Récupère toutes les données du dashboard admin
 */
export async function getAdminDashboard(): Promise<AdminDashboardResult> {
  try {
    const [statsResult, slotsResult, reservationsResult] = await Promise.all([
      getStats(),
      getUpcomingSlots(10),
      getRecentReservations(10),
    ]);

    return {
      data: {
        stats: statsResult.data,
        upcomingSlots: slotsResult.data,
        recentReservations: reservationsResult.data,
      },
      error: statsResult.error || slotsResult.error || reservationsResult.error,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAdminDashboard', { message });
    return { data: null, error: message };
  }
}
