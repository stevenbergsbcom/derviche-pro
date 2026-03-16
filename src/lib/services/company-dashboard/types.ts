/**
 * Types Company Dashboard
 * Derviche Diffusion
 */

import type { CompanyRow, ShowStatus, SlotHostedBy, ShowRow, VenueRow } from '@/types/database';

/** Spectacle avec statistiques pour le dashboard compagnie */
export interface CompanyShowWithStats {
  id: string;
  slug: string;
  title: string;
  company_id: string;
  short_description: string | null;
  long_description: string | null;
  duration_minutes: number | null;
  practical_info: string | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  status: ShowStatus;
  price_type: string;
  price_amount: number | null;
  max_reservations_per_booking: number;
  period: string | null;
  derviche_manager_id: string | null;
  invitation_policy: string | null;
  closure_dates: string | null;
  folder_url: string | null;
  teaser_url: string | null;
  captation_available: boolean;
  captation_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Stats additionnelles
  total_slots: number;
  total_reservations: number;
  total_capacity: number;
  occupancy_rate: number; // Pourcentage
}

/** Créneau à venir avec détails */
export interface UpcomingSlot {
  id: string;
  show_id: string;
  venue_id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  hosted_by: SlotHostedBy;
  hosted_by_id: string | null;
  created_at: string;
  updated_at: string;
  // Données jointes
  show: Pick<ShowRow, 'id' | 'title' | 'slug' | 'image_url'>;
  venue: Pick<VenueRow, 'id' | 'name' | 'city'>;
  reservations_count: number;
  /** Nombre de personnes ayant effectivement assisté = sum(num_places) où checkin_status != 'absent' && != null */
  checkin_count: number;
}

/** Statistiques globales du dashboard */
export interface CompanyDashboardStats {
  total_shows: number;
  total_slots: number;
  total_reservations: number;
  total_capacity: number;
  average_occupancy_rate: number; // Pourcentage
  upcoming_slots_count: number;
}

/** Données complètes du dashboard compagnie */
export interface CompanyDashboardData {
  company: CompanyRow | null;
  stats: CompanyDashboardStats;
  shows: CompanyShowWithStats[];
  upcomingSlots: UpcomingSlot[];
}

/** Résultat d'une opération */
export interface CompanyDashboardResult {
  data: CompanyDashboardData | null;
  error: string | null;
}
