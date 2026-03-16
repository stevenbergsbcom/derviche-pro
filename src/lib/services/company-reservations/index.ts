/**
 * Service Company Reservations - Gestion des réservations côté compagnie
 * Derviche Diffusion
 *
 * Fonctionnalités (lecture seule) :
 * - Liste paginée avec filtres (spectacles de la compagnie uniquement)
 * - Export CSV/Excel (colonnes restreintes - sans notes internes)
 * - Statistiques
 *
 * Sécurité : RLS policies filtrent automatiquement par company_id
 */

// Types
export type {
  CompanyReservationSlot,
  CompanyReservation,
  CompanyReservationFilters,
  PaginationOptions,
  CompanyReservationsResult,
  CompanyReservationStats,
  CompanyExportColumn,
} from './types';

// Liste et recherche
export { getCompanyReservations, getCompanyShows } from './list';

// Export
export { getAllCompanyReservationsForExport } from './export';

// Statistiques
export { getCompanyReservationStats } from './stats';
