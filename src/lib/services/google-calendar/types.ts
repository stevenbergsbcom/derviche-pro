/**
 * Types — Service Google Calendar
 * Derviche Diffusion
 */

// ============================================
// DONNÉES ENTRANTES
// ============================================

/**
 * Données nécessaires pour créer ou mettre à jour un événement Calendar.
 * Passées depuis les routes email (send-confirmation, send-modification).
 */
export interface CalendarEventData {
  /** Titre du spectacle */
  showTitle: string;
  /** Nom complet du professionnel */
  guestFullName: string;
  /** Structure / organisation du professionnel */
  guestStructure: string | null;
  /** Email du professionnel (invité sur l'événement) */
  guestEmail: string;
  /** Code de réservation (affiché dans la description) */
  reservationId: string;
  /** Nombre de places réservées */
  numPlaces: number;
  /** Date du créneau au format ISO : "2025-07-10" */
  slotDate: string;
  /** Heure du créneau au format "HH:MM:SS" ou "HH:MM" */
  slotTime: string;
  /** Durée du spectacle en minutes (null = 120 par défaut) */
  durationMinutes: number | null;
  /** Nom du lieu */
  venueName: string;
  /** Ville du lieu */
  venueCity: string;
  /**
   * Envoyer un email Google à l'invité ?
   * - Création : toujours true
   * - Annulation / modification : selon préférence app_settings
   */
  sendEmailNotification: boolean;
}

// ============================================
// RÉSULTATS
// ============================================

/** Résultat d'une opération Calendar (create / update / delete) */
export type CalendarResult =
  | { success: true; eventId: string }
  | { success: false; error: string };
