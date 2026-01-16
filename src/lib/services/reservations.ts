/**
 * Service Reservations - Création et gestion des réservations
 * Derviche Diffusion
 * 
 * Gère la création de réservations pour les visiteurs (connectés ou non)
 * et la mise à jour des capacités des créneaux.
 */

import { createClient } from '@/lib/supabase/client';
import type { ReservationInsert, ReservationRow } from '@/types/database';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Données du formulaire de réservation public */
export interface PublicReservationFormData {
  firstName: string;
  lastName: string;
  email: string;
  emailSecondary?: string;
  phone: string;
  phoneSecondary?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  organization?: string;
  function?: string;
  comment?: string;
}

/** Données pour créer une réservation */
export interface CreateReservationData {
  slotId: string;
  numPlaces: number;
  formData: PublicReservationFormData;
  /** ID utilisateur si connecté (null pour guest) */
  userId?: string | null;
}

/** Résultat de la création de réservation */
export interface CreateReservationResult {
  success: boolean;
  data?: {
    reservationId: string;
    code: string;
  };
  error?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Générer un code de réservation lisible
 * Format: DD-XXXXXX (6 caractères alphanumériques)
 */
function generateReservationCode(reservationId: string): string {
  // Prendre les 6 premiers caractères de l'UUID (sans tirets)
  const shortId = reservationId.replace(/-/g, '').substring(0, 6).toUpperCase();
  return `DD-${shortId}`;
}

// ============================================
// SERVICE PRINCIPAL
// ============================================

/**
 * Créer une nouvelle réservation
 * 
 * Cette fonction:
 * 1. Vérifie que le créneau a assez de places disponibles
 * 2. Crée la réservation dans la table reservations
 * 3. Décrémente remaining_capacity du slot
 * 4. Retourne l'ID et le code de réservation
 * 
 * @param data - Données de la réservation
 * @returns Résultat avec l'ID de réservation ou une erreur
 */
export async function createReservation(
  data: CreateReservationData
): Promise<CreateReservationResult> {
  const { slotId, numPlaces, formData, userId } = data;

  logger.info('[reservations] Création réservation', { 
    slotId, 
    numPlaces, 
    email: formData.email 
  });

  try {
    // Obtenir le client Supabase
    const supabase = createClient();

    // ============================================
    // 1. Vérifier la capacité du créneau
    // ============================================
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('id, remaining_capacity, capacity')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      logger.error('[reservations] Créneau non trouvé', { slotId, error: slotError });
      return {
        success: false,
        error: 'Ce créneau n\'existe pas ou n\'est plus disponible.',
      };
    }

    // Vérifier la capacité (999999 = illimité)
    const isUnlimited = slot.capacity >= 999999;
    const hasEnoughCapacity = isUnlimited || slot.remaining_capacity >= numPlaces;

    if (!hasEnoughCapacity) {
      logger.warn('[reservations] Capacité insuffisante', {
        slotId,
        requested: numPlaces,
        remaining: slot.remaining_capacity,
      });
      return {
        success: false,
        error: `Il ne reste que ${slot.remaining_capacity} place(s) disponible(s) pour ce créneau.`,
      };
    }

    // ============================================
    // 2. Créer la réservation
    // ============================================
    const reservationData: ReservationInsert = {
      slot_id: slotId,
      user_id: userId || null,
      num_places: numPlaces,
      status: 'confirmed',
      // Infos guest
      guest_first_name: formData.firstName.trim(),
      guest_last_name: formData.lastName.trim(),
      guest_email: formData.email.trim().toLowerCase(),
      guest_phone: formData.phone.trim() || null,
      guest_function: formData.function?.trim() || null,
      guest_structure: formData.organization?.trim() || null,
      // Champs secondaires
      guest_email_secondary: formData.emailSecondary?.trim() || null,
      guest_phone_secondary: formData.phoneSecondary?.trim() || null,
      guest_address: formData.address?.trim() || null,
      guest_postal_code: formData.postalCode?.trim() || null,
      guest_city: formData.city?.trim() || null,
      // Commentaires
      special_requests: formData.comment?.trim() || null,
    };

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select('id')
      .single();

    if (reservationError || !reservation) {
      logger.error('[reservations] Erreur création réservation', { 
        error: reservationError 
      });
      return {
        success: false,
        error: 'Une erreur est survenue lors de la création de votre réservation. Veuillez réessayer.',
      };
    }

    // ============================================
    // 3. Décrémenter la capacité du créneau
    // ============================================
    // On ne décrémente pas si capacité illimitée
    if (!isUnlimited) {
      const newRemainingCapacity = slot.remaining_capacity - numPlaces;

      const { error: updateError } = await supabase
        .from('slots')
        .update({ remaining_capacity: newRemainingCapacity })
        .eq('id', slotId);

      if (updateError) {
        logger.error('[reservations] Erreur mise à jour capacité', { 
          slotId, 
          error: updateError 
        });
        // Note: On ne fait pas de rollback ici car la réservation est créée
        // En production, on utiliserait une transaction ou une fonction RPC
      }

      logger.info('[reservations] Capacité mise à jour', {
        slotId,
        oldCapacity: slot.remaining_capacity,
        newCapacity: newRemainingCapacity,
      });
    }

    // ============================================
    // 4. Retourner le succès
    // ============================================
    const code = generateReservationCode(reservation.id);

    logger.info('[reservations] Réservation créée avec succès', {
      reservationId: reservation.id,
      code,
    });

    return {
      success: true,
      data: {
        reservationId: reservation.id,
        code,
      },
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[reservations] Exception création réservation', { error: message });
    return {
      success: false,
      error: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    };
  }
}

/**
 * Récupérer une réservation par son ID
 * Utile pour la page de confirmation
 */
export async function getReservationById(
  reservationId: string
): Promise<{ data: ReservationRow | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error) {
      logger.error('[reservations] Erreur lecture réservation', { 
        reservationId, 
        error 
      });
      return { data: null, error: 'Réservation non trouvée.' };
    }

    return { data: data as ReservationRow, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { data: null, error: message };
  }
}
