/**
 * Service des réservations pour l'espace professionnel
 * Permet à un programmateur connecté de consulter et annuler ses propres réservations
 *
 * @module pro-reservations
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

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

export interface ProReservation {
  id: string;
  status: ProReservationStatus;
  num_places: number;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  show_title: string;
  show_slug: string | null;
  slot: ProReservationSlot;
}

export type ProReservationResult =
  | { data: ProReservation[]; error: null }
  | { data: null; error: string };

export type CancelResult =
  | { success: true }
  | { success: false; error: string };

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
      slug
    )
  )
` as const;

// ============================================
// TYPE INTERNE POUR LES DONNÉES BRUTES SUPABASE
// ============================================

interface RawSlot {
  id: string;
  date: string;
  time: string;
  venues: { name: string; city: string } | null;
  shows: { id: string; title: string; slug: string | null };
}

interface RawReservation {
  id: string;
  status: string;
  num_places: number;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  slots: RawSlot;
}

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
      .order('created_at', { ascending: false });

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
 * Annule une réservation appartenant au programmateur connecté
 * La clause user_id = auth.uid() empêche l'annulation de réservations tierces
 *
 * @param id - UUID de la réservation à annuler
 * @param reason - Motif d'annulation (optionnel)
 */
export async function cancelMyReservation(
  id: string,
  reason?: string
): Promise<CancelResult> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour annuler une réservation.' };
    }

    // Vérifier que la réservation existe, appartient au user et est annulable
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      logger.warn('Tentative annulation réservation introuvable ou non autorisée', { id, userId: user.id });
      return { success: false, error: 'Réservation introuvable ou accès non autorisé.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Cette réservation est déjà annulée.' };
    }

    // Annulation effective
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('Erreur annulation réservation pro', { id, error: updateError.message });
      return { success: false, error: updateError.message };
    }

    logger.info('Réservation annulée par le pro', { id, userId: user.id });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception cancelMyReservation', { id, message });
    return { success: false, error: message };
  }
}
