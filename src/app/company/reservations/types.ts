/**
 * Types pour la page réservations compagnie
 * Derviche Diffusion - Session 117
 */

import type { CompanyExportColumn } from '@/lib/services/company-reservations';
import type {
  PeriodPreset,
  DatePreset,
  SortOption,
} from '@/components/company/reservations';
import type { ReservationStatus, CheckinStatus } from '@/types/database';

// Import du type réservation depuis le service
import type { CompanyReservation } from '@/lib/services/company-reservations';

// ============================================
// STATS
// ============================================

/**
 * Statistiques des réservations compagnie
 * Inclut le compteur d'absents (différent de admin)
 */
export interface CompanyReservationStats {
  total: number;
  totalPlaces: number;
  confirmed: number;
  cancelled: number;
  presentLoved: number;
  presentPress: number;
  presentNeutral: number;
  absent: number;
}

// ============================================
// FILTRES
// ============================================

/**
 * État des filtres de la page
 */
export interface CompanyFiltersState {
  searchInput: string;
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;
  filtersExpanded: boolean;
}

/**
 * Filtres actifs envoyés à l'API
 */
export interface CompanyReservationFilters {
  search?: string;
  showId?: string;
  status?: ReservationStatus;
  checkinStatus?: CheckinStatus;
  period?: PeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: SortOption;
}

// ============================================
// SPECTACLES
// ============================================

/**
 * Spectacle simplifié pour les filtres
 */
export interface CompanyShow {
  id: string;
  title: string;
}

// ============================================
// PROPS COMPOSANTS
// ============================================

/**
 * Props du header avec actions
 */
export interface HeaderActionsProps {
  isLoading: boolean;
  hasReservations: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

/**
 * Props des cartes statistiques
 */
export interface CompanyStatsCardsProps {
  stats: CompanyReservationStats;
}

/**
 * Props de la section filtres
 */
export interface FiltersSectionProps {
  // État UI
  filtersExpanded: boolean;
  onToggleExpanded: () => void;
  activeFiltersCount: number;
  
  // Recherche
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isSearching: boolean;
  isDebouncing: boolean;
  
  // Filtres API
  filters: CompanyReservationFilters;
  shows: CompanyShow[];
  onShowFilter: (showId: string) => void;
  onStatusFilter: (status: string) => void;
  onCheckinFilter: (checkinStatus: string) => void;
  onPeriodFilter: (period: string) => void;
  onSortChange: (sortBy: SortOption | undefined) => void;
  
  // Dates
  datePreset: DatePreset | null;
  dateFrom: string;
  dateTo: string;
  onDatePreset: (preset: DatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  
  // Reset
  onResetFilters: () => void;
}

/**
 * Props du tableau des réservations
 */
export interface ReservationsTableProps {
  reservations: CompanyReservation[];
  visibleColumns: CompanyExportColumn[];
  isLoading: boolean;
  activeFiltersCount: number;
  currentSort?: SortOption;
  onSortChange: (sortBy: SortOption | undefined) => void;
  onResetFilters: () => void;
}

/**
 * Props des contrôles de pagination
 */
export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// ============================================
// RÉEXPORT
// ============================================

// Réexport du type CompanyReservation pour convenance
export type { CompanyReservation } from '@/lib/services/company-reservations';
