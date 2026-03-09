/**
 * Types - Admin Dashboard Service
 * Derviche Diffusion
 */

import type { ShowRow, VenueRow, SlotHostedBy } from '@/types/database';
import type { SeasonSettings } from '@/lib/services/app-settings';

// ============================================
// STATISTIQUES
// ============================================

/** Statistiques globales du dashboard admin */
export interface AdminDashboardStats {
  total_shows_active: number;
  total_slots_upcoming: number;
  total_reservations: number;
  reservations_today: number;
  reservations_this_week: number;
  average_occupancy_rate: number;
}

// ============================================
// CRÉNEAUX
// ============================================

/** Créneau à venir avec détails */
export interface AdminUpcomingSlot {
  id: string;
  show_id: string;
  venue_id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  hosted_by: SlotHostedBy;
  // Données jointes
  show: Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'>;
  venue: Pick<VenueRow, 'id' | 'name' | 'city'>;
  reservations_count: number;
  occupancy_rate: number;
}

// ============================================
// RÉSERVATIONS
// ============================================

/** Réservation récente */
export interface AdminRecentReservation {
  id: string;
  created_at: string;
  num_places: number;
  status: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_structure: string | null;
  slot: {
    id: string;
    date: string;
    time: string;
    show: Pick<ShowRow, 'id' | 'title'>;
    venue: Pick<VenueRow, 'id' | 'name' | 'city'>;
  };
}

// ============================================
// GRAPHIQUE
// ============================================

/** Point de données pour le graphique des réservations */
export interface ReservationChartPoint {
  /** Date au format lisible (ex: "3 mars") */
  label: string;
  /** Date ISO pour le tri (ex: "2026-03-03") */
  date: string;
  /** Nombre de réservations ce jour */
  count: number;
}

// ============================================
// TOP SPECTACLES
// ============================================

/** Spectacle dans le top 3 avec stats */
export interface TopShow {
  id: string;
  title: string;
  slug: string;
  /** Nombre total de réservations confirmées */
  reservations_count: number;
  /** Nombre de créneaux à venir */
  upcoming_slots_count: number;
}

// ============================================
// CRÉNEAUX < 24H
// ============================================

/** Créneau dans les prochaines 24 heures */
export interface Slot24h {
  id: string;
  date: string;
  time: string;
  show_title: string;
  show_slug: string;
  venue_name: string;
  reservations_count: number;
}

// ============================================
// PÉRIODE
// ============================================

/** Identifiant de période sélectionnée */
export type DashboardPeriod = '7d' | '30d' | 'season';

/** Bornes de dates pour une période */
export interface PeriodBounds {
  start: string; // ISO date YYYY-MM-DD
  end: string;   // ISO date YYYY-MM-DD
}

// ============================================
// DASHBOARD COMPLET
// ============================================

/** Données complètes du dashboard admin */
export interface AdminDashboardData {
  stats: AdminDashboardStats;
  upcomingSlots: AdminUpcomingSlot[];
  recentReservations: AdminRecentReservation[];
  /** Données graphique (dépend de la période) */
  chartData: ReservationChartPoint[];
  /** Top 3 spectacles par réservations */
  topShows: TopShow[];
  /** Créneaux dans les prochaines 24h */
  slots24h: Slot24h[];
  /** Paramètres de saison */
  seasonSettings: SeasonSettings;
}

/** Résultat d'une opération */
export interface AdminDashboardResult {
  data: AdminDashboardData | null;
  error: string | null;
}

// ============================================
// OPTIONS
// ============================================

/** Options pour filtrer les données (externes) */
export interface AdminDashboardOptions {
  /** Liste des show_id auxquels l'utilisateur a accès (null = accès complet) */
  assignedShowIds?: string[] | null;
  /** Période sélectionnée (défaut : 7d) */
  period?: DashboardPeriod;
}

// ============================================
// TYPES INTERNES (pour les queries)
// ============================================

/** Résultat générique pour les sous-fonctions */
export interface QueryResult<T> {
  data: T;
  error: string | null;
}
