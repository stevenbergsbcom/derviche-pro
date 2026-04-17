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
  /** Adresse postale (rue) du lieu — affichée dans l'email si présente. */
  venueAddress: string | null;
  /** Code postal du lieu — affiché combiné avec la ville si présent. */
  venuePostalCode: string | null;
  numPlaces: number;
  /**
   * URL de la page marketing du spectacle sur dervichediffusion.com.
   * Utilisée comme CTA principal si `template.show_derviche_site_link` est activé.
   */
  dervisheSiteUrl: string | null;
  /**
   * ID du compte utilisateur associé à la réservation.
   * `null` = réservation guest (sans compte) → bloc gérer = message + mailto.
   * non-null = compte pro → bloc gérer = bouton vers /professional/reservations.
   */
  userId: string | null;
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
  /** Adresse postale (rue) du lieu — affichée dans l'email si présente. */
  venueAddress: string | null;
  /** Code postal du lieu — affiché combiné avec la ville si présent. */
  venuePostalCode: string | null;
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
  /** Adresse postale (rue) du lieu — affichée dans l'email si présente. */
  venueAddress: string | null;
  /** Code postal du lieu — affiché combiné avec la ville si présent. */
  venuePostalCode: string | null;
  numPlaces: number;
  /**
   * URL de la page marketing du spectacle sur dervichediffusion.com.
   * Utilisée comme CTA principal si `template.show_derviche_site_link` est activé.
   */
  dervisheSiteUrl: string | null;
}

export interface AdminNotificationEmailData {
  to: string;
  adminName: string;
  eventType: 'new_reservation' | 'cancellation' | 'modification';
  // Pro
  guestFullName: string;
  guestEmail: string;
  guestStructure?: string | null;
  /** Téléphone du professionnel (si renseigné). */
  guestPhone?: string | null;
  /** Fonction / poste (si renseigné). */
  guestFunction?: string | null;
  /** N° AFC (si renseigné). */
  guestAfcNumber?: string | null;
  /**
   * `null` = réservation guest sans compte, sinon ID du compte pro lié.
   * Utilisé pour badger « Guest » / « Compte pro » dans l'email.
   */
  userId: string | null;
  // Spectacle
  showTitle: string;
  /** Nom de la compagnie du spectacle. */
  companyName: string;
  // Créneau
  slotDateFormatted: string;
  slotTimeFormatted: string;
  venueName: string;
  /** Ville du lieu. */
  venueCity: string;
  /** Adresse (rue) du lieu, si renseignée. */
  venueAddress?: string | null;
  /** Code postal du lieu, si renseigné. */
  venuePostalCode?: string | null;
  numPlaces: number;
  /** Demandes spéciales du pro (si renseignées). */
  specialRequests?: string | null;
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
  /** URL du dossier photo (null si non renseignée) — S170 */
  photoFolderUrl: string | null;
  /**
   * URL de la page marketing sur dervichediffusion.com.
   * Rendu conditionné par le toggle `template.show_derviche_site_link`.
   */
  dervisheSiteUrl: string | null;
  // Créneau
  slotDateFormatted: string;
  slotTimeFormatted: string;
  // Lieu
  venueName: string;
  venueCity: string;
  /** Adresse postale (rue) du lieu — affichée dans l'email si présente. */
  venueAddress: string | null;
  /** Code postal du lieu — affiché combiné avec la ville si présent. */
  venuePostalCode: string | null;
}

// ============================================
// RÉSULTAT D'ENVOI
// ============================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
