/**
 * Helpers de formatage pour l'export des réservations
 * @module hooks/admin-reservations/helpers/formatters
 */

import type { AdminReservation } from '@/lib/services/admin-reservations';
import type { ReservationColumn } from '@/hooks/useUserPreferences';
import { translateStatus, translateCheckin } from './translations';
import { formatDateExport } from '@/lib/utils/format-date';
import { formatFollowupEmailsList } from '@/lib/utils/followup-emails';

export { formatDateExport };

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

    // S175 — adresse éclatée en 4 colonnes pour l'export
    case 'addressStreet':
      return r.address ?? '-';

    case 'addressPostalCode':
      return r.postalCode ?? '-';

    case 'addressCity':
      return r.city ?? '-';

    case 'addressCountry':
      return r.country ?? '-';

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

    case 'followupEmails':
      // « Présent 12 juil. 2026 14:32 ; Coup de cœur … » — '-' si aucun envoi
      return formatFollowupEmailsList(r.checkinFollowupEmails ?? []) || '-';

    case 'createdAt':
      // createdAt est un datetime complet, extraire juste la date
      return r.createdAt ? formatDateExport(r.createdAt.split('T')[0]) : '-';

    // S175 + Session B — Identifiants externes / techniques
    case 'crmIdPro':
      return r.crmId ?? '-';

    case 'crmIdStructure':
      return r.crmStructureId ?? '-';

    case 'userUuid':
      // UUID du compte pro (null pour résa guest) — pont technique support
      return r.userId ?? '-';

    default:
      return '-';
  }
}
