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
// RÉSULTAT D'ENVOI
// ============================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
