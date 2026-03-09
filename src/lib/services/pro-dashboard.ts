/**
 * Service Pro Dashboard
 * Derviche Diffusion
 *
 * Données pour le tableau de bord du professionnel connecté :
 * - Prochaine réservation confirmée (créneau le plus proche)
 * - 3 prochaines réservations confirmées
 * - 3 spectacles publiés non encore réservés (découverte)
 *
 * Toutes les requêtes sont protégées par RLS Supabase (user_id = auth.uid())
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Prochaine réservation mise en avant */
export interface ProNextReservation {
  reservation_id: string;
  show_id: string;
  show_title: string;
  show_slug: string | null;
  show_image_url: string | null;
  company_name: string | null;
  slot_id: string;
  slot_date: string;  // YYYY-MM-DD
  slot_time: string;  // HH:MM:SS
  venue_name: string | null;
  venue_city: string | null;
  num_places: number;
}

/** Réservation à venir (liste) */
export interface ProUpcomingReservation {
  reservation_id: string;
  show_title: string;
  show_slug: string | null;
  slot_date: string;
  slot_time: string;
  venue_name: string | null;
  venue_city: string | null;
  num_places: number;
}

/** Spectacle à découvrir (non encore réservé) */
export interface ProDiscoverShow {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  company_name: string | null;
  short_description: string | null;
  next_slot_date: string | null;
  next_slot_time: string | null;
  next_venue_name: string | null;
  next_venue_city: string | null;
}

/** Données complètes du dashboard pro */
export interface ProDashboardData {
  /** Prochain créneau réservé (null si aucun) */
  nextReservation: ProNextReservation | null;
  /** 3 prochaines réservations confirmées (inclut nextReservation) */
  upcomingReservations: ProUpcomingReservation[];
  /** Spectacles publiés non encore réservés (max 3) */
  discoverShows: ProDiscoverShow[];
}

export type ProDashboardResult =
  | { data: ProDashboardData; error: null }
  | { data: null; error: string };

// ============================================
// TYPES INTERNES (données brutes Supabase)
// ============================================

interface RawUpcomingReservation {
  id: string;
  num_places: number;
  slots: {
    id: string;
    date: string;
    time: string;
    venues: { name: string; city: string } | null;
    shows: {
      id: string;
      title: string;
      slug: string | null;
      image_url: string | null;
      companies: { name: string } | null;
    };
  };
}

interface RawDiscoverShow {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  short_description: string | null;
  companies: { name: string } | null;
  slots: Array<{
    date: string;
    time: string;
    venues: { name: string; city: string } | null;
  }>;
}

// ============================================
// HELPERS
// ============================================

/** Date locale au format YYYY-MM-DD (sans décalage UTC) */
function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère les prochaines réservations confirmées du pro connecté
 * RLS garantit que seules ses réservations sont retournées
 */
async function fetchUpcomingReservations(
  supabase: ReturnType<typeof createClient>,
  limit: number
): Promise<RawUpcomingReservation[]> {
  const today = todayLocalISO();

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      num_places,
      slots!inner (
        id,
        date,
        time,
        venues ( name, city ),
        shows!inner ( id, title, slug, image_url, companies:company_id ( name ) )
      )
    `)
    .eq('status', 'confirmed')
    .gte('slots.date', today)
    .order('slots(date)', { ascending: true })
    .order('slots(time)', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('Erreur fetchUpcomingReservations pro', { error: error.message });
    return [];
  }

  return (data ?? []) as unknown as RawUpcomingReservation[];
}

/**
 * Récupère les IDs de spectacles déjà réservés par le pro
 * Pour filtrer la section "Découvrir"
 */
async function fetchAlreadyBookedShowIds(
  supabase: ReturnType<typeof createClient>
): Promise<string[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('slots!inner ( shows!inner ( id ) )')
    .neq('status', 'cancelled');

  if (error) {
    logger.error('Erreur fetchAlreadyBookedShowIds', { error: error.message });
    return [];
  }

  // Extraire les show_ids uniques
  const showIds = new Set<string>();
  for (const r of (data ?? []) as unknown as Array<{ slots: { shows: { id: string } } }>) {
    showIds.add(r.slots.shows.id);
  }

  return Array.from(showIds);
}

/**
 * Récupère des spectacles publiés non encore réservés par le pro
 */
async function fetchDiscoverShows(
  supabase: ReturnType<typeof createClient>,
  excludeShowIds: string[]
): Promise<ProDiscoverShow[]> {
  const today = todayLocalISO();

  let query = supabase
    .from('shows')
    .select(`
      id,
      slug,
      title,
      image_url,
      short_description,
      companies:company_id ( name ),
      slots ( date, time, venues ( name, city ) )
    `)
    .eq('status', 'published')
    .is('deleted_at', null)
    .limit(3);

  // Exclure les spectacles déjà réservés
  if (excludeShowIds.length > 0) {
    query = query.not('id', 'in', `(${excludeShowIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Erreur fetchDiscoverShows', { error: error.message });
    return [];
  }

  return ((data ?? []) as unknown as RawDiscoverShow[]).map((show) => {
    // Trouver le prochain créneau futur
    const futureSlots = (show.slots ?? [])
      .filter((s) => s.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

    const next = futureSlots[0] ?? null;

    return {
      id: show.id,
      slug: show.slug,
      title: show.title,
      image_url: show.image_url,
      company_name: show.companies?.name ?? null,
      short_description: show.short_description,
      next_slot_date: next?.date ?? null,
      next_slot_time: next?.time ?? null,
      next_venue_name: next?.venues?.name ?? null,
      next_venue_city: next?.venues?.city ?? null,
    };
  });
}

// ============================================
// EXPORT PRINCIPAL
// ============================================

/**
 * Charge toutes les données du dashboard professionnel en parallèle.
 * Requiert un utilisateur connecté (RLS Supabase protège les données).
 */
export async function getProDashboard(): Promise<ProDashboardResult> {
  try {
    const supabase = createClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    // Requêtes en parallèle
    const [rawReservations, bookedShowIds] = await Promise.all([
      fetchUpcomingReservations(supabase, 3),
      fetchAlreadyBookedShowIds(supabase),
    ]);

    // Spectacles à découvrir (excluant ceux déjà réservés)
    const discoverShows = await fetchDiscoverShows(supabase, bookedShowIds);

    // Transformer les réservations
    const upcomingReservations: ProUpcomingReservation[] = rawReservations.map((r) => ({
      reservation_id: r.id,
      show_title: r.slots.shows.title,
      show_slug: r.slots.shows.slug,
      slot_date: r.slots.date,
      slot_time: r.slots.time,
      venue_name: r.slots.venues?.name ?? null,
      venue_city: r.slots.venues?.city ?? null,
      num_places: r.num_places,
    }));

    // Prochain spectacle = premier de la liste
    const first = rawReservations[0] ?? null;
    const nextReservation: ProNextReservation | null = first
      ? {
          reservation_id: first.id,
          show_id: first.slots.shows.id,
          show_title: first.slots.shows.title,
          show_slug: first.slots.shows.slug,
          show_image_url: first.slots.shows.image_url,
          company_name: first.slots.shows.companies?.name ?? null,
          slot_id: first.slots.id,
          slot_date: first.slots.date,
          slot_time: first.slots.time,
          venue_name: first.slots.venues?.name ?? null,
          venue_city: first.slots.venues?.city ?? null,
          num_places: first.num_places,
        }
      : null;

    return {
      data: {
        nextReservation,
        upcomingReservations,
        discoverShows,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getProDashboard', { message });
    return { data: null, error: message };
  }
}
