/**
 * Fonctions de lecture des réservations professionnelles
 *
 * @module pro-reservations/list
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type {
  ProReservation,
  ProReservationStatus,
  ProReservationResult,
  GetGuestReservationsResult,
  GuestReservation,
  RawReservation,
} from './types';

// ============================================
// QUERY
// ============================================

const PRO_RESERVATION_SELECT = `
  id,
  status,
  num_places,
  created_at,
  cancelled_at,
  cancellation_reason,
  slot_date,
  slot_time,
  slots!inner (
    id,
    date,
    time,
    venues (
      name,
      city
    ),
    shows!inner (
      id,
      title,
      slug,
      companies:company_id (
        name
      )
    )
  )
` as const;

// ============================================
// TRANSFORMATEUR
// ============================================

function transformReservation(raw: RawReservation): ProReservation {
  return {
    id: raw.id,
    status: raw.status as ProReservationStatus,
    num_places: raw.num_places,
    created_at: raw.created_at,
    cancelled_at: raw.cancelled_at,
    cancellation_reason: raw.cancellation_reason,
    show_title: raw.slots.shows.title,
    show_slug: raw.slots.shows.slug,
    show_id: raw.slots.shows.id,
    show_company_name: raw.slots.shows.companies?.name ?? null,
    slot: {
      id: raw.slots.id,
      date: raw.slots.date,
      time: raw.slots.time,
      venue_name: raw.slots.venues?.name ?? null,
      venue_city: raw.slots.venues?.city ?? null,
    },
  };
}

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Récupère toutes les réservations du programmateur connecté
 * La RLS Supabase garantit que seules ses réservations sont retournées
 */
export async function getMyReservations(): Promise<ProReservationResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select(PRO_RESERVATION_SELECT)
      // Tri par date de représentation (colonnes dénormalisées migration 080)
      // Supabase JS ne peut pas trier sur une table jointe via .order({ referencedTable })
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true });

    if (error) {
      logger.error('Erreur chargement réservations pro', { error: error.message });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: [], error: null };
    }

    const reservations = (data as unknown as RawReservation[]).map(transformReservation);

    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getMyReservations', { message });
    return { data: null, error: message };
  }
}

/**
 * Récupère les réservations guest orphelines associées à l'email de l'utilisateur connecté
 * Appelle la RPC get_guest_reservations qui vérifie que l'email correspond bien au compte
 */
export async function getGuestReservations(email: string): Promise<GetGuestReservationsResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_guest_reservations', {
      p_email: email,
    });

    if (error) {
      logger.error('Erreur récupération réservations guest', { error: error.message });
      return { data: null, error: error.message };
    }

    return { data: (data as unknown as GuestReservation[]) ?? [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getGuestReservations', { message });
    return { data: null, error: message };
  }
}
