/**
 * Types - Admin Stats Service
 * Derviche Diffusion
 *
 * Types publics pour la page /admin/statistiques (Phase 1 — MVP).
 */

import type { PeriodBounds } from '@/lib/services/admin-dashboard';

// ============================================
// PÉRIODE
// ============================================

/**
 * Identifiants de période disponibles pour la page Statistiques.
 *
 * - `month_current`  : mois calendaire en cours
 * - `month_previous` : mois calendaire précédent
 * - `season_current` : saison en cours (bornes via season_start/season_end)
 * - `year_current`   : année civile en cours
 * - `all`            : pas de borne (2020-01-01 → 2099-12-31, inclut passé + futur)
 * - `custom`         : bornes fournies manuellement par l'utilisateur
 */
export type StatsPeriod =
  | 'month_current'
  | 'month_previous'
  | 'season_current'
  | 'year_current'
  | 'all'
  | 'custom';

// ============================================
// FILTRES
// ============================================

/** Filtres appliqués à une requête de stats. */
export interface StatsFilters {
  /** Borne inférieure (YYYY-MM-DD, incluse). */
  from: string;
  /** Borne supérieure (YYYY-MM-DD, incluse). */
  to: string;
  /** Restreint aux spectacles de ces compagnies (UUID). */
  companyIds?: string[];
  /** Restreint aux représentations dans ces lieux (UUID). */
  venueIds?: string[];
}

// ============================================
// AGRÉGATS
// ============================================

/** Cartes KPIs globales de la page. */
export interface StatsKpis {
  totalConfirmed: number;
  totalCancelled: number;
  totalPlacesConfirmed: number;
  totalShows: number;
}

/** Ligne du tableau "Par spectacle". */
export interface ShowStats {
  showId: string;
  showTitle: string;
  showSlug: string;
  companyId: string | null;
  companyName: string;
  representationsCount: number;
  confirmedCount: number;
  cancelledCount: number;
  presentCount: number;
  absentCount: number;
  pressCount: number;
}

/** Ligne du tableau "Par lieu". */
export interface VenueStats {
  venueId: string;
  venueName: string;
  venueCity: string;
  representationsCount: number;
  showsCount: number;
  confirmedCount: number;
  presentCount: number;
  absentCount: number;
  pressCount: number;
}

// ============================================
// BUNDLE ORCHESTRATEUR
// ============================================

/** Données complètes renvoyées par `getAdminStats`. */
export interface AdminStatsData {
  kpis: StatsKpis;
  shows: ShowStats[];
  venues: VenueStats[];
  bounds: PeriodBounds;
}

/** Résultat d'une opération de service stats. */
export interface StatsResult<T> {
  data: T | null;
  error: string | null;
}
