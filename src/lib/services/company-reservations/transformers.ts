/**
 * Helpers et transformers pour le service Company Reservations
 * Derviche Diffusion
 */

import type { ReservationRow } from '@/types/database';
import type { CompanyReservation, CompanyReservationFilters } from './types';

/**
 * Transforme une row Supabase en CompanyReservation
 */
export function transformReservation(
  row: ReservationRow & {
    slots?: {
      id: string;
      date: string;
      time: string;
      capacity: number;
      remaining_capacity: number;
      hosted_by: string;
      venues?: { id: string; name: string; city: string } | null;
      shows?: { id: string; title: string; slug: string } | null;
    } | null;
  }
): CompanyReservation {
  const slot = row.slots;

  return {
    id: row.id,
    slotId: row.slot_id,

    // Données guest
    firstName: row.guest_first_name || '',
    lastName: row.guest_last_name || '',
    email: row.guest_email || '',
    phone: row.guest_phone,
    emailSecondary: row.guest_email_secondary || null,
    phoneSecondary: row.guest_phone_secondary || null,
    address: row.guest_address || null,
    postalCode: row.guest_postal_code || null,
    city: row.guest_city || null,
    organization: row.guest_structure,
    function: row.guest_function,
    afcNumber: row.guest_afc_number || null,

    // Réservation
    numPlaces: row.num_places,
    status: row.status as CompanyReservation['status'],
    specialRequests: row.special_requests,

    // Check-in (sans notes internes - checkinInternalNotes exclu)
    checkinStatus: row.checkin_status as CompanyReservation['checkinStatus'],
    checkinAt: row.checkin_at,
    checkinNotes: row.checkin_comment || null,
    checkinVenueNotes: row.checkin_venue_notes || null,

    // Timestamps
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason || null,

    // Relations
    slot: slot ? {
      id: slot.id,
      date: slot.date,
      time: slot.time.slice(0, 5), // HH:MM:SS → HH:MM
      capacity: slot.capacity,
      remainingCapacity: slot.remaining_capacity,
      hostedBy: slot.hosted_by,
      venue: slot.venues || null,
      show: slot.shows || null,
    } : null,
  };
}

/**
 * Retourne la date du jour au format YYYY-MM-DD
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcule les filtres de date effectifs en fonction de period et dateFrom/dateTo
 */
export function getEffectiveDateFilters(filters: CompanyReservationFilters): {
  dateFrom?: string;
  dateTo?: string;
} {
  // Si des dates personnalisées sont définies, elles prennent le dessus
  if (filters.dateFrom || filters.dateTo) {
    return {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }

  // Sinon, appliquer le filtre period
  const today = getTodayDate();

  switch (filters.period) {
    case 'upcoming':
      return { dateFrom: today };
    case 'past':
      return { dateTo: today };
    case 'all':
    default:
      return {};
  }
}
