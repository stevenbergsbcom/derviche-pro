/**
 * Service Admin Dashboard
 * Derviche Diffusion
 * 
 * Récupère les données pour le tableau de bord administrateur
 * Supporte le filtrage par spectacles assignés (pour les externes)
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

/** Options pour filtrer les données (externes) */
export interface AdminDashboardOptions {
  /** Liste des show_id auxquels l'utilisateur a accès (null = accès complet) */
  assignedShowIds?: string[] | null;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Vérifie si les données correspondent à un Show valide
 */
function isValidShow(data: unknown): data is Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { title: unknown }).title === 'string'
  );
}

/**
 * Vérifie si les données correspondent à un Venue valide
 */
function isValidVenue(data: unknown): data is Pick<VenueRow, 'id' | 'name' | 'city'> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { name: unknown }).name === 'string'
  );
}

/**
 * Vérifie si les données correspondent à un Slot valide (pour réservations)
 */
function isValidSlot(data: unknown): data is {
  id: string;
  date: string;
  time: string;
  shows: unknown;
  venues: unknown;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'date' in data &&
    'time' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { date: unknown }).date === 'string' &&
    typeof (data as { time: unknown }).time === 'string'
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcule le nombre de places réservées à partir de capacity et remaining_capacity
 * Utilise Math.max pour éviter les valeurs négatives
 */
function calculateBooked(capacity: number, remainingCapacity: number): number {
  // 999999 = capacité illimitée
  if (capacity === 999999) {
    return Math.max(0, 999999 - remainingCapacity);
  }
  return Math.max(0, capacity - remainingCapacity);
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
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
async function getStats(options?: AdminDashboardOptions): Promise<{ data: AdminDashboardStats; error: string | null }> {
  const errors: string[] = [];
  const { assignedShowIds } = options || {};
  const hasFilter = assignedShowIds && assignedShowIds.length > 0;
  
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

    // 1. Spectacles actifs (filtrés si externe)
    let showsQuery = supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('deleted_at', null);
    
    if (hasFilter) {
      showsQuery = showsQuery.in('id', assignedShowIds);
    }

    const { count: showsCount, error: showsError } = await showsQuery;

    if (showsError) {
      logger.error('Erreur comptage spectacles', { error: showsError.message });
      errors.push('spectacles');
    }

    // 2. Créneaux à venir (filtrés si externe)
    let slotsQuery = supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .gte('date', today);
    
    if (hasFilter) {
      slotsQuery = slotsQuery.in('show_id', assignedShowIds);
    }

    const { count: slotsCount, error: slotsError } = await slotsQuery;

    if (slotsError) {
      logger.error('Erreur comptage créneaux', { error: slotsError.message });
      errors.push('créneaux');
    }

    // 3. Réservations totales confirmées (filtrées si externe)
    // Pour filtrer par show, on doit joindre avec slots
    let totalReservations = 0;
    let totalResError = null;

    if (hasFilter) {
      // Pour les externes : récupérer les slot_ids de leurs spectacles
      const { data: slotIds, error: slotIdsError } = await supabase
        .from('slots')
        .select('id')
        .in('show_id', assignedShowIds);

      if (slotIdsError) {
        logger.error('Erreur récupération slot_ids', { error: slotIdsError.message });
        errors.push('slot_ids');
      } else if (slotIds && slotIds.length > 0) {
        const slotIdList = slotIds.map(s => s.id);
        const { count, error } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .in('slot_id', slotIdList);
        totalReservations = count ?? 0;
        totalResError = error;
      }
    } else {
      const { count, error } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');
      totalReservations = count ?? 0;
      totalResError = error;
    }

    if (totalResError) {
      logger.error('Erreur comptage réservations totales', { error: totalResError.message });
      errors.push('réservations totales');
    }

    // 4 & 5. Réservations aujourd'hui et cette semaine (filtrées si externe)
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;
    let todayReservations = 0;
    let weekReservations = 0;

    if (hasFilter) {
      const { data: slotIds } = await supabase
        .from('slots')
        .select('id')
        .in('show_id', assignedShowIds);

      if (slotIds && slotIds.length > 0) {
        const slotIdList = slotIds.map(s => s.id);

        const { count: todayCount, error: todayResError } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .in('slot_id', slotIdList)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd);

        if (todayResError) {
          logger.error('Erreur comptage réservations aujourd\'hui', { error: todayResError.message });
          errors.push('réservations du jour');
        }
        todayReservations = todayCount ?? 0;

        const { count: weekCount, error: weekResError } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .in('slot_id', slotIdList)
          .gte('created_at', weekStart);

        if (weekResError) {
          logger.error('Erreur comptage réservations semaine', { error: weekResError.message });
          errors.push('réservations de la semaine');
        }
        weekReservations = weekCount ?? 0;
      }
    } else {
      const { count: todayCount, error: todayResError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      if (todayResError) {
        logger.error('Erreur comptage réservations aujourd\'hui', { error: todayResError.message });
        errors.push('réservations du jour');
      }
      todayReservations = todayCount ?? 0;

      const { count: weekCount, error: weekResError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('created_at', weekStart);

      if (weekResError) {
        logger.error('Erreur comptage réservations semaine', { error: weekResError.message });
        errors.push('réservations de la semaine');
      }
      weekReservations = weekCount ?? 0;
    }

    // 6. Taux de remplissage moyen (sur les créneaux à venir, filtrés si externe)
    let occupancyQuery = supabase
      .from('slots')
      .select('capacity, remaining_capacity')
      .gte('date', today)
      .neq('capacity', 999999); // Exclure capacité illimitée
    
    if (hasFilter) {
      occupancyQuery = occupancyQuery.in('show_id', assignedShowIds);
    }

    const { data: upcomingSlots, error: occupancyError } = await occupancyQuery;

    if (occupancyError) {
      logger.error('Erreur calcul taux remplissage', { error: occupancyError.message });
      errors.push('taux de remplissage');
    }

    let averageOccupancy = 0;
    if (!occupancyError && upcomingSlots && upcomingSlots.length > 0) {
      const totalOccupancy = upcomingSlots.reduce((sum, slot) => {
        return sum + calculateOccupancyRate(slot.capacity, slot.remaining_capacity);
      }, 0);
      averageOccupancy = Math.round(totalOccupancy / upcomingSlots.length);
    }

    return {
      data: {
        total_shows_active: showsCount ?? 0,
        total_slots_upcoming: slotsCount ?? 0,
        total_reservations: totalReservations,
        reservations_today: todayReservations,
        reservations_this_week: weekReservations,
        average_occupancy_rate: averageOccupancy,
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

/**
 * Récupère les prochains créneaux
 * @param limit - Nombre maximum de créneaux à retourner
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
async function getUpcomingSlots(
  limit: number = 10,
  options?: AdminDashboardOptions
): Promise<{ data: AdminUpcomingSlot[]; error: string | null }> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    const { assignedShowIds } = options || {};
    const hasFilter = assignedShowIds && assignedShowIds.length > 0;

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

/**
 * Récupère les réservations récentes
 * @param limit - Nombre maximum de réservations à retourner
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
async function getRecentReservations(
  limit: number = 10,
  options?: AdminDashboardOptions
): Promise<{ data: AdminRecentReservation[]; error: string | null }> {
  try {
    const supabase = createClient();
    const { assignedShowIds } = options || {};
    const hasFilter = assignedShowIds && assignedShowIds.length > 0;

    // Si externe, récupérer d'abord les slot_ids de leurs spectacles
    let slotIdFilter: string[] | null = null;
    if (hasFilter) {
      const { data: slots, error: slotsError } = await supabase
        .from('slots')
        .select('id')
        .in('show_id', assignedShowIds);

      if (slotsError) {
        logger.error('Erreur récupération slot_ids pour réservations', { error: slotsError.message });
        return { data: [], error: slotsError.message };
      }

      if (!slots || slots.length === 0) {
        return { data: [], error: null };
      }

      slotIdFilter = slots.map(s => s.id);
    }

    let query = supabase
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

    if (slotIdFilter) {
      query = query.in('slot_id', slotIdFilter);
    }

    const { data: reservations, error: resError } = await query;

    if (resError) {
      logger.error('Erreur récupération réservations récentes', { error: resError.message });
      return { data: [], error: resError.message };
    }

    if (!reservations || reservations.length === 0) {
      return { data: [], error: null };
    }

    const recentReservations: AdminRecentReservation[] = reservations.map(res => {
      // Utiliser le type guard pour valider le slot
      const slotData = res.slots;
      const slotIsValid = isValidSlot(slotData);
      
      // Extraire les données du show et venue avec validation
      const showData = slotIsValid ? slotData.shows : null;
      const venueData = slotIsValid ? slotData.venues : null;

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
          id: slotIsValid ? slotData.id : '',
          date: slotIsValid ? slotData.date : '',
          time: slotIsValid ? slotData.time : '',
          show: isValidShow(showData) 
            ? { id: showData.id, title: showData.title }
            : { id: '', title: 'Spectacle inconnu' },
          venue: isValidVenue(venueData)
            ? venueData
            : { id: '', name: 'Lieu inconnu', city: '' },
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
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getAdminDashboard(options?: AdminDashboardOptions): Promise<AdminDashboardResult> {
  try {
    const [statsResult, slotsResult, reservationsResult] = await Promise.all([
      getStats(options),
      getUpcomingSlots(10, options),
      getRecentReservations(10, options),
    ]);

    // Collecter toutes les erreurs
    const errors = [statsResult.error, slotsResult.error, reservationsResult.error]
      .filter(Boolean);

    return {
      data: {
        stats: statsResult.data,
        upcomingSlots: slotsResult.data,
        recentReservations: reservationsResult.data,
      },
      error: errors.length > 0 ? errors.join('; ') : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAdminDashboard', { message });
    return { data: null, error: message };
  }
}
