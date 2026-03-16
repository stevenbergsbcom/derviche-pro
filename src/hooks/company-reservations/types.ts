/**
 * Types pour le hook useCompanyReservations
 * Derviche Diffusion
 */

import type {
  CompanyReservation,
  CompanyReservationFilters,
  CompanyReservationStats,
  CompanyExportColumn,
  PaginationOptions,
} from '@/lib/services/company-reservations';

// Re-export du type pour usage externe
export type { CompanyExportColumn } from '@/lib/services/company-reservations';

export type ExportFormat = 'csv' | 'xlsx';
export type ExportPeriod = 'all' | 'upcoming' | 'past';

export interface CompanyExportOptions {
  format: ExportFormat;
  columns: CompanyExportColumn[];
  period: ExportPeriod;
}

export interface UseCompanyReservationsReturn {
  /** Liste des réservations */
  reservations: CompanyReservation[];
  /** Nombre total de réservations (pour pagination) */
  total: number;
  /** Page actuelle */
  page: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Chargement en cours */
  isLoading: boolean;
  /** Message d'erreur */
  error: string | null;
  /** Statistiques des réservations */
  stats: CompanyReservationStats | null;
  /** Filtres actifs */
  filters: CompanyReservationFilters;
  /** Spectacles de la compagnie (pour filtre) */
  shows: Array<{ id: string; title: string; slug: string }>;

  /** Charger les réservations avec filtres et pagination */
  loadReservations: (
    filters?: CompanyReservationFilters,
    pagination?: PaginationOptions
  ) => Promise<{ success: boolean; error?: string }>;

  /** Charger les statistiques */
  loadStats: (filters?: { showId?: string }) => Promise<{ success: boolean; error?: string }>;

  /** Charger les spectacles de la compagnie */
  loadShows: () => Promise<{ success: boolean; error?: string }>;

  /** Exporter avec options (format et colonnes) */
  exportWithOptions: (
    options: CompanyExportOptions
  ) => Promise<{ success: boolean; error?: string }>;

  /** Changer de page */
  setPage: (page: number) => void;

  /** Changer le nombre d'éléments par page */
  setPageSize: (size: number) => void;

  /** Mettre à jour les filtres */
  setFilters: (filters: CompanyReservationFilters) => void;

  /** Réinitialiser les filtres */
  resetFilters: () => void;
}
