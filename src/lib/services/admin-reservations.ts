/**
 * Service Admin Reservations - Gestion des réservations côté admin
 * Derviche Diffusion
 * 
 * Fonctionnalités :
 * - Liste paginée avec filtres
 * - Détail complet avec relations
 * - Check-in (mise à jour du statut)
 * - Modification complète (via RPC sécurisée)
 * - Annulation
 * - Export CSV
 * - Statistiques
 */

import { createClient } from '@/lib/supabase/client';
import type { 
  ReservationRow, 
  ReservationStatus, 
  CheckinStatus 
} from '@/types/database';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Informations du slot enrichies */
export interface AdminReservationSlot {
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
    company: {
      id: string;
      name: string;
    } | null;
  } | null;
}

/** Réservation complète pour l'admin */
export interface AdminReservation {
  id: string;
  slotId: string;
  userId: string | null;
  
  // Données guest ou user
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
  
  // Check-in
  checkinStatus: CheckinStatus | null;
  checkinComment: string | null;
  checkinVenueNotes: string | null;
  checkinInternalNotes: string | null;
  checkinAt: string | null;
  checkinBy: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  
  // Relations
  slot: AdminReservationSlot | null;
}

/** Filtres pour la liste des réservations */
export interface AdminReservationFilters {
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
export interface AdminReservationsResult {
  data: AdminReservation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

/** Résultat simple */
export interface AdminReservationResult {
  data: AdminReservation | null;
  error: string | null;
}

/** Données pour mise à jour check-in */
export interface CheckinUpdateData {
  checkinStatus: CheckinStatus;
  checkinComment?: string;
  checkinVenueNotes?: string;
  checkinInternalNotes?: string;
}

/** Données pour modification complète d'une réservation */
export interface UpdateReservationData {
  // Données guest
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  emailSecondary?: string | null;
  phoneSecondary?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  organization?: string | null;
  function?: string | null;
  afcNumber?: string | null;
  // Réservation
  numPlaces?: number;
  slotId?: string;
  specialRequests?: string | null;
  // Notes
  checkinComment?: string | null;
  checkinVenueNotes?: string | null;
  checkinInternalNotes?: string | null;
}

/** Statistiques des réservations */
export interface ReservationStats {
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

// ============================================
// HELPERS
// ============================================

/**
 * Transforme une row Supabase en AdminReservation
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
      shows?: { 
        id: string; 
        title: string; 
        slug: string;
        companies?: { id: string; name: string } | null;
      } | null;
    } | null;
  }
): AdminReservation {
  const slot = row.slots;
  
  return {
    id: row.id,
    slotId: row.slot_id,
    userId: row.user_id,
    
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
    
    // Check-in
    checkinStatus: row.checkin_status as CheckinStatus | null,
    checkinComment: row.checkin_comment,
    checkinVenueNotes: row.checkin_venue_notes,
    checkinInternalNotes: row.checkin_internal_notes,
    checkinAt: row.checkin_at,
    checkinBy: row.checkin_by,
    
    // Timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    
    // Relations
    slot: slot ? {
      id: slot.id,
      date: slot.date,
      time: slot.time.slice(0, 5), // HH:MM:SS → HH:MM
      capacity: slot.capacity,
      remainingCapacity: slot.remaining_capacity,
      hostedBy: slot.hosted_by,
      venue: slot.venues || null,
      show: slot.shows ? {
        id: slot.shows.id,
        title: slot.shows.title,
        slug: slot.shows.slug,
        company: slot.shows.companies || null,
      } : null,
    } : null,
  };
}

// ============================================
// HELPERS DATE
// ============================================

/**
 * Retourne la date du jour au format YYYY-MM-DD
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcule les filtres de date effectifs en fonction de period et dateFrom/dateTo
 * Les dates personnalisées (dateFrom/dateTo) écrasent le filtre period
 */
function getEffectiveDateFilters(filters: AdminReservationFilters): {
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
      return { dateTo: today }; // Inclut aujourd'hui dans "passées" pour voir les représentations du jour
    case 'all':
    default:
      return {};
  }
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère la liste des réservations avec filtres et pagination
 */
export async function getAdminReservations(
  filters: AdminReservationFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<AdminReservationsResult> {
  try {
    const supabase = createClient();
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // Calculer les filtres de date effectifs
    const effectiveDates = getEffectiveDateFilters(filters);

    // Construction de la requête de base
    let query = supabase
      .from('reservations')
      .select(`
        *,
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
            slug,
            companies (
              id,
              name
            )
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
      const searchTerm = filters.search.replace(/'/g, "''"); // Escape single quotes
      query = query.or(`guest_email.ilike.%${searchTerm}%,guest_first_name.ilike.%${searchTerm}%,guest_last_name.ilike.%${searchTerm}%`);
    }

    // Tri (défaut: date représentation croissante)
    const sortBy = filters.sortBy || 'slot_date_asc';
    switch (sortBy) {
      case 'slot_date_asc':
        query = query
          .order('date', { referencedTable: 'slots', ascending: true })
          .order('time', { referencedTable: 'slots', ascending: true });
        break;
      case 'slot_date_desc':
        query = query
          .order('date', { referencedTable: 'slots', ascending: false })
          .order('time', { referencedTable: 'slots', ascending: false });
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
      logger.error('Erreur récupération admin reservations', error);
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
    logger.error('Exception getAdminReservations', { message });
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
export async function getAllReservationsForExport(
  filters: AdminReservationFilters = {}
): Promise<{ data: AdminReservation[]; error: string | null }> {
  try {
    const supabase = createClient();

    // Calculer les filtres de date effectifs
    const effectiveDates = getEffectiveDateFilters(filters);

    // Construction de la requête de base
    let query = supabase
      .from('reservations')
      .select(`
        *,
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
            slug,
            companies (
              id,
              name
            )
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
      const searchTerm = filters.search.replace(/'/g, "''"); // Escape single quotes
      query = query.or(`guest_email.ilike.%${searchTerm}%,guest_first_name.ilike.%${searchTerm}%,guest_last_name.ilike.%${searchTerm}%`);
    }

    // Tri par date de représentation puis nom
    query = query
      .order('date', { referencedTable: 'slots', ascending: true })
      .order('guest_last_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('Erreur récupération reservations pour export', error);
      return { data: [], error: error.message };
    }

    const reservations = (data || []).map(row => 
      transformReservation(row as Parameters<typeof transformReservation>[0])
    );

    logger.info(`Export: ${reservations.length} réservations récupérées`);
    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAllReservationsForExport', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère une réservation par son ID avec toutes les relations
 */
export async function getAdminReservationById(id: string): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        slots (
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
          shows (
            id,
            title,
            slug,
            companies (
              id,
              name
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Erreur récupération reservation', { id, error: error.message });
      return { data: null, error: error.message };
    }

    const reservation = transformReservation(data as Parameters<typeof transformReservation>[0]);
    return { data: reservation, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAdminReservationById', { id, message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour le statut check-in d'une réservation
 */
export async function updateReservationCheckin(
  id: string,
  checkinData: CheckinUpdateData
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        checkin_status: checkinData.checkinStatus,
        checkin_comment: checkinData.checkinComment || null,
        checkin_venue_notes: checkinData.checkinVenueNotes || null,
        checkin_internal_notes: checkinData.checkinInternalNotes || null,
        checkin_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Erreur mise à jour checkin', { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    const result = await getAdminReservationById(id);
    if (result.data) {
      logger.info(`Checkin mis à jour: ${id} → ${checkinData.checkinStatus}`);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateReservationCheckin', { id, message });
    return { data: null, error: message };
  }
}

/**
 * Modifie une réservation complètement (via RPC sécurisée)
 * Gère automatiquement les changements de capacité
 */
export async function updateReservation(
  id: string,
  data: UpdateReservationData
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    // Appel à la fonction RPC sécurisée
    // Note: Cast nécessaire car les types Supabase auto-générés ne contiennent pas cette RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: rpcError } = await (supabase.rpc as any)('update_reservation_safe', {
        p_reservation_id: id,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_email: data.email,
        p_phone: data.phone,
        p_email_secondary: data.emailSecondary,
        p_phone_secondary: data.phoneSecondary,
        p_address: data.address,
        p_postal_code: data.postalCode,
        p_city: data.city,
        p_organization: data.organization,
        p_function: data.function,
        p_afc_number: data.afcNumber,
        p_num_places: data.numPlaces,
        p_slot_id: data.slotId,
        p_special_requests: data.specialRequests,
        p_checkin_comment: data.checkinComment,
        p_checkin_venue_notes: data.checkinVenueNotes,
        p_checkin_internal_notes: data.checkinInternalNotes,
      });

    if (rpcError) {
      logger.error('Erreur RPC update_reservation_safe', { id, error: rpcError.message });
      return { data: null, error: rpcError.message };
    }

    // Vérifier le résultat de la RPC
    const rpcResult = result as { success: boolean; error?: string; reservation_id?: string };
    if (!rpcResult.success) {
      logger.error('RPC update_reservation_safe échec', { id, error: rpcResult.error });
      return { data: null, error: rpcResult.error || 'Erreur de mise à jour' };
    }

    // Récupérer la réservation mise à jour
    const updatedResult = await getAdminReservationById(id);
    if (updatedResult.data) {
      logger.info(`Réservation modifiée: ${id}`);
    }

    return updatedResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateReservation', { id, message });
    return { data: null, error: message };
  }
}

/**
 * Annule une réservation
 */
export async function cancelReservation(
  id: string,
  reason?: string
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Erreur annulation reservation', { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    const result = await getAdminReservationById(id);
    if (result.data) {
      logger.info(`Réservation annulée: ${id}`);
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception cancelReservation', { id, message });
    return { data: null, error: message };
  }
}

/**
 * Récupère les statistiques des réservations
 */
export async function getReservationStats(
  filters: { showId?: string; slotId?: string } = {}
): Promise<{ data: ReservationStats | null; error: string | null }> {
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
      logger.error('Erreur récupération stats reservations', error);
      return { data: null, error: error.message };
    }

    const reservations = data || [];
    const stats: ReservationStats = {
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
    logger.error('Exception getReservationStats', { message });
    return { data: null, error: message };
  }
}

/**
 * Récupère les réservations pour un créneau spécifique
 */
export async function getReservationsBySlot(slotId: string): Promise<{
  data: AdminReservation[];
  error: string | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        slots (
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
          shows (
            id,
            title,
            slug,
            companies (
              id,
              name
            )
          )
        )
      `)
      .eq('slot_id', slotId)
      .neq('status', 'cancelled')
      .order('guest_last_name', { ascending: true });

    if (error) {
      logger.error('Erreur récupération reservations par slot', { slotId, error: error.message });
      return { data: [], error: error.message };
    }

    const reservations = (data || []).map(row => 
      transformReservation(row as Parameters<typeof transformReservation>[0])
    );

    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getReservationsBySlot', { slotId, message });
    return { data: [], error: message };
  }
}

/**
 * Récupère tous les slots disponibles pour un spectacle
 * Utile pour le changement de créneau dans le formulaire de modification
 */
export async function getAvailableSlotsForShow(showId: string): Promise<{
  data: Array<{
    id: string;
    date: string;
    time: string;
    capacity: number;
    remainingCapacity: number;
    venue: { id: string; name: string; city: string } | null;
  }>;
  error: string | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        capacity,
        remaining_capacity,
        venues (
          id,
          name,
          city
        )
      `)
      .eq('show_id', showId)
      .gte('date', new Date().toISOString().split('T')[0]) // Seulement les dates futures
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('Erreur récupération slots disponibles', { showId, error: error.message });
      return { data: [], error: error.message };
    }

    const slots = (data || []).map(s => ({
      id: s.id,
      date: s.date,
      time: s.time.slice(0, 5),
      capacity: s.capacity,
      remainingCapacity: s.remaining_capacity,
      venue: s.venues as { id: string; name: string; city: string } | null,
    }));

    return { data: slots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAvailableSlotsForShow', { showId, message });
    return { data: [], error: message };
  }
}
