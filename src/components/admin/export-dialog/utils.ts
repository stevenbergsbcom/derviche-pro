/**
 * Utilitaires pour le composant ExportDialog
 * Fonctions pures sans dépendances React
 */

import type { ReservationColumn } from '@/hooks/useUserPreferences';
import type { AdminReservation, AdminReservationFilters } from '@/lib/services/admin-reservations';
import type { ExportFormat, ExportPeriod } from './types';
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
// GÉNÉRATION NOM DE FICHIER
// ============================================

/**
 * Génère un nom de fichier intelligent basé sur les filtres et options
 */
export function generateExportFilename(
  filters: AdminReservationFilters,
  format: ExportFormat,
  period: ExportPeriod,
  showTitle?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const parts: string[] = ['reservations'];

  // Ajouter le contexte des filtres (titre du spectacle si disponible)
  if (showTitle) {
    const cleanTitle = showTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par tirets
      .replace(/^-+|-+$/g, '') // Enlever tirets début/fin
      .substring(0, 30);
    parts.push(cleanTitle);
  }

  // Ajouter la période
  const periodSuffix: Record<ExportPeriod, string> = {
    upcoming: 'a-venir',
    past: 'passees',
    all: 'toutes',
  };
  parts.push(periodSuffix[period]);

  // Ajouter le statut si filtré
  if (filters.status) {
    parts.push(filters.status);
  }

  parts.push(date);

  return `${parts.join('_')}.${format}`;
}

// ============================================
// VALEURS DE CELLULES
// ============================================

/**
 * Obtient la valeur d'affichage d'une cellule pour l'aperçu.
 * Note: Les valeurs sont tronquées pour l'affichage dans le dialog.
 * L'export réel dans useAdminReservations.ts contient les valeurs complètes.
 */
export function getCellValue(col: ReservationColumn, r: AdminReservation): string {
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

    case 'checkinNotes':
      return truncate(r.checkinComment, TRUNCATE_LENGTHS.checkinNotes);

    case 'checkinVenueNotes':
      return truncate(r.checkinVenueNotes, TRUNCATE_LENGTHS.checkinNotes);

    case 'checkinInternalNotes':
      return truncate(r.checkinInternalNotes, TRUNCATE_LENGTHS.checkinNotes);

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
 * Délègue à la version générique de @/lib/utils/export-helpers
 */
export function hasActiveFilters(filters: AdminReservationFilters): boolean {
  return hasActiveFiltersBase(filters);
}

/**
 * Détermine la période initiale basée sur les filtres de la page
 * Délègue à la version générique de @/lib/utils/export-helpers
 */
export function getInitialPeriod(filters: AdminReservationFilters): ExportPeriod {
  return getInitialPeriodBase(filters);
}
