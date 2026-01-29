/**
 * Types et interfaces pour le service Admin Reservations
 * Derviche Diffusion
 * 
 * @module admin-reservations/types
 */

import type { ReservationStatus, CheckinStatus } from '@/types/database';

// ============================================
// TYPES ENTITÉS
// ============================================

/** Informations du slot enrichies pour l'admin */
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
  
  /** Flag indiquant une anomalie de données (champs requis null en BDD) */
  hasDataAnomaly: boolean;
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

// ============================================
// TYPES FILTRES ET PAGINATION
// ============================================

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
  sortBy?: AdminReservationSortBy;
}

/** Options de tri disponibles */
export type AdminReservationSortBy = 
  | 'slot_date_asc' 
  | 'slot_date_desc' 
  | 'created_at_asc' 
  | 'created_at_desc' 
  | 'name_asc' 
  | 'name_desc';

/** Options de pagination */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/** Filtres de date effectifs (calculés à partir de period ou dateFrom/dateTo) */
export interface EffectiveDateFilters {
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// TYPES RÉSULTATS
// ============================================

/** Résultat paginé de la liste des réservations */
export interface AdminReservationsResult {
  data: AdminReservation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

/** Résultat simple (une réservation ou erreur) */
export interface AdminReservationResult {
  data: AdminReservation | null;
  error: string | null;
}

/** Résultat liste sans pagination (export, par slot) */
export interface AdminReservationsListResult {
  data: AdminReservation[];
  error: string | null;
}

// ============================================
// TYPES MUTATIONS
// ============================================

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

/** Données pour créer une réservation depuis l'admin */
export interface CreateAdminReservationData {
  slotId: string;
  numPlaces: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emailSecondary?: string | null;
  phoneSecondary?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  organization?: string | null;
  function?: string | null;
  afcNumber?: string | null;
  // Notes
  comment?: string | null;
  checkinComment?: string | null;
  checkinVenueNotes?: string | null;
  checkinInternalNotes?: string | null;
}

/** Résultat de création de réservation admin */
export interface CreateAdminReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

// ============================================
// TYPES STATISTIQUES
// ============================================

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

/** Résultat des statistiques */
export interface ReservationStatsResult {
  data: ReservationStats | null;
  error: string | null;
}

// ============================================
// TYPES SLOTS
// ============================================

/** Slot disponible pour changement de créneau */
export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  venue: { 
    id: string; 
    name: string; 
    city: string; 
  } | null;
}

/** Résultat des slots disponibles */
export interface AvailableSlotsResult {
  data: AvailableSlot[];
  error: string | null;
}

// ============================================
// TYPES INTERNES (pour transformers)
// ============================================

/** Row Supabase brute avec relations (pour transformation) */
export interface ReservationRowWithRelations {
  id: string;
  slot_id: string;
  user_id: string | null;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_email_secondary: string | null;
  guest_phone_secondary: string | null;
  guest_address: string | null;
  guest_postal_code: string | null;
  guest_city: string | null;
  guest_structure: string | null;
  guest_function: string | null;
  guest_afc_number: string | null;
  num_places: number;
  status: string;
  special_requests: string | null;
  checkin_status: string | null;
  checkin_comment: string | null;
  checkin_venue_notes: string | null;
  checkin_internal_notes: string | null;
  checkin_at: string | null;
  checkin_by: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  slots?: SlotRowWithRelations | null;
}

/** Slot Supabase avec relations venues et shows */
export interface SlotRowWithRelations {
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
}

/** Row de statistiques (type interne pour forEach) */
export interface ReservationStatsRow {
  status: string;
  checkin_status: string | null;
  num_places: number;
}

/** Résultat RPC pour update_reservation_safe et create_admin_reservation */
export interface RpcResult {
  success: boolean;
  error?: string;
  reservation_id?: string;
}
