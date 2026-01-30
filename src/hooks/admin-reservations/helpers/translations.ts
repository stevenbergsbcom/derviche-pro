/**
 * Helpers de traduction pour l'export des réservations
 * @module hooks/admin-reservations/helpers/translations
 */

/**
 * Statuts de réservation possibles
 */
type ReservationStatus = 'confirmed' | 'cancelled' | 'no_show';

/**
 * Statuts de check-in possibles
 */
type CheckinStatus = 'present_loved' | 'present_press' | 'present_neutral' | 'absent';

/**
 * Mapping des statuts de réservation vers leur label français
 */
const STATUS_TRANSLATIONS: Record<ReservationStatus, string> = {
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  no_show: 'No-show',
};

/**
 * Mapping des statuts de check-in vers leur label français
 */
const CHECKIN_TRANSLATIONS: Record<CheckinStatus, string> = {
  present_loved: 'A aimé',
  present_press: 'Presse',
  present_neutral: 'Neutre',
  absent: 'Absent',
};

/**
 * Vérifie si un statut est un ReservationStatus valide
 */
function isReservationStatus(status: string): status is ReservationStatus {
  return status in STATUS_TRANSLATIONS;
}

/**
 * Vérifie si un statut est un CheckinStatus valide
 */
function isCheckinStatus(status: string): status is CheckinStatus {
  return status in CHECKIN_TRANSLATIONS;
}

/**
 * Traduit le statut de réservation en français
 * @param status - Statut technique (confirmed, cancelled, no_show)
 * @returns Label français ou le statut original si non trouvé
 */
export function translateStatus(status: string): string {
  if (isReservationStatus(status)) {
    return STATUS_TRANSLATIONS[status];
  }
  return status;
}

/**
 * Traduit le statut de check-in en français
 * @param status - Statut technique ou null
 * @returns Label français, '-' si null, ou le statut original si non trouvé
 */
export function translateCheckin(status: string | null): string {
  if (!status) return '-';
  if (isCheckinStatus(status)) {
    return CHECKIN_TRANSLATIONS[status];
  }
  return status;
}
