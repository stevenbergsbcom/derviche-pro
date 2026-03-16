/**
 * Types pour les hooks de preferences utilisateur
 * Derviche Diffusion
 */

// ============================================
// TYPES GENERIQUES
// ============================================

export interface UseUserPreferenceReturn<T> {
  /** Valeur de la preference */
  value: T;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur eventuelle */
  error: string | null;
  /** Mettre a jour la preference */
  setValue: (newValue: T) => Promise<{ success: boolean; error?: string }>;
  /** Recharger depuis Supabase */
  refresh: () => Promise<void>;
}

// ============================================
// TYPES ADMIN - COLONNES RESERVATIONS
// ============================================

/** Colonnes disponibles pour la liste des reservations admin */
export type ReservationColumn =
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
  | 'checkinInternalNotes'
  | 'createdAt';

/** Structure des preferences de colonnes */
export interface ReservationColumnsPreference {
  /** Ordre de toutes les colonnes */
  order: ReservationColumn[];
  /** Colonnes visibles */
  visible: ReservationColumn[];
}

// ============================================
// TYPES ADMIN - COLONNES PROFESSIONNELS
// ============================================

/**
 * Colonnes configurables du tableau des professionnels
 * Les colonnes "name", "email", "status", "actions" sont toujours visibles.
 */
export type ProfessionalColumn =
  | 'structure'
  | 'phone'
  | 'email2'
  | 'phone2'
  | 'function'
  | 'city'
  | 'reservations';

// ============================================
// TYPES COMPAGNIE - COLONNES RESERVATIONS
// ============================================

/**
 * Colonnes disponibles pour la liste des reservations compagnie
 * EXCLUT: checkinInternalNotes (notes internes reservees a l'admin)
 */
export type CompanyReservationColumn =
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

/** Structure des preferences de colonnes compagnie */
export interface CompanyReservationColumnsPreference {
  /** Ordre de toutes les colonnes */
  order: CompanyReservationColumn[];
  /** Colonnes visibles */
  visible: CompanyReservationColumn[];
}
