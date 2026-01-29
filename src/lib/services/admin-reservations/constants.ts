/**
 * Constantes pour le service Admin Reservations
 * Derviche Diffusion
 * 
 * @module admin-reservations/constants
 */

// ============================================
// QUERIES SUPABASE
// ============================================

/**
 * Query SELECT complète pour les réservations avec relations
 * Utilisée par : getAdminReservations, getAllReservationsForExport, getReservationsBySlot
 */
export const RESERVATION_SELECT_QUERY = `
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
` as const;

/**
 * Query SELECT pour une réservation unique (sans !inner sur slots)
 * Utilisée par : getAdminReservationById, après mutations
 */
export const RESERVATION_SINGLE_SELECT_QUERY = `
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
` as const;

/**
 * Query SELECT pour les statistiques (allégée)
 * Utilisée par : getReservationStats
 */
export const RESERVATION_STATS_SELECT_QUERY = `
  id,
  status,
  checkin_status,
  num_places,
  slots!inner (
    show_id
  )
` as const;

/**
 * Query SELECT pour les slots disponibles
 * Utilisée par : getAvailableSlotsForShow
 */
export const SLOT_SELECT_QUERY = `
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
` as const;

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

/** Pagination par défaut */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
} as const;

/** Tri par défaut */
export const DEFAULT_SORT_BY = 'slot_date_asc' as const;

// ============================================
// COLONNES DE RECHERCHE
// ============================================

/** Colonnes utilisées pour la recherche textuelle */
export const SEARCH_COLUMNS = [
  'guest_email',
  'guest_first_name', 
  'guest_last_name',
] as const;

// ============================================
// MESSAGES D'ERREUR
// ============================================

/**
 * Messages d'erreur standards pour le logging et les retours utilisateur
 */
export const ERROR_MESSAGES = {
  // Récupération
  FETCH_LIST: 'Erreur récupération admin reservations',
  FETCH_EXPORT: 'Erreur récupération reservations pour export',
  FETCH_BY_ID: 'Erreur récupération reservation',
  FETCH_BY_SLOT: 'Erreur récupération reservations par slot',
  FETCH_STATS: 'Erreur récupération stats reservations',
  FETCH_SLOTS: 'Erreur récupération slots disponibles',
  
  // Mutations
  UPDATE_CHECKIN: 'Erreur mise à jour checkin',
  UPDATE_RESERVATION: 'Erreur de mise à jour',
  UPDATE_RPC_FAIL: 'RPC update_reservation_safe échec',
  CANCEL: 'Erreur annulation reservation',
  CREATE_RPC_FAIL: 'RPC create_admin_reservation échec',
  
  // Exceptions génériques
  EXCEPTION: 'Erreur inconnue',
} as const;

/**
 * Messages utilisateur pour les erreurs de doublon
 */
export const USER_ERROR_MESSAGES = {
  DUPLICATE_EMAIL_SLOT: (email: string) => 
    `Une réservation existe déjà pour ce créneau avec l'adresse ${email}. Annulez d'abord l'existante si nécessaire.`,
} as const;

// ============================================
// MARKERS RPC
// ============================================

/**
 * Préfixe d'erreur RPC pour doublon email/slot (R-RESA-04)
 */
export const RPC_ERROR_DUPLICATE_PREFIX = 'DUPLICATE_EMAIL_SLOT:' as const;
