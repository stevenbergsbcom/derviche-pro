/**
 * Fonctions de statistiques et requêtes par slot
 * 
 * @module admin-reservations/stats
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { getUserRole } from '@/lib/auth/get-user-role';
import type {
  ReservationStats,
  ReservationStatsResult,
  AdminReservationsListResult,
  AvailableSlotsResult,
  ReservationRowWithRelations,
  ReservationStatsRow,
} from './types';
import { 
  RESERVATION_SINGLE_SELECT_QUERY,
  RESERVATION_STATS_SELECT_QUERY,
  SLOT_SELECT_QUERY,
  ERROR_MESSAGES,
} from './constants';
import { transformReservations, transformAvailableSlots } from './transformers';
import { getTodayDate } from './filters';

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupère les statistiques des réservations
 * 
 * @param filters - Filtres optionnels (showId, slotId)
 * @returns Statistiques agrégées ou erreur
 * 
 * @example
 * ```ts
 * // Stats pour un spectacle
 * const result = await getReservationStats({ showId: '123' });
 * if (result.data) {
 *   console.log(`${result.data.confirmed} confirmées, ${result.data.presentLoved} coups de cœur`);
 * }
 * ```
 */
export async function getReservationStats(
  filters: { showId?: string; slotId?: string; venueId?: string } = {}
): Promise<ReservationStatsResult> {
  try {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('reservations')
      .select(RESERVATION_STATS_SELECT_QUERY);

    if (filters.slotId) {
      query = query.eq('slot_id', filters.slotId);
    }

    if (filters.showId) {
      query = query.eq('slots.show_id', filters.showId);
    }

    if (filters.venueId) {
      query = query.eq('slots.venue_id', filters.venueId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(ERROR_MESSAGES.FETCH_STATS, error);
      return { data: null, error: error.message };
    }

    const reservations = data || [];
    const stats: ReservationStats = {
      total: 0, // confirmées uniquement (hors annulées et no-show)
      confirmed: 0,
      cancelled: 0,
      noShow: 0,
      presentLoved: 0,
      presentPress: 0,
      presentNeutral: 0,
      absent: 0,
      totalPlaces: 0,
    };

    reservations.forEach((r: ReservationStatsRow) => {
      // Comptage par statut
      if (r.status === 'confirmed') stats.confirmed++;
      else if (r.status === 'cancelled') stats.cancelled++;
      else if (r.status === 'no_show') stats.noShow++;

      // Comptage par statut check-in
      if (r.checkin_status === 'present_loved') stats.presentLoved++;
      else if (r.checkin_status === 'present_press') stats.presentPress++;
      else if (r.checkin_status === 'present_neutral') stats.presentNeutral++;
      else if (r.checkin_status === 'absent') stats.absent++;

      // Places et total : uniquement les réservations confirmées (hors annulées)
      if (r.status === 'confirmed') {
        stats.total++;
        stats.totalPlaces += r.num_places;
      }
    });

    return { data: stats, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getReservationStats', { message });
    return { data: null, error: message };
  }
}

// ============================================
// LIEUX AVEC RÉSERVATIONS
// ============================================

/**
 * Récupère la liste des lieux ayant au moins une réservation
 * Utilisé pour le dropdown filtre lieu dans la page admin
 *
 * @returns Liste dédupliquée de { id, name } triée par nom
 */
export async function getVenuesWithReservations(): Promise<{
  data: { id: string; name: string }[];
  error: string | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select('slots!inner(venues!inner(id, name))')
      .neq('status', 'cancelled');

    if (error) {
      logger.error('Erreur getVenuesWithReservations', error);
      return { data: [], error: error.message };
    }

    // Dédupliquer les lieux
    const venueMap = new Map<string, string>();
    for (const row of (data || []) as { slots: { venues: { id: string; name: string } } }[]) {
      const venue = row.slots?.venues;
      if (venue && !venueMap.has(venue.id)) {
        venueMap.set(venue.id, venue.name);
      }
    }

    const venues = Array.from(venueMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    return { data: venues, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getVenuesWithReservations', { message });
    return { data: [], error: message };
  }
}

// ============================================
// RÉSERVATIONS PAR SLOT
// ============================================

/**
 * Récupère les réservations pour un créneau spécifique
 * 
 * @param slotId - UUID du slot
 * @returns Liste des réservations (hors annulées) triées par nom
 * 
 * @remarks
 * - Exclut les réservations annulées
 * - Triées par nom de famille croissant
 * - Utilisé pour la liste de présence / check-in
 * 
 * @example
 * ```ts
 * const result = await getReservationsBySlot('slot-uuid');
 * console.log(`${result.data.length} réservations pour ce créneau`);
 * ```
 */
export async function getReservationsBySlot(slotId: string): Promise<AdminReservationsListResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select(RESERVATION_SINGLE_SELECT_QUERY)
      .eq('slot_id', slotId)
      .neq('status', 'cancelled')
      .order('guest_last_name', { ascending: true });

    if (error) {
      logger.error(ERROR_MESSAGES.FETCH_BY_SLOT, { slotId, error: error.message });
      return { data: [], error: error.message };
    }

    const reservations = transformReservations(
      (data || []) as unknown as ReservationRowWithRelations[]
    );

    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getReservationsBySlot', { slotId, message });
    return { data: [], error: message };
  }
}

// ============================================
// SLOTS DISPONIBLES
// ============================================

/**
 * Options pour getAvailableSlotsForShow
 */
export interface GetAvailableSlotsOptions {
  /**
   * Filtre sur le type d'accueil.
   * - Omis ou undefined : tous les slots (admin/externe)
   * - 'company' : uniquement les slots hosted_by='company' (rôle company)
   */
  hostedBy?: 'derviche' | 'company' | 'externe';
  /**
   * Si `true`, inclut aussi les représentations dont la date est antérieure
   * à aujourd'hui. Réservé aux rôles `super-admin` et `admin` pour du
   * rattrapage a posteriori. Le service applique une garde côté serveur :
   * si `includePast=true` mais que l'utilisateur n'a pas le rôle requis,
   * l'option est silencieusement ignorée (comportement identique à
   * `includePast=false`).
   *
   * Le tri des résultats est adapté : quand `includePast=true`, les slots
   * sont triés date descendante (le plus récent d'abord) pour que le
   * rattrapage typique (résa oubliée sur la représentation d'hier) tombe
   * en tête de liste.
   */
  includePast?: boolean;
}

/**
 * Récupère tous les slots disponibles pour un spectacle
 * Utile pour le changement de créneau dans le formulaire de modification
 * et pour le drawer walk-in (rôle company).
 *
 * @param showId - UUID du spectacle
 * @param options - Options de filtrage optionnelles
 * @returns Liste des slots à venir avec capacité restante
 *
 * @remarks
 * - Filtre uniquement les dates futures (>= aujourd'hui)
 * - Triés par date puis heure croissante
 * - Inclut la capacité restante pour affichage
 * - Quand `hostedBy` est fourni, filtre les slots sur ce type d'accueil
 *
 * @example
 * ```ts
 * // Admin : tous les slots
 * const result = await getAvailableSlotsForShow('show-uuid');
 *
 * // Company : uniquement les slots qu'elle accueille
 * const result = await getAvailableSlotsForShow('show-uuid', { hostedBy: 'company' });
 * ```
 */
export async function getAvailableSlotsForShow(
  showId: string,
  options?: GetAvailableSlotsOptions,
): Promise<AvailableSlotsResult> {
  try {
    const supabase = createClient();
    const today = getTodayDate();

    // Défense en profondeur : `includePast` est réservé aux rôles admin.
    // Si un caller demande includePast sans avoir le rôle requis, on ignore
    // silencieusement l'option (comportement = includePast:false).
    // La restriction UI (checkbox visible uniquement pour ces rôles)
    // reste le premier rempart ; ce check bloque les appels directs.
    //
    // NB : on utilise le helper getUserRole qui gère le cas où user_roles
    // contient plusieurs lignes pour un même user (tri par priorité), plutôt
    // qu'un .maybeSingle() qui échouerait silencieusement dans ce cas.
    let effectiveIncludePast = options?.includePast === true;
    if (effectiveIncludePast) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        effectiveIncludePast = false;
      } else {
        const role = await getUserRole(user.id);
        if (role !== 'super-admin' && role !== 'admin') {
          logger.warn(
            '[getAvailableSlotsForShow] includePast demandé sans rôle admin — ignoré',
            { userId: user.id, role },
          );
          effectiveIncludePast = false;
        }
      }
    }

    let query = supabase
      .from('slots')
      .select(SLOT_SELECT_QUERY)
      .eq('show_id', showId);

    if (!effectiveIncludePast) {
      query = query.gte('date', today);
    }

    // Tri : futurs = date ascendante (le plus proche d'abord),
    //       inclus passés = date descendante (le plus récent d'abord —
    //       cas typique du rattrapage sur la représentation d'hier).
    query = query
      .order('date', { ascending: !effectiveIncludePast })
      .order('time', { ascending: !effectiveIncludePast });

    if (options?.hostedBy) {
      query = query.eq('hosted_by', options.hostedBy);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(ERROR_MESSAGES.FETCH_SLOTS, { showId, error: error.message });
      return { data: [], error: error.message };
    }

    const slots = transformAvailableSlots(
      (data || []) as Array<{
        id: string;
        date: string;
        time: string;
        capacity: number;
        remaining_capacity: number;
        hosted_by: string;
        venues: { id: string; name: string; city: string } | null;
      }>
    );

    return { data: slots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getAvailableSlotsForShow', { showId, message });
    return { data: [], error: message };
  }
}
