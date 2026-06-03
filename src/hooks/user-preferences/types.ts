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
  // Adresse — affichage liste = concaténée (`address`),
  // export = séparée pour faciliter l'analyse côté Excel/CRM (S175).
  | 'address'
  | 'addressStreet'
  | 'addressPostalCode'
  | 'addressCity'
  | 'addressCountry'
  | 'numPlaces'
  | 'status'
  | 'checkinStatus'
  | 'specialRequests'
  | 'checkinNotes'
  | 'checkinVenueNotes'
  | 'checkinInternalNotes'
  | 'createdAt'
  // Identifiants externes (S175 + Session B) — masqués par défaut, utiles
  // pour le pont avec le CRM Zoho (crmIdPro = contact, crmIdStructure =
  // structure du pro) et le support technique (userUuid).
  | 'crmIdPro'
  | 'crmIdStructure'
  | 'userUuid';

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
 *        ainsi que userUuid (technique, réservé à l'admin)
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
  | 'addressStreet'
  | 'addressPostalCode'
  | 'addressCity'
  | 'addressCountry'
  | 'numPlaces'
  | 'status'
  | 'checkinStatus'
  | 'specialRequests'
  | 'checkinNotes'
  | 'checkinVenueNotes'
  | 'createdAt'
  // S175 — identifiant CRM Zoho du pro (lecture seule, utile pour le pont CRM)
  | 'crmIdPro';

/** Structure des preferences de colonnes compagnie */
export interface CompanyReservationColumnsPreference {
  /** Ordre de toutes les colonnes */
  order: CompanyReservationColumn[];
  /** Colonnes visibles */
  visible: CompanyReservationColumn[];
}
