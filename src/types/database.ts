/**
 * Types TypeScript pour la base de données Supabase
 * Derviche Diffusion - Plateforme de réservation professionnelle
 * 
 * Ces types correspondent exactement au schéma défini dans les migrations SQL.
 * Ils sont utilisés pour typer les requêtes Supabase et garantir la cohérence des données.
 */

// ============================================
// TYPES ENUM
// ============================================

/** Rôles utilisateurs disponibles dans l'application */
export type UserRole = 'super-admin' | 'admin' | 'professional' | 'company' | 'externe-dd';

/** Statut de publication d'un spectacle */
export type ShowStatus = 'draft' | 'published' | 'archived';

/** Type de tarification d'un spectacle */
export type ShowPriceType = 'free' | 'paid_on_site';

/** Qui assure l'accueil sur un créneau */
export type SlotHostedBy = 'derviche' | 'company';

/** Statut d'une réservation */
export type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show';

/** Statut de présence lors du check-in */
export type CheckinStatus = 'present_loved' | 'present_press' | 'present_neutral' | 'absent';

// ============================================
// TABLE : companies
// ============================================

/** Compagnie artistique (données complètes depuis la BDD) */
export interface CompanyRow {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer une nouvelle compagnie */
export interface CompanyInsert {
  name: string;
  contact_email: string;
  contact_phone?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
}

/** Données pour mettre à jour une compagnie */
export interface CompanyUpdate {
  name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
  deleted_at?: string | null;
}

// ============================================
// TABLE : profiles
// ============================================

/** Profil utilisateur (données complètes depuis la BDD) */
export interface ProfileRow {
  id: string; // Correspond à auth.users.id
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email2: string | null;
  phone2: string | null;
  function: string | null;
  structure: string | null;
  afc_number: string | null;
  address: string | null;
  comments: string | null;
  company_id: string | null;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  gdpr_data_retention_accepted: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer un nouveau profil */
export interface ProfileInsert {
  id: string; // Doit correspondre à l'id de auth.users
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email2?: string | null;
  phone2?: string | null;
  function?: string | null;
  structure?: string | null;
  afc_number?: string | null;
  address?: string | null;
  comments?: string | null;
  company_id?: string | null;
  gdpr_consent?: boolean;
  gdpr_consent_date?: string | null;
  gdpr_data_retention_accepted?: boolean;
}

/** Données pour mettre à jour un profil */
export interface ProfileUpdate {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email2?: string | null;
  phone2?: string | null;
  function?: string | null;
  structure?: string | null;
  afc_number?: string | null;
  address?: string | null;
  comments?: string | null;
  company_id?: string | null;
  gdpr_consent?: boolean;
  gdpr_consent_date?: string | null;
  gdpr_data_retention_accepted?: boolean;
  last_login_at?: string | null;
  deleted_at?: string | null;
}

// ============================================
// TABLE : user_roles
// ============================================

/** Rôle utilisateur (données complètes depuis la BDD) */
export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

/** Données pour attribuer un rôle à un utilisateur */
export interface UserRoleInsert {
  user_id: string;
  role: UserRole;
}

// ============================================
// TABLE : venues
// ============================================

/** Salle de spectacle (données complètes depuis la BDD) */
export interface VenueRow {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  photo_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer une nouvelle salle */
export interface VenueInsert {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  photo_url?: string | null;
}

/** Données pour mettre à jour une salle */
export interface VenueUpdate {
  name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  photo_url?: string | null;
  deleted_at?: string | null;
}

// ============================================
// TABLE : show_categories
// ============================================

/** Catégorie de spectacle (données complètes depuis la BDD) */
export interface ShowCategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer une nouvelle catégorie */
export interface ShowCategoryInsert {
  name: string;
  slug: string;
  icon?: string | null;
  display_order?: number;
  description?: string | null;
}

/** Données pour mettre à jour une catégorie */
export interface ShowCategoryUpdate {
  name?: string;
  slug?: string;
  icon?: string | null;
  display_order?: number;
  description?: string | null;
}

// ============================================
// TABLE : shows
// ============================================

/** Spectacle (données complètes depuis la BDD) */
export interface ShowRow {
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
  price_type: ShowPriceType;
  price_amount: number | null;
  max_reservations_per_booking: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer un nouveau spectacle */
export interface ShowInsert {
  slug: string;
  title: string;
  company_id: string;
  short_description?: string | null;
  long_description?: string | null;
  duration_minutes?: number | null;
  practical_info?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  status?: ShowStatus;
  price_type?: ShowPriceType;
  price_amount?: number | null;
  max_reservations_per_booking?: number;
}

/** Données pour mettre à jour un spectacle */
export interface ShowUpdate {
  slug?: string;
  title?: string;
  company_id?: string;
  short_description?: string | null;
  long_description?: string | null;
  duration_minutes?: number | null;
  practical_info?: string | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  status?: ShowStatus;
  price_type?: ShowPriceType;
  price_amount?: number | null;
  max_reservations_per_booking?: number;
  deleted_at?: string | null;
}

// ============================================
// TABLE : slots
// ============================================

/** Créneau de représentation (données complètes depuis la BDD) */
export interface SlotRow {
  id: string;
  show_id: string;
  venue_id: string;
  date: string; // Format YYYY-MM-DD
  time: string; // Format HH:MM:SS
  capacity: number;
  remaining_capacity: number;
  hosted_by: SlotHostedBy;
  created_at: string;
  updated_at: string;
}

/** Données pour créer un nouveau créneau */
export interface SlotInsert {
  show_id: string;
  venue_id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  hosted_by: SlotHostedBy;
}

/** Données pour mettre à jour un créneau */
export interface SlotUpdate {
  venue_id?: string;
  date?: string;
  time?: string;
  capacity?: number;
  remaining_capacity?: number;
  hosted_by?: SlotHostedBy;
}

// ============================================
// TABLE : reservations
// ============================================

/** Réservation (données complètes depuis la BDD) */
export interface ReservationRow {
  id: string;
  slot_id: string;
  user_id: string | null;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_function: string | null;
  guest_structure: string | null;
  guest_afc_number: string | null;
  num_places: number;
  status: ReservationStatus;
  special_requests: string | null;
  checkin_status: CheckinStatus | null;
  checkin_comment: string | null;
  checkin_venue_notes: string | null;
  checkin_internal_notes: string | null;
  checkin_at: string | null;
  checkin_by: string | null;
  google_calendar_event_id: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer une nouvelle réservation */
export interface ReservationInsert {
  slot_id: string;
  user_id?: string | null;
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  guest_function?: string | null;
  guest_structure?: string | null;
  guest_afc_number?: string | null;
  num_places: number;
  status?: ReservationStatus;
  special_requests?: string | null;
}

/** Données pour mettre à jour une réservation */
export interface ReservationUpdate {
  slot_id?: string;
  num_places?: number;
  status?: ReservationStatus;
  special_requests?: string | null;
  checkin_status?: CheckinStatus | null;
  checkin_comment?: string | null;
  checkin_venue_notes?: string | null;
  checkin_internal_notes?: string | null;
  checkin_at?: string | null;
  checkin_by?: string | null;
  google_calendar_event_id?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
}

// ============================================
// TABLE : user_show_assignments
// ============================================

/** Assignation d'un externe-DD à un spectacle */
export interface UserShowAssignmentRow {
  id: string;
  user_id: string;
  show_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

/** Données pour créer une assignation */
export interface UserShowAssignmentInsert {
  user_id: string;
  show_id: string;
  assigned_by?: string | null;
}

// ============================================
// TABLE : show_category_mapping
// ============================================

/** Association spectacle-catégorie */
export interface ShowCategoryMappingRow {
  show_id: string;
  category_id: string;
}

// ============================================
// TYPE DATABASE GLOBAL
// ============================================

/**
 * Type global regroupant toutes les tables de la base de données.
 * Utilisé pour typer le client Supabase.
 */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: CompanyRow;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: UserRoleInsert;
        Update: never; // On ne modifie pas un rôle, on le supprime et recrée
      };
      venues: {
        Row: VenueRow;
        Insert: VenueInsert;
        Update: VenueUpdate;
      };
      show_categories: {
        Row: ShowCategoryRow;
        Insert: ShowCategoryInsert;
        Update: ShowCategoryUpdate;
      };
      shows: {
        Row: ShowRow;
        Insert: ShowInsert;
        Update: ShowUpdate;
      };
      slots: {
        Row: SlotRow;
        Insert: SlotInsert;
        Update: SlotUpdate;
      };
      reservations: {
        Row: ReservationRow;
        Insert: ReservationInsert;
        Update: ReservationUpdate;
      };
      user_show_assignments: {
        Row: UserShowAssignmentRow;
        Insert: UserShowAssignmentInsert;
        Update: never;
      };
      show_category_mapping: {
        Row: ShowCategoryMappingRow;
        Insert: ShowCategoryMappingRow;
        Update: never;
      };
    };
  };
}
