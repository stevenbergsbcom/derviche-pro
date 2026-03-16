/**
 * Types et interfaces pour le service Company Reservations
 * Derviche Diffusion
 */

import type { ReservationStatus, CheckinStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

/** Informations du slot enrichies */
export interface CompanyReservationSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  hostedBy: string;
  venue: {
    id: string;
    name: string;
    city: string;
  } | null;
  show: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

/** Réservation pour la compagnie (sans notes internes) */
export interface CompanyReservation {
  id: string;
  slotId: string;

  // Données guest
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  emailSecondary: string | null;
  phoneSecondary: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  organization: string | null;
  function: string | null;
  afcNumber: string | null;

  // Réservation
  numPlaces: number;
  status: ReservationStatus;
  specialRequests: string | null;

  // Check-in (sans notes internes - checkinInternalNotes exclu)
  checkinStatus: CheckinStatus | null;
  checkinAt: string | null;
  checkinNotes: string | null;
  checkinVenueNotes: string | null;

  // Timestamps
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;

  // Relations
  slot: CompanyReservationSlot | null;
}

/** Filtres pour la liste des réservations */
export interface CompanyReservationFilters {
  /** Filtrer par spectacle (show_id) */
  showId?: string;
  /** Filtrer par slot (slot_id) */
  slotId?: string;
  /** Filtrer par statut */
  status?: ReservationStatus;
  /** Filtrer par statut check-in */
  checkinStatus?: CheckinStatus;
  /** Période rapide (à venir / passées / toutes) */
  period?: 'upcoming' | 'past' | 'all';
  /** Filtrer par date de représentation (YYYY-MM-DD) */
  dateFrom?: string;
  /** Filtrer par date de représentation (YYYY-MM-DD) */
  dateTo?: string;
  /** Recherche textuelle (nom, email) */
  search?: string;
  /** Tri des résultats */
  sortBy?: 'slot_date_asc' | 'slot_date_desc' | 'created_at_asc' | 'created_at_desc' | 'name_asc' | 'name_desc';
}

/** Options de pagination */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/** Résultat paginé */
export interface CompanyReservationsResult {
  data: CompanyReservation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

/** Statistiques des réservations */
export interface CompanyReservationStats {
  total: number;
  confirmed: number;
  cancelled: number;
  noShow: number;
  presentLoved: number;
  presentPress: number;
  presentNeutral: number;
  absent: number;
  totalPlaces: number;
}

/** Colonnes disponibles pour l'export compagnie (sans notes internes) */
export type CompanyExportColumn =
  | 'date'
  | 'spectacle'
  | 'venue'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'emailSecondary'
  | 'phoneSecondary'
  | 'organization'
  | 'function'
  | 'afcNumber'
  | 'address'
  | 'numPlaces'
  | 'status'
  | 'checkinStatus'
  | 'specialRequests'
  | 'checkinNotes'
  | 'checkinVenueNotes'
  | 'createdAt';
