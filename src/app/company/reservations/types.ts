/**
 * Types pour la page réservations compagnie
 * Structure identique à admin/reservations
 * Derviche Diffusion - Session 119
 */

// Réexport du type CompanyReservation pour convenance
export type { CompanyReservation, CompanyReservationFilters } from '@/lib/services/company-reservations';
export type { CompanyReservationColumn } from '@/hooks/useUserPreferences';

// ============================================
// DATE PRESETS
// ============================================

export type DatePreset = 'this_week' | 'this_month' | 'next_month' | 'custom';

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
// SPECTACLES
// ============================================

/**
 * Spectacle simplifié pour les filtres
 */
export interface CompanyShow {
  id: string;
  title: string;
  slug: string;
}
