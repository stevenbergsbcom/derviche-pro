/**
 * Types TypeScript pour la base de données Supabase
 * Derviche Diffusion - Plateforme de réservation professionnelle
 * 
 * Ces types correspondent exactement au schéma défini dans les migrations SQL.
 * Ils sont utilisés pour typer les requêtes Supabase et garantir la cohérence des données.
 * 
 * Mis à jour : Session S150 — ajout app_logs
 * Migrations : 001-072
 */

// ============================================
// TYPES ENUM
// ============================================

/** Rôles utilisateurs disponibles dans l'application */
export type UserRole = 'super-admin' | 'admin' | 'professional' | 'company' | 'externe';

/** Rôles internes (staff qui peut accueillir les spectacles) */
export type InternalRole = 'super-admin' | 'admin' | 'externe';

/** Statut de publication d'un spectacle */
export type ShowStatus = 'draft' | 'published' | 'archived';

/** Type de tarification d'un spectacle */
export type ShowPriceType = 'free' | 'paid_on_site';

/** Qui assure l'accueil sur un créneau */
export type SlotHostedBy = 'derviche' | 'company' | 'externe';

/** Statut d'une réservation */
export type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show';

/** Statut de présence lors du check-in */
export type CheckinStatus = 'present_loved' | 'present_press' | 'present_neutral' | 'absent';

/** Source de création d'une réservation */
export type ReservationSource = 'public' | 'admin';

// ============================================
// TABLE : app_logs (S150 — journal système)
// ============================================

export type AppLogCategory = 'email' | 'calendar' | 'reservation' | 'system';
export type AppLogLevel    = 'info' | 'warning' | 'error';
export type AppLogStatus   = 'success' | 'error';

export interface AppLogRow {
  id:              string;
  category:        AppLogCategory;
  level:           AppLogLevel;
  action:          string;
  status:          AppLogStatus;
  actor_id:        string | null;
  actor_role:      string | null;
  reservation_id:  string | null;
  details:         Record<string, unknown>;
  created_at:      string;
}

export interface AppLogInsert {
  category:        AppLogCategory;
  level:           AppLogLevel;
  action:          string;
  status:          AppLogStatus;
  actor_id?:       string | null;
  actor_role?:     string | null;
  reservation_id?: string | null;
  details?:        Record<string, unknown>;
}

// ============================================
// TABLE : companies
// ============================================

/** Compagnie artistique (données complètes depuis la BDD) */
export interface CompanyRow {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  // CDC V4 - Nouveaux champs
  city: string | null;
  contact_name: string | null;
  // Champs système
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer une nouvelle compagnie */
export interface CompanyInsert {
  name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
  // CDC V4 - Nouveaux champs
  city?: string | null;
  contact_name?: string | null;
}

/** Données pour mettre à jour une compagnie */
export interface CompanyUpdate {
  name?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
  // CDC V4 - Nouveaux champs
  city?: string | null;
  contact_name?: string | null;
  // Champs système
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
  postal_code: string | null;
  city: string | null;
  country: string | null;
  comments: string | null;
  company_id: string | null;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  gdpr_data_retention_accepted: boolean;
  last_login_at: string | null;
  disabled_at: string | null; // NULL = actif, date = désactivé temporairement
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
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
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
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
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
  address: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  photo_url: string | null;
  // CDC V4 - Nouveaux champs
  capacity: number | null;
  pmr_accessible: boolean;
  parking: boolean;
  transports: string | null;
  // Champs système
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Données pour créer une nouvelle salle */
export interface VenueInsert {
  name: string;
  address?: string | null;
  city: string;
  postal_code?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  photo_url?: string | null;
  // CDC V4 - Nouveaux champs
  capacity?: number | null;
  pmr_accessible?: boolean;
  parking?: boolean;
  transports?: string | null;
}

/** Données pour mettre à jour une salle */
export interface VenueUpdate {
  name?: string;
  address?: string | null;
  city?: string;
  postal_code?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  photo_url?: string | null;
  // CDC V4 - Nouveaux champs
  capacity?: number | null;
  pmr_accessible?: boolean;
  parking?: boolean;
  transports?: string | null;
  // Champs système
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
// TABLE : target_audiences (CDC V4 - NOUVELLE TABLE)
// ============================================

/** Public cible d'un spectacle (données complètes depuis la BDD) */
export interface TargetAudienceRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** Données pour créer un nouveau public cible */
export interface TargetAudienceInsert {
  name: string;
  slug: string;
  description?: string | null;
  display_order?: number;
}

/** Données pour mettre à jour un public cible */
export interface TargetAudienceUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  display_order?: number;
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
  // CDC V4 - Nouveaux champs
  period: string | null;
  derviche_manager_id: string | null;
  invitation_policy: string | null;
  closure_dates: string | null;
  folder_url: string | null;
  teaser_url: string | null;
  captation_available: boolean;
  captation_url: string | null;
  // S170 - Dossier photo
  photo_folder_url: string | null;
  // Champs système
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
  // CDC V4 - Nouveaux champs
  period?: string | null;
  derviche_manager_id?: string | null;
  invitation_policy?: string | null;
  closure_dates?: string | null;
  folder_url?: string | null;
  teaser_url?: string | null;
  captation_available?: boolean;
  captation_url?: string | null;
  // S170 - Dossier photo
  photo_folder_url?: string | null;
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
  // CDC V4 - Nouveaux champs
  period?: string | null;
  derviche_manager_id?: string | null;
  invitation_policy?: string | null;
  closure_dates?: string | null;
  folder_url?: string | null;
  teaser_url?: string | null;
  captation_available?: boolean;
  captation_url?: string | null;
  // S170 - Dossier photo
  photo_folder_url?: string | null;
  // Champs système
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
  // CDC V4 - Nouveau champ
  hosted_by_id: string | null;
  // Champs système
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
  // CDC V4 - Nouveau champ
  hosted_by_id?: string | null;
}

/** Données pour mettre à jour un créneau */
export interface SlotUpdate {
  venue_id?: string;
  date?: string;
  time?: string;
  capacity?: number;
  remaining_capacity?: number;
  hosted_by?: SlotHostedBy;
  // CDC V4 - Nouveau champ
  hosted_by_id?: string | null;
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
  // CDC V4 - Nouveaux champs guests
  guest_email_secondary: string | null;
  guest_phone_secondary: string | null;
  guest_address: string | null;
  guest_postal_code: string | null;
  guest_city: string | null;
  // Champs réservation
  num_places: number;
  status: ReservationStatus;
  special_requests: string | null;
  // Champs check-in
  checkin_status: CheckinStatus | null;
  checkin_comment: string | null;
  checkin_venue_notes: string | null;
  checkin_internal_notes: string | null;
  checkin_at: string | null;
  checkin_by: string | null;
  // Champs externes
  google_calendar_event_id: string | null;
  // Champs annulation
  cancelled_at: string | null;
  cancellation_reason: string | null;
  // Champs source
  source: ReservationSource;
  created_by_user_id: string | null;
  // Champs système
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
  // CDC V4 - Nouveaux champs guests (optionnels)
  guest_email_secondary?: string | null;
  guest_phone_secondary?: string | null;
  guest_address?: string | null;
  guest_postal_code?: string | null;
  guest_city?: string | null;
  // Champs réservation
  num_places: number;
  status?: ReservationStatus;
  special_requests?: string | null;
  // Champs source (optionnels, défaut: 'public')
  source?: ReservationSource;
  created_by_user_id?: string | null;
}

/** Données pour mettre à jour une réservation */
export interface ReservationUpdate {
  slot_id?: string;
  num_places?: number;
  status?: ReservationStatus;
  special_requests?: string | null;
  // Champs guest primaires
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  guest_function?: string | null;
  guest_structure?: string | null;
  guest_afc_number?: string | null;
  // CDC V4 - Nouveaux champs guests secondaires
  guest_email_secondary?: string | null;
  guest_phone_secondary?: string | null;
  guest_address?: string | null;
  guest_postal_code?: string | null;
  guest_city?: string | null;
  // Champs check-in
  checkin_status?: CheckinStatus | null;
  checkin_comment?: string | null;
  checkin_venue_notes?: string | null;
  checkin_internal_notes?: string | null;
  checkin_at?: string | null;
  checkin_by?: string | null;
  // Champs externes
  google_calendar_event_id?: string | null;
  // Champs annulation
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
// TABLE : show_target_audience_mapping (CDC V4 - NOUVELLE TABLE)
// ============================================

/** Association spectacle-public cible (relation N-N) */
export interface ShowTargetAudienceMappingRow {
  show_id: string;
  target_audience_id: string;
}

// ============================================
// TYPES COMPOSÉS (jointures)
// ============================================

/**
 * Utilisateur interne (staff) avec son rôle
 * Jointure profiles + user_roles pour les rôles internes (super-admin, admin, externe-dd)
 */
export interface InternalUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: InternalRole;
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null; // NULL = actif, date = désactivé
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
      app_logs: {
        Row:    AppLogRow;
        Insert: AppLogInsert;
        Update: Partial<AppLogInsert>;
      };
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
      // CDC V4 - Nouvelle table
      target_audiences: {
        Row: TargetAudienceRow;
        Insert: TargetAudienceInsert;
        Update: TargetAudienceUpdate;
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
      // CDC V4 - Nouvelle table de liaison
      show_target_audience_mapping: {
        Row: ShowTargetAudienceMappingRow;
        Insert: ShowTargetAudienceMappingRow;
        Update: never;
      };
    };
  };
}
