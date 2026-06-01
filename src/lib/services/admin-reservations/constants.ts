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
  checkin_followup_emails (
    id,
    template_key,
    sent_at,
    sent_by
  ),
  created_by:created_by_user_id (
    first_name,
    last_name,
    company_id,
    company:company_id (
      id,
      name
    ),
    user_roles (
      role
    )
  ),
  booked_by:user_id (
    first_name,
    last_name,
    crm_id
  ),
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
  checkin_followup_emails (
    id,
    template_key,
    sent_at,
    sent_by
  ),
  created_by:created_by_user_id (
    first_name,
    last_name,
    company_id,
    company:company_id (
      id,
      name
    ),
    user_roles (
      role
    )
  ),
  booked_by:user_id (
    first_name,
    last_name,
    crm_id
  ),
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
 * Note : hosted_by inclus pour permettre le filtrage par type d'accueil
 */
export const SLOT_SELECT_QUERY = `
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

// Note S184 : les constantes DUPLICATE_EMAIL_SLOT et RPC_ERROR_DUPLICATE_PREFIX
// ont été supprimées. Les doublons sont désormais autorisés avec avertissement
// côté client (voir reservations-duplicate.ts + DuplicateReservationDialog).
