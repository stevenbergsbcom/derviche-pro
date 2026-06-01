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

/**
 * Discriminated union décrivant qui a créé une réservation.
 * Le `kind` permet au rendu UI de choisir le libellé approprié.
 */
export type BookedBy =
  | { kind: 'anonymous' }
  | { kind: 'pro'; firstName: string | null; lastName: string | null }
  | { kind: 'company'; id: string; name: string }
  | {
      kind: 'admin';
      firstName: string | null;
      lastName: string | null;
      /** `super-admin` | `admin` | `externe` — affiché tel quel entre parenthèses. */
      role: string;
    };

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
    /** Migration 117 — ID CRM Zoho du lieu, utilisé par les exports S175. */
    crmId: string | null;
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
  country: string | null;
  organization: string | null;
  function: string | null;
  afcNumber: string | null;
  /**
   * ID CRM Zoho (migration 119), résolu par le transformer :
   *  - résa guest (`userId === null`) → vient de `reservations.crm_id`, éditable
   *    depuis le dialog d'édition (CrmIdInput).
   *  - résa avec compte (`userId !== null`) → hérité de `profiles.crm_id` via
   *    la jointure `booked_by:user_id (crm_id)`. Affiché en lecture seule dans
   *    le dialog. Pour modifier, passer par la fiche du pro (source de vérité).
   *
   * Cette résolution dans le transformer évite à chaque consommateur (UI,
   * export S175…) de devoir distinguer les deux cas.
   */
  crmId: string | null;

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
  
  // Google Calendar
  googleCalendarEventId: string | null;

  // Emails post-checkin
  checkinFollowupEmails: { id: string; templateKey: string; sentAt: string; sentBy: string | null }[];

  /**
   * Traçabilité « qui a créé cette réservation ». Discriminated union
   * couvrant les 4 scénarios possibles :
   *  - anonymous : visiteur non connecté (user_id = NULL, created_by = NULL, source = public)
   *  - pro       : professionnel connecté à son compte (user_id set, source = public)
   *  - company   : compagnie connectée ayant saisi pour un pro (migration 113)
   *  - admin     : admin/super-admin/externe depuis le back-office ou la PWA walk-in
   * Alimenté par les jointures `created_by` + `booked_by` dans les SELECT queries.
   */
  bookedBy: BookedBy;

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
  /** Filtrer par lieu (venue_id) */
  venueId?: string;
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
  country?: string | null;
  organization?: string | null;
  function?: string | null;
  afcNumber?: string | null;
  /**
   * ID CRM Zoho (migration 119) — uniquement pertinent pour les résas guest.
   * `undefined` → laisse la valeur en BDD intacte.
   * `null` → vide explicitement le champ.
   */
  crmId?: string | null;
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
  country?: string | null;
  organization?: string | null;
  function?: string | null;
  afcNumber?: string | null;
  /** Migration 119 — ID CRM Zoho. Une résa admin est toujours guest (user_id NULL). */
  crmId?: string | null;
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
  guest_country: string | null;
  guest_structure: string | null;
  guest_function: string | null;
  guest_afc_number: string | null;
  /** Migration 119 — ID CRM Zoho (résas guest uniquement). */
  crm_id: string | null;
  num_places: number;
  status: string;
  /** Origine de la création : 'public' (site public) ou 'admin' (back-office / PWA walk-in). */
  source: string | null;
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
  google_calendar_event_id: string | null;
  checkin_followup_emails?: { id: string; template_key: string; sent_at: string; sent_by: string | null }[] | null;
  /**
   * Profil de la personne qui a CRÉÉ la résa — jointure via created_by_user_id.
   * Couvre :
   *  - compagnie (via `company_id` + `company` joint)   → migration 113
   *  - admin/super-admin/externe (via `user_roles.role`) → back-office / walk-in
   */
  created_by?: {
    first_name: string | null;
    last_name: string | null;
    company_id: string | null;
    company?: { id: string; name: string } | null;
    /** Relation 1:1 avec `user_roles` — Supabase peut renvoyer l'objet ou un array selon le typage. */
    user_roles?: { role: string } | { role: string }[] | null;
  } | null;
  /**
   * Profil du PROFESSIONNEL propriétaire de la résa — jointure via user_id.
   * Non-null uniquement si le pro était connecté à son compte au moment de
   * la résa (source='public', pas guest anonyme, pas compagnie).
   */
  booked_by?: {
    first_name: string | null;
    last_name: string | null;
    /** Migration 118 — ID CRM Zoho du compte pro (anticipation S175 : lecture seule sur résa avec compte). */
    crm_id: string | null;
  } | null;
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
  venues?: { id: string; name: string; city: string; crm_id: string | null } | null;
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
