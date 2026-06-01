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
import {
  truncate,
  hasActiveFilters as hasActiveFiltersBase,
  getInitialPeriod as getInitialPeriodBase,
} from '@/lib/utils/export-helpers';

// ============================================
// FORMATAGE
// ============================================

// formatDateShort importé depuis @/lib/utils/format-date (source de vérité)
import { formatDateShortExport as formatDateShort } from '@/lib/utils/format-date';
export { formatDateShort };

// truncate importé depuis @/lib/utils/export-helpers

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

    // S175 — adresse éclatée pour l'export
    case 'addressStreet':
      return truncate(r.address, TRUNCATE_LENGTHS.address);

    case 'addressPostalCode':
      return r.postalCode || '-';

    case 'addressCity':
      return r.city || '-';

    case 'addressCountry':
      return r.country || '-';

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

    // S175 — IDs CRM Zoho (lecture seule côté compagnie)
    // crmIdPro côté compagnie ne lit QUE `reservations.crm_id` (résa guest).
    // Pour résa pro, la RLS empêche d'accéder à `profiles.crm_id` → vide.
    case 'crmIdPro':
      return r.crmId || '-';

    case 'crmIdVenue':
      return r.slot?.venue?.crmId || '-';

    default:
      return '-';
  }
}

// ============================================
// DÉTECTION FILTRES ACTIFS
// ============================================

/**
 * Détermine si des filtres de la page sont actifs
 * Délègue à la version générique de @/lib/utils/export-helpers
 */
export function hasActiveFilters(filters: CompanyReservationFilters): boolean {
  return hasActiveFiltersBase(filters);
}

/**
 * Détermine la période initiale basée sur les filtres de la page
 * Délègue à la version générique de @/lib/utils/export-helpers
 */
export function getInitialPeriod(filters: CompanyReservationFilters): ExportPeriod {
  return getInitialPeriodBase(filters);
}
