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
  BookedBy,
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
 * Dérive le `BookedBy` décrivant qui a créé la réservation, en examinant
 * les jointures `created_by` / `booked_by` + le champ `source`.
 *
 * Règles (ordre de priorité) :
 *  1. Rôle explicite admin/super-admin/externe sur `created_by.user_roles`
 *     → kind: 'admin'
 *  2. `source === 'admin'` avec `created_by` présent (fallback RLS) :
 *     un viewer `admin` ne peut pas lire les lignes `user_roles` des
 *     `super-admin` (policy `user_roles_select_admin`, migration 005).
 *     Dans ce cas `role` est undefined mais on sait que c'est un
 *     back-office → kind: 'admin' avec role générique.
 *     → kind: 'admin'
 *  3. `created_by` pointe vers un profil avec `company_id` renseigné
 *     → kind: 'company' (cf. migration 113)
 *  4. `booked_by` est renseigné (pro connecté qui a réservé pour lui-même)
 *     → kind: 'pro'
 *  5. Sinon → kind: 'anonymous'
 *
 * NB : Supabase renvoie parfois `user_roles` / `company` en array (1:N
 * PostgREST) alors qu'on a une relation 1:1 → on normalise.
 */
function deriveBookedBy(row: ReservationRowWithRelations): BookedBy {
  const createdBy = row.created_by ?? null;
  const bookedBy = row.booked_by ?? null;

  // Extraire le rôle (handle array OR object)
  const roleRaw = createdBy?.user_roles;
  const role = Array.isArray(roleRaw) ? roleRaw[0]?.role : roleRaw?.role;

  // Extraire la compagnie (handle array OR object)
  const companyRaw = createdBy?.company;
  const company = Array.isArray(companyRaw) ? companyRaw[0] : companyRaw;

  // 1. Admin / super-admin / externe — rôle explicite lisible
  if (role && (role === 'super-admin' || role === 'admin' || role === 'externe')) {
    return {
      kind: 'admin',
      firstName: createdBy?.first_name ?? null,
      lastName: createdBy?.last_name ?? null,
      role,
    };
  }

  // 2. Fallback back-office : source='admin' + created_by existe mais
  //    user_roles non lisible (RLS). Classe en admin avec role générique
  //    « back-office » pour éviter un faux-positif company/pro.
  if (row.source === 'admin' && createdBy) {
    return {
      kind: 'admin',
      firstName: createdBy.first_name ?? null,
      lastName: createdBy.last_name ?? null,
      role: 'back-office',
    };
  }

  // 3. Compagnie — migration 113
  if (company && company.id && company.name) {
    return { kind: 'company', id: company.id, name: company.name };
  }

  // 4. Pro connecté (user_id set, pas d'admin/compagnie ci-dessus)
  if (bookedBy) {
    return {
      kind: 'pro',
      firstName: bookedBy.first_name ?? null,
      lastName: bookedBy.last_name ?? null,
    };
  }

  // 5. Visiteur anonyme
  return { kind: 'anonymous' };
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
    // S174 — ID CRM Zoho :
    //   - résa guest (user_id IS NULL) → valeur stockée sur reservations.crm_id
    //     (éditable depuis le dialog d'édition de la résa).
    //   - résa avec compte (user_id renseigné) → valeur héritée du profil pro
    //     via la jointure `booked_by:user_id (crm_id)`. Lecture seule côté UI.
    crmId:
      row.user_id === null
        ? (row.crm_id ?? null)
        : (row.booked_by?.crm_id ?? null),


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

    // Traçabilité « qui a créé cette réservation » — discriminated union
    // couvrant les 4 scénarios (anonymous / pro / company / admin).
    bookedBy: deriveBookedBy(row),

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
