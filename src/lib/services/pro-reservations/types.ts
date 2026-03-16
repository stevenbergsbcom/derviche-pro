/**
 * Types pour le service des réservations professionnelles
 *
 * @module pro-reservations/types
 */

// ============================================
// TYPES
// ============================================

export type ProReservationStatus = 'confirmed' | 'cancelled' | 'no_show';

export interface ProReservationSlot {
  id: string;
  date: string;
  time: string;
  venue_name: string | null;
  venue_city: string | null;
}

export interface ProAvailableSlot {
  id: string;
  date: string;
  time: string;
  remaining_capacity: number;
  venue_name: string | null;
  venue_city: string | null;
}

export interface ProReservation {
  id: string;
  status: ProReservationStatus;
  num_places: number;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  show_title: string;
  show_slug: string | null;
  show_id: string;
  show_company_name: string | null;
  slot: ProReservationSlot;
}

export type ProReservationResult =
  | { data: ProReservation[]; error: null }
  | { data: null; error: string };

export type CancelResult =
  | { success: true }
  | { success: false; error: string };

// Réservation guest orpheline (user_id IS NULL, liée à un email)
export interface GuestReservation {
  reservation_id: string;
  show_title: string;
  slot_date: string;
  slot_time: string;
  venue_name: string | null;
  num_places: number;
  status: string;
  created_at: string;
}

export type GetGuestReservationsResult =
  | { data: GuestReservation[]; error: null }
  | { data: null; error: string };

export type ClaimReservationsResult =
  | { claimed: number; error: null }
  | { claimed: 0; error: string };

export type ProAvailableSlotsResult =
  | { data: ProAvailableSlot[]; error: null }
  | { data: null; error: string };

export type ChangeSlotResult =
  | { success: true }
  | { success: false; error: string };

/** Résultat attendu de la RPC update_reservation_safe */
export interface UpdateReservationRpcResult {
  success: boolean;
  error?: string;
}

// ============================================
// TYPE INTERNE POUR LES DONNÉES BRUTES SUPABASE
// ============================================

export interface RawSlot {
  id: string;
  date: string;
  time: string;
  venues: { name: string; city: string } | null;
  shows: { id: string; title: string; slug: string | null; companies: { name: string } | null };
}

export interface RawReservation {
  id: string;
  status: string;
  num_places: number;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  slots: RawSlot;
}
