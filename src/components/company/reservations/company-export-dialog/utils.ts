/**
 * Utilitaires pour le composant CompanyExportDialog
 * Fonctions pures sans dépendances React
 */

import type { CompanyExportColumn } from '@/hooks/useCompanyReservations';
import type { CompanyReservation, CompanyReservationFilters } from '@/lib/services/company-reservations';
import type { ExportPeriod } from './types';
import {
  STATUS_LABELS,
  CHECKIN_STATUS_LABELS,
  TRUNCATE_LENGTHS,
} from './constants';

// ============================================
// FORMATAGE
// ============================================

/**
 * Formate une date pour l'aperçu (format court JJ/MM)
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Tronque une chaîne à une longueur maximale
 */
function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '-';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// ============================================
// VALEURS DE CELLULES
// ============================================

/**
 * Obtient la valeur d'affichage d'une cellule pour l'aperçu.
 * Note: Les valeurs sont tronquées pour l'affichage dans le dialog.
 * L'export réel contient les valeurs complètes.
 */
export function getCellValue(col: CompanyExportColumn, r: CompanyReservation): string {
  switch (col) {
    case 'date':
      return r.slot?.date ? formatDateShort(r.slot.date) : '-';

    case 'spectacle':
      return truncate(r.slot?.show?.title, TRUNCATE_LENGTHS.spectacle);

    case 'venue':
      return truncate(r.slot?.venue?.name, TRUNCATE_LENGTHS.venue);

    case 'lastName':
      return r.lastName || '-';

    case 'firstName':
      return r.firstName || '-';

    case 'email':
      return truncate(r.email, TRUNCATE_LENGTHS.email);

    case 'phone':
      return r.phone || '-';

    case 'emailSecondary':
      return r.emailSecondary || '-';

    case 'phoneSecondary':
      return r.phoneSecondary || '-';

    case 'organization':
      return truncate(r.organization, TRUNCATE_LENGTHS.organization);

    case 'function':
      return r.function || '-';

    case 'afcNumber':
      return r.afcNumber || '-';

    case 'address': {
      const parts = [r.address, r.postalCode, r.city].filter(Boolean);
      const fullAddress = parts.length > 0 ? parts.join(' ') : '-';
      return truncate(fullAddress, TRUNCATE_LENGTHS.address);
    }

    case 'numPlaces':
      return String(r.numPlaces);

    case 'status':
      return STATUS_LABELS[r.status] || r.status;

    case 'checkinStatus':
      if (!r.checkinStatus) return '-';
      return CHECKIN_STATUS_LABELS[r.checkinStatus] || r.checkinStatus;

    case 'specialRequests':
      return truncate(r.specialRequests, TRUNCATE_LENGTHS.specialRequests);

    case 'createdAt':
      return r.createdAt ? formatDateShort(r.createdAt.split('T')[0]) : '-';

    default:
      return '-';
  }
}

// ============================================
// DÉTECTION FILTRES ACTIFS
// ============================================

/**
 * Détermine si des filtres de la page sont actifs
 * (period 'upcoming' est le défaut, on l'exclut)
 */
export function hasActiveFilters(filters: CompanyReservationFilters): boolean {
  return !!(
    filters.showId ||
    filters.status ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.period && filters.period !== 'upcoming')
  );
}

/**
 * Détermine la période initiale basée sur les filtres de la page
 */
export function getInitialPeriod(filters: CompanyReservationFilters): ExportPeriod {
  if (filters.period === 'upcoming') return 'upcoming';
  if (filters.period === 'past') return 'past';
  return 'all';
}
