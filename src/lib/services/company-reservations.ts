/**
 * Service Company Reservations - Gestion des réservations côté compagnie
 * Derviche Diffusion
 * 
 * Fonctionnalités (lecture seule) :
 * - Liste paginée avec filtres (spectacles de la compagnie uniquement)
 * - Export CSV/Excel (colonnes restreintes - sans notes internes)
 * - Statistiques
 * 
 * Sécurité : RLS policies filtrent automatiquement par company_id
 */

import { createClient } from '@/lib/supabase/client';
import type { ReservationRow, ReservationStatus, CheckinStatus } from '@/types/database';
import { logger } from '@/lib/logger';
import { buildSearchOrClause } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

/** Informations du slot enrichies */
export interface CompanyReservationSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  hostedBy: string;
  venue: {
    id: string;
    name: string;
    city: string;
  } | null;
  show: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

/** Réservation pour la compagnie (sans notes internes) */
export interface CompanyReservation {
  id: string;
  slotId: string;
  
  // Données guest
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  emailSecondary: string | null;
  phoneSecondary: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  organization: string | null;
  function: string | null;
  afcNumber: string | null;
  
  // Réservation
  numPlaces: number;
  status: ReservationStatus;
  specialRequests: string | null;
  
  // Check-in (sans notes internes - checkinInternalNotes exclu)
  checkinStatus: CheckinStatus | null;
  checkinAt: string | null;
  checkinNotes: string | null;
  checkinVenueNotes: string | null;
  
  // Timestamps
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  
  // Relations
  slot: CompanyReservationSlot | null;
}

/** Filtres pour la liste des réservations */
export interface CompanyReservationFilters {
  /** Filtrer par spectacle (show_id) */
  showId?: string;
  /** Filtrer par slot (slot_id) */
  slotId?: string;
  /** Filtrer par statut */
  status?: ReservationStatus;
  /** Filtrer par statut check-in */
  checkinStatus?: CheckinStatus;
  /** Période rapide (à venir / passées / toutes) */
  period?: 'upcoming' | 'past' | 'all';
  /** Filtrer par date de représentation (YYYY-MM-DD) */
  dateFrom?: string;
  /** Filtrer par date de représentation (YYYY-MM-DD) */
  dateTo?: string;
  /** Recherche textuelle (nom, email) */
  search?: string;
  /** Tri des résultats */
  sortBy?: 'slot_date_asc' | 'slot_date_desc' | 'created_at_asc' | 'created_at_desc' | 'name_asc' | 'name_desc';
}

/** Options de pagination */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/** Résultat paginé */
export interface CompanyReservationsResult {
  data: CompanyReservation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

/** Statistiques des réservations */
export interface CompanyReservationStats {
  total: number;
  confirmed: number;
  cancelled: number;
  noShow: number;
  presentLoved: number;
  presentPress: number;
  presentNeutral: number;
  absent: number;
  totalPlaces: number;
}

/** Colonnes disponibles pour l'export compagnie (sans notes internes) */
export type CompanyExportColumn =
  | 'date'
  | 'spectacle'
  | 'venue'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'emailSecondary'
  | 'phoneSecondary'
  | 'organization'
  | 'function'
  | 'afcNumber'
  | 'address'
  | 'numPlaces'
  | 'status'
  | 'checkinStatus'
  | 'specialRequests'
  | 'checkinNotes'
  | 'checkinVenueNotes'
  | 'createdAt';

// ============================================
// HELPERS
// ============================================

/**
 * Transforme une row Supabase en CompanyReservation
 */
function transformReservation(
  row: ReservationRow & {
    slots?: {
      id: string;
      date: string;
      time: string;
      capacity: number;
      remaining_capacity: number;
      hosted_by: string;
      venues?: { id: string; name: string; city: string } | null;
      shows?: { id: string; title: string; slug: string } | null;
    } | null;
  }
): CompanyReservation {
  const slot = row.slots;
  
  return {
    id: row.id,
    slotId: row.slot_id,
    
    // Données guest
    firstName: row.guest_first_name || '',
    lastName: row.guest_last_name || '',
    email: row.guest_email || '',
    phone: row.guest_phone,
    emailSecondary: row.guest_email_secondary || null,
    phoneSecondary: row.guest_phone_secondary || null,
    address: row.guest_address || null,
    postalCode: row.guest_postal_code || null,
    city: row.guest_city || null,
    organization: row.guest_structure,
    function: row.guest_function,
    afcNumber: row.guest_afc_number || null,
    
    // Réservation
    numPlaces: row.num_places,
    status: row.status as ReservationStatus,
    specialRequests: row.special_requests,
    
    // Check-in (sans notes internes - checkinInternalNotes exclu)
    checkinStatus: row.checkin_status as CheckinStatus | null,
    checkinAt: row.checkin_at,
    checkinNotes: row.checkin_comment || null,
    checkinVenueNotes: row.checkin_venue_notes || null,
    
    // Timestamps
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason || null,
    
    // Relations
    slot: slot ? {
      id: slot.id,
      date: slot.date,
      time: slot.time.slice(0, 5), // HH:MM:SS → HH:MM
      capacity: slot.capacity,
      remainingCapacity: slot.remaining_capacity,
      hostedBy: slot.hosted_by,
      venue: slot.venues || null,
      show: slot.shows || null,
    } : null,
  };
}

/**
 * Retourne la date du jour au format YYYY-MM-DD
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcule les filtres de date effectifs en fonction de period et dateFrom/dateTo
 */
function getEffectiveDateFilters(filters: CompanyReservationFilters): {
  dateFrom?: string;
  dateTo?: string;
} {
  // Si des dates personnalisées sont définies, elles prennent le dessus
  if (filters.dateFrom || filters.dateTo) {
    return {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }

  // Sinon, appliquer le filtre period
  const today = getTodayDate();
  
  switch (filters.period) {
    case 'upcoming':
      return { dateFrom: today };
    case 'past':
      return { dateTo: today };
    case 'all':
    default:
      return {};
  }
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère la liste des réservations pour la compagnie connectée
 * Les RLS policies filtrent automatiquement par company_id
 */
export async function getCompanyReservations(
  filters: CompanyReservationFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<CompanyReservationsResult> {
  try {
    const supabase = createClient();
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // Calculer les filtres de date effectifs
    const effectiveDates = getEffectiveDateFilters(filters);

    // Construction de la requête de base
    // Note: Les RLS policies filtrent automatiquement par company_id
    let query = supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_email_secondary,
        guest_phone_secondary,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_structure,
        guest_function,
        guest_afc_number,
        num_places,
        status,
        special_requests,
        checkin_status,
        checkin_at,
        checkin_comment,
        checkin_venue_notes,
        created_at,
        cancelled_at,
        cancellation_reason,
        slots!inner (
          id,
          date,
          time,
          capacity,
          remaining_capacity,
          hosted_by,
          venues (
            id,
            name,
            city
          ),
          shows!inner (
            id,
            title,
            slug
          )
        )
      `, { count: 'exact' });

    // Appliquer les filtres
    if (filters.showId) {
      query = query.eq('slots.show_id', filters.showId);
    }

    if (filters.slotId) {
      query = query.eq('slot_id', filters.slotId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.checkinStatus) {
      query = query.eq('checkin_status', filters.checkinStatus);
    }

    // Appliquer les filtres de date effectifs
    if (effectiveDates.dateFrom) {
      query = query.gte('slots.date', effectiveDates.dateFrom);
    }

    if (effectiveDates.dateTo) {
      query = query.lte('slots.date', effectiveDates.dateTo);
    }

    if (filters.search) {
      const searchClause = buildSearchOrClause(
        filters.search,
        ['guest_email', 'guest_first_name', 'guest_last_name']
      );
      if (searchClause) {
        query = query.or(searchClause);
      }
    }

    // Tri (défaut: date représentation croissante)
    // Note: on utilise slot_date/slot_time (colonnes dénormalisées sur reservations, migration 080)
    // car .order({ referencedTable: 'slots' }) ne trie PAS la table parente en Supabase JS
    const sortBy = filters.sortBy || 'slot_date_asc';
    switch (sortBy) {
      case 'slot_date_asc':
        query = query
          .order('slot_date', { ascending: true })
          .order('slot_time', { ascending: true });
        break;
      case 'slot_date_desc':
        query = query
          .order('slot_date', { ascending: false })
          .order('slot_time', { ascending: false });
        break;
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'created_at_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name_asc':
        query = query
          .order('guest_last_name', { ascending: true })
          .order('guest_first_name', { ascending: true });
        break;
      case 'name_desc':
        query = query
          .order('guest_last_name', { ascending: false })
          .order('guest_first_name', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('[company-reservations] Erreur récupération', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        error: error.message,
      };
    }

    const reservations = (data || []).map(row => 
      transformReservation(row as Parameters<typeof transformReservation>[0])
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    logger.info(`[company-reservations] ${reservations.length} réservations chargées (page ${page}/${totalPages})`);

    return {
      data: reservations,
      total,
      page,
      pageSize,
      totalPages,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getCompanyReservations', { message });
    return {
      data: [],
      total: 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: 0,
      error: message,
    };
  }
}

/**
 * Récupère TOUTES les réservations pour export (sans pagination)
 * Applique les mêmes filtres que la liste paginée
 */
export async function getAllCompanyReservationsForExport(
  filters: CompanyReservationFilters = {}
): Promise<{ data: CompanyReservation[]; error: string | null }> {
  try {
    const supabase = createClient();

    // Calculer les filtres de date effectifs
    const effectiveDates = getEffectiveDateFilters(filters);

    // Construction de la requête de base
    let query = supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_email_secondary,
        guest_phone_secondary,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_structure,
        guest_function,
        guest_afc_number,
        num_places,
        status,
        special_requests,
        checkin_status,
        checkin_at,
        checkin_comment,
        checkin_venue_notes,
        created_at,
        cancelled_at,
        cancellation_reason,
        slots!inner (
          id,
          date,
          time,
          capacity,
          remaining_capacity,
          hosted_by,
          venues (
            id,
            name,
            city
          ),
          shows!inner (
            id,
            title,
            slug
          )
        )
      `);

    // Appliquer les mêmes filtres
    if (filters.showId) {
      query = query.eq('slots.show_id', filters.showId);
    }

    if (filters.slotId) {
      query = query.eq('slot_id', filters.slotId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.checkinStatus) {
      query = query.eq('checkin_status', filters.checkinStatus);
    }

    // Appliquer les filtres de date effectifs
    if (effectiveDates.dateFrom) {
      query = query.gte('slots.date', effectiveDates.dateFrom);
    }

    if (effectiveDates.dateTo) {
      query = query.lte('slots.date', effectiveDates.dateTo);
    }

    if (filters.search) {
      const searchClause = buildSearchOrClause(
        filters.search,
        ['guest_email', 'guest_first_name', 'guest_last_name']
      );
      if (searchClause) {
        query = query.or(searchClause);
      }
    }

    // Tri par date de représentation puis nom
    // Note: slot_date col dénormalisée (migration 080) — .order({ referencedTable }) ne trie pas la table parente
    query = query
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })
      .order('guest_last_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('[company-reservations] Erreur récupération pour export', error);
      return { data: [], error: error.message };
    }

    const reservations = (data || []).map(row => 
      transformReservation(row as Parameters<typeof transformReservation>[0])
    );

    logger.info(`[company-reservations] Export: ${reservations.length} réservations récupérées`);
    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getAllCompanyReservationsForExport', { message });
    return { data: [], error: message };
  }
}

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

/**
 * Récupère les spectacles de la compagnie connectée (pour le filtre)
 * Filtre explicitement par company_id de l'utilisateur connecté
 */
export async function getCompanyShows(): Promise<{
  data: Array<{ id: string; title: string; slug: string }>;
  error: string | null;
}> {
  try {
    const supabase = createClient();

    // 1. Récupérer l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.error('[company-reservations] Utilisateur non connecté', { error: authError?.message });
      return { data: [], error: 'Utilisateur non connecté' };
    }

    // 2. Récupérer le company_id depuis le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      logger.error('[company-reservations] Profil ou company_id non trouvé', { error: profileError?.message });
      return { data: [], error: 'Compagnie non associée au profil' };
    }

    // 3. Récupérer les spectacles de cette compagnie uniquement
    const { data, error } = await supabase
      .from('shows')
      .select('id, title, slug')
      .eq('company_id', profile.company_id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('title', { ascending: true });

    if (error) {
      logger.error('[company-reservations] Erreur récupération spectacles', error);
      return { data: [], error: error.message };
    }

    logger.info(`[company-reservations] ${(data || []).length} spectacle(s) chargé(s) pour compagnie ${profile.company_id}`);
    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getCompanyShows', { message });
    return { data: [], error: message };
  }
}
