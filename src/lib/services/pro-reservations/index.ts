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
interface UpdateReservationRpcResult {
  success: boolean;
  error?: string;
}

/**
 * Type guard pour valider le résultat de la RPC update_reservation_safe
 * Évite un simple cast (result as RpcResult) non vérifié
 */
function isUpdateReservationRpcResult(val: unknown): val is UpdateReservationRpcResult {
  return (
    typeof val === 'object' &&
    val !== null &&
    'success' in val &&
    typeof (val as Record<string, unknown>).success === 'boolean'
  );
}

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
      slug,
      companies:company_id (
        name
      )
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
  shows: { id: string; title: string; slug: string | null; companies: { name: string } | null };
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

/**
 * Récupère les créneaux disponibles d'un spectacle (hors créneau actuel de la résa)
 * Filtre uniquement les créneaux futurs avec de la capacité restante
 *
 * @param showId - UUID du spectacle
 * @param currentSlotId - UUID du créneau actuel (exclu des résultats)
 * @param numPlaces - Nombre de places nécessaires (filtre sur remaining_capacity)
 */
export async function getProAvailableSlotsForShow(
  showId: string,
  currentSlotId: string,
  numPlaces: number
): Promise<ProAvailableSlotsResult> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        remaining_capacity,
        venues (
          name,
          city
        )
      `)
      .eq('show_id', showId)
      .neq('id', currentSlotId)
      .gte('date', today)
      .gte('remaining_capacity', numPlaces)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('Erreur chargement créneaux disponibles', { showId, error: error.message });
      return { data: null, error: error.message };
    }

    interface RawAvailableSlot {
      id: string;
      date: string;
      time: string;
      remaining_capacity: number;
      venues: { name: string; city: string } | null;
    }

    const slots: ProAvailableSlot[] = ((data ?? []) as unknown as RawAvailableSlot[]).map((s) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      remaining_capacity: s.remaining_capacity,
      venue_name: s.venues?.name ?? null,
      venue_city: s.venues?.city ?? null,
    }));

    return { data: slots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getProAvailableSlotsForShow', { showId, message });
    return { data: null, error: message };
  }
}

/**
 * Change le créneau d'une réservation appartenant au programmateur connecté
 * Utilise la RPC update_reservation_safe (gère la capacité automatiquement)
 *
 * @param reservationId - UUID de la réservation à modifier
 * @param newSlotId - UUID du nouveau créneau
 */
export async function changeMyReservationSlot(
  reservationId: string,
  newSlotId: string
): Promise<ChangeSlotResult> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour modifier une réservation.' };
    }

    // Vérifier que la réservation appartient bien au user et est modifiable
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, slot_id')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      logger.warn('Tentative modification réservation introuvable ou non autorisée', {
        reservationId,
        userId: user.id,
      });
      return { success: false, error: 'Réservation introuvable ou accès non autorisé.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Impossible de modifier une réservation annulée.' };
    }

    if (existing.slot_id === newSlotId) {
      return { success: false, error: 'Vous êtes déjà inscrit sur ce créneau.' };
    }

    // Appel à la RPC sécurisée qui gère la capacité
    // update_reservation_safe n'est pas dans les types DB générés — cast via unknown + type guard sur le retour
    const { data: result, error: rpcError } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>)('update_reservation_safe', {
      p_reservation_id: reservationId,
      p_slot_id: newSlotId,
      // Tous les autres champs à null = conservés tels quels par la RPC
      p_first_name: null,
      p_last_name: null,
      p_email: null,
      p_phone: null,
      p_email_secondary: null,
      p_phone_secondary: null,
      p_address: null,
      p_postal_code: null,
      p_city: null,
      p_organization: null,
      p_function: null,
      p_afc_number: null,
      p_num_places: null,
      p_special_requests: null,
      p_checkin_comment: null,
      p_checkin_venue_notes: null,
      p_checkin_internal_notes: null,
    });

    if (rpcError) {
      logger.error('Erreur RPC changeMyReservationSlot', { reservationId, error: rpcError.message });
      return { success: false, error: rpcError.message };
    }

    // Valider le résultat via type guard au lieu d'un cast aveugle
    if (!isUpdateReservationRpcResult(result)) {
      logger.error('RPC update_reservation_safe : réponse inattendue', { reservationId, result });
      return { success: false, error: 'Réponse serveur inattendue.' };
    }

    if (!result.success) {
      logger.error('RPC update_reservation_safe échouée (pro)', { reservationId, error: result.error });
      return { success: false, error: result.error ?? 'Erreur lors de la modification.' };
    }

    logger.info('Créneau modifié par le pro', { reservationId, newSlotId, userId: user.id });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception changeMyReservationSlot', { reservationId, message });
    return { success: false, error: message };
  }
}

/**
 * Rapatrie les réservations guest sélectionnées vers le compte de l'utilisateur connecté
 * La RPC vérifie que l'email et le user_id correspondent bien au compte authentifié
 *
 * @param userId - UUID de l'utilisateur connecté
 * @param email - Email de l'utilisateur (doit correspondre à son compte)
 * @param reservationIds - Liste des IDs de réservations à rapatrier
 */
export async function claimSelectedReservations(
  userId: string,
  email: string,
  reservationIds: string[]
): Promise<ClaimReservationsResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('claim_selected_reservations', {
      p_user_id: userId,
      p_email: email,
      p_reservation_ids: reservationIds,
    });

    if (error) {
      logger.error('Erreur rapatriement réservations guest', { error: error.message });
      return { claimed: 0, error: error.message };
    }

    const claimed = typeof data === 'number' ? data : 0;
    logger.info('Réservations guest rapatriées', { userId, count: claimed });
    return { claimed, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception claimSelectedReservations', { message });
    return { claimed: 0, error: message };
  }
}
