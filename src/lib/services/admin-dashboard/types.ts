/**
 * Types - Admin Dashboard Service
 * Derviche Diffusion
 */

import type { ShowRow, VenueRow, SlotHostedBy } from '@/types/database';

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
// DASHBOARD COMPLET
// ============================================

/** Données complètes du dashboard admin */
export interface AdminDashboardData {
  stats: AdminDashboardStats;
  upcomingSlots: AdminUpcomingSlot[];
  recentReservations: AdminRecentReservation[];
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
}

// ============================================
// TYPES INTERNES (pour les queries)
// ============================================

/** Résultat générique pour les sous-fonctions */
export interface QueryResult<T> {
  data: T;
  error: string | null;
}
