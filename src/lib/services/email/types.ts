/**
 * Types — Service Email
 * Derviche Diffusion
 *
 * Toutes les interfaces de données utilisées par les fonctions send...()
 * et les builders HTML.
 */

// ============================================
// CONTACT MANAGER
// ============================================

/** Infos de contact du manager Derviche assigné au spectacle */
export interface ManagerContact {
  managerName?: string | null;
  managerEmail?: string | null;
  managerPhone?: string | null;
}

// ============================================
// DONNÉES D'ENVOI PAR TYPE
// ============================================

export interface ReservationConfirmationEmailData extends ManagerContact {
  to: string;
  guestFullName: string;
  reservationCode: string;
  reservationId: string;
  showTitle: string;
  showSlug: string;
  companyName: string;
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  venueCity: string;
  numPlaces: number;
}

export interface ReservationCancellationEmailData extends ManagerContact {
  to: string;
  guestFullName: string;
  reservationId: string;
  showTitle: string;
  showSlug: string;
  companyName: string;
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  venueCity: string;
  numPlaces: number;
  cancellationReason?: string | null;
}

export interface ReservationModificationEmailData extends ManagerContact {
  to: string;
  guestFullName: string;
  reservationId: string;
  showTitle: string;
  showSlug: string;
  companyName: string;
  oldSlotDateFormatted: string;
  oldSlotTimeFormatted: string;
  newSlotDateFormatted: string;
  newSlotTimeFormatted: string;
  venueName: string;
  venueCity: string;
  numPlaces: number;
}

export interface AdminNotificationEmailData {
  to: string;
  adminName: string;
  eventType: 'new_reservation' | 'cancellation' | 'modification';
  guestFullName: string;
  guestEmail: string;
  guestStructure?: string | null;
  showTitle: string;
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  numPlaces: number;
  reservationId: string;
  cancellationReason?: string | null;
}

// ============================================
// POST-CHECKIN (S144)
// ============================================

/** Données enrichies pour les emails post-checkin */
export interface CheckinFollowupEmailData extends ManagerContact {
  to: string;
  /** Nom complet du professionnel */
  guestFullName: string;
  /** Structure / organisation du professionnel */
  guestStructure: string | null;
  reservationId: string;
  // Spectacle
  showTitle: string;
  showSlug: string;
  companyName: string;
  /** Synopsis court (short_description en DB) */
  synopsis: string | null;
  /** Durée formatée (ex: "1h15") */
  durationFormatted: string | null;
  /** Publics cibles concaténés (ex: "Tout public, Jeune public") */
  targetAudiences: string | null;
  // URLs optionnelles du spectacle (S149)
  /** URL du dossier de presse (null si non renseignée) */
  folderUrl: string | null;
  /** URL du teaser vidéo (null si non renseignée) */
  teaserUrl: string | null;
  /** URL de la captation vidéo (null si non renseignée) */
  captationUrl: string | null;
  // Créneau
  slotDateFormatted: string;
  slotTimeFormatted: string;
  // Lieu
  venueName: string;
  venueCity: string;
}

// ============================================
// RÉSULTAT D'ENVOI
// ============================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
