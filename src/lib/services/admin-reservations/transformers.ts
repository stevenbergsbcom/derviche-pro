/**
 * Transformers pour le service Admin Reservations
 * Convertit les données Supabase en types métier
 * 
 * @module admin-reservations/transformers
 */

import { logger } from '@/lib/logger';
import type { ReservationStatus, CheckinStatus } from '@/types/database';
import type { 
  AdminReservation, 
  AdminReservationSlot,
  ReservationRowWithRelations,
  SlotRowWithRelations,
  AvailableSlot,
} from './types';

// ============================================
// HELPERS INTERNES
// ============================================

/**
 * Détecte les anomalies de données (champs requis manquants)
 * @returns Liste des champs manquants
 */
function detectMissingFields(row: ReservationRowWithRelations): string[] {
  const missingFields: string[] = [];
  
  if (!row.guest_first_name) missingFields.push('firstName');
  if (!row.guest_last_name) missingFields.push('lastName');
  if (!row.guest_email) missingFields.push('email');
  
  return missingFields;
}

/**
 * Transforme un slot Supabase en AdminReservationSlot
 */
function transformSlot(slot: SlotRowWithRelations): AdminReservationSlot {
  return {
    id: slot.id,
    date: slot.date,
    time: slot.time.slice(0, 5), // HH:MM:SS → HH:MM
    capacity: slot.capacity,
    remainingCapacity: slot.remaining_capacity,
    hostedBy: slot.hosted_by,
    venue: slot.venues || null,
    show: slot.shows ? {
      id: slot.shows.id,
      title: slot.shows.title,
      slug: slot.shows.slug,
      company: slot.shows.companies || null,
    } : null,
  };
}

// ============================================
// TRANSFORMER PRINCIPAL
// ============================================

/**
 * Transforme une row Supabase en AdminReservation
 * 
 * @param row - Données brutes de Supabase avec relations
 * @returns AdminReservation formatée pour l'UI
 * 
 * @remarks
 * - Convertit les champs null en valeurs par défaut pour l'affichage
 * - Détecte et log les anomalies de données (champs requis manquants)
 * - Formate le time de HH:MM:SS en HH:MM
 */
export function transformReservation(row: ReservationRowWithRelations): AdminReservation {
  // Détection des anomalies de données
  const missingFields = detectMissingFields(row);
  const hasDataAnomaly = missingFields.length > 0;
  
  if (hasDataAnomaly) {
    logger.warn('Réservation avec données manquantes détectée', {
      reservationId: row.id,
      missingFields,
    });
  }
  
  return {
    id: row.id,
    slotId: row.slot_id,
    userId: row.user_id,
    
    // Données guest (conversion null → '' pour l'affichage)
    firstName: row.guest_first_name || '',
    lastName: row.guest_last_name || '',
    email: row.guest_email || '',
    hasDataAnomaly,
    phone: row.guest_phone,
    emailSecondary: row.guest_email_secondary || null,
    phoneSecondary: row.guest_phone_secondary || null,
    address: row.guest_address || null,
    postalCode: row.guest_postal_code || null,
    city: row.guest_city || null,
    country: row.guest_country || null,
    organization: row.guest_structure,
    function: row.guest_function,
    afcNumber: row.guest_afc_number || null,
    
    // Réservation
    numPlaces: row.num_places,
    status: row.status as ReservationStatus,
    specialRequests: row.special_requests,
    
    // Check-in
    checkinStatus: row.checkin_status as CheckinStatus | null,
    checkinComment: row.checkin_comment,
    checkinVenueNotes: row.checkin_venue_notes,
    checkinInternalNotes: row.checkin_internal_notes,
    checkinAt: row.checkin_at,
    checkinBy: row.checkin_by,
    
    // Google Calendar
    googleCalendarEventId: row.google_calendar_event_id,

    // Emails post-checkin
    checkinFollowupEmails: (row.checkin_followup_emails ?? []).map((e) => ({
      id: e.id,
      templateKey: e.template_key,
      sentAt: e.sent_at,
      sentBy: e.sent_by,
    })),

    // Timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    
    // Relations
    slot: row.slots ? transformSlot(row.slots) : null,
  };
}

/**
 * Transforme un tableau de rows en AdminReservations
 * 
 * @param rows - Tableau de données brutes Supabase
 * @returns Tableau de réservations formatées
 */
export function transformReservations(rows: ReservationRowWithRelations[]): AdminReservation[] {
  return rows.map(transformReservation);
}

// ============================================
// TRANSFORMERS SLOTS
// ============================================

/**
 * Transforme les données brutes de slot en AvailableSlot
 * Utilisé par getAvailableSlotsForShow
 */
export function transformAvailableSlot(row: {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  venues: { id: string; name: string; city: string } | null;
}): AvailableSlot {
  return {
    id: row.id,
    date: row.date,
    time: row.time.slice(0, 5), // HH:MM:SS → HH:MM
    capacity: row.capacity,
    remainingCapacity: row.remaining_capacity,
    venue: row.venues,
  };
}

/**
 * Transforme un tableau de slots disponibles
 */
export function transformAvailableSlots(rows: Array<{
  id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  venues: { id: string; name: string; city: string } | null;
}>): AvailableSlot[] {
  return rows.map(transformAvailableSlot);
}
