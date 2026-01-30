/**
 * Helpers de formatage pour l'export des réservations
 * @module hooks/admin-reservations/helpers/formatters
 */

import type { AdminReservation } from '@/lib/services/admin-reservations';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import { translateStatus, translateCheckin } from './translations';

/**
 * Formate une date pour l'export (format français JJ/MM/AAAA)
 * @param dateStr - Date au format ISO ou null
 * @returns Date formatée ou '-' si null
 */
export function formatDateExport(dateStr: string | null): string {
  if (!dateStr) return '-';
  // Ajouter T12:00:00 pour éviter les problèmes de timezone
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Obtient la valeur d'une colonne pour l'export
 * @param col - Identifiant de la colonne
 * @param reservation - Données de la réservation
 * @returns Valeur formatée pour l'export
 */
export function getCellValue(
  col: ReservationColumn,
  reservation: AdminReservation
): string {
  const r = reservation;

  switch (col) {
    case 'date':
      return r.slot?.date ? formatDateExport(r.slot.date) : '-';

    case 'spectacle':
      return r.slot?.show?.title ?? '-';

    case 'venue':
      return r.slot?.venue?.name ?? '-';

    case 'firstName':
      return r.firstName ?? '-';

    case 'lastName':
      return r.lastName ?? '-';

    case 'email':
      return r.email ?? '-';

    case 'phone':
      return r.phone ?? '-';

    case 'emailSecondary':
      return r.emailSecondary ?? '-';

    case 'phoneSecondary':
      return r.phoneSecondary ?? '-';

    case 'organization':
      return r.organization ?? '-';

    case 'function':
      return r.function ?? '-';

    case 'afcNumber':
      return r.afcNumber ?? '-';

    case 'address': {
      const parts = [r.address, r.postalCode, r.city].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : '-';
    }

    case 'numPlaces':
      return String(r.numPlaces);

    case 'status':
      return translateStatus(r.status);

    case 'checkinStatus':
      return translateCheckin(r.checkinStatus);

    case 'specialRequests':
      return r.specialRequests ?? '-';

    case 'checkinNotes':
      return r.checkinComment ?? '-';

    case 'checkinVenueNotes':
      return r.checkinVenueNotes ?? '-';

    case 'checkinInternalNotes':
      return r.checkinInternalNotes ?? '-';

    case 'createdAt':
      // createdAt est un datetime complet, extraire juste la date
      return r.createdAt ? formatDateExport(r.createdAt.split('T')[0]) : '-';

    default:
      return '-';
  }
}
