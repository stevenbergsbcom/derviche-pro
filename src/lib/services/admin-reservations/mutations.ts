/**
 * Fonctions de mutation pour le service Admin Reservations
 * Création, modification, annulation, check-in
 * 
 * @module admin-reservations/mutations
 */

import { createClient } from '@/lib/supabase/client';
import { callRpc } from '@/lib/supabase/rpc';
import { logger } from '@/lib/logger';
import type { 
  AdminReservationResult,
  CheckinUpdateData,
  UpdateReservationData,
  CreateAdminReservationData,
  CreateAdminReservationResult,
  RpcResult,
} from './types';
import { ERROR_MESSAGES } from './constants';
import { getAdminReservationById } from './detail';
import { logActivityClient } from '@/lib/services/logs/client';

// ============================================
// CHECK-IN
// ============================================

/**
 * Met à jour le statut check-in d'une réservation
 * 
 * @param id - UUID de la réservation
 * @param checkinData - Données de check-in (statut, commentaires, notes)
 * @returns Réservation mise à jour ou erreur
 * 
 * @example
 * ```ts
 * const result = await updateReservationCheckin('123', {
 *   checkinStatus: 'present_loved',
 *   checkinComment: 'Très intéressé par la programmation',
 * });
 * ```
 */
export async function updateReservationCheckin(
  id: string,
  checkinData: CheckinUpdateData
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        checkin_status: checkinData.checkinStatus,
        checkin_comment: checkinData.checkinComment || null,
        checkin_venue_notes: checkinData.checkinVenueNotes || null,
        checkin_internal_notes: checkinData.checkinInternalNotes || null,
        checkin_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      logger.error(ERROR_MESSAGES.UPDATE_CHECKIN, { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    const result = await getAdminReservationById(id);
    if (result.data) {
      logger.info(`Checkin mis à jour: ${id} → ${checkinData.checkinStatus}`);
      logActivityClient({
        category: 'reservation',
        action: 'reservation_checkin',
        success: true,
        reservation_id: id,
        details: {
          checkin_status: checkinData.checkinStatus,
          guest_name: `${result.data.firstName} ${result.data.lastName}`,
          source: 'admin',
        },
      });
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception updateReservationCheckin', { id, message });
    return { data: null, error: message };
  }
}

// ============================================
// MODIFICATION COMPLÈTE
// ============================================

/**
 * Modifie une réservation complètement (via RPC sécurisée)
 * Gère automatiquement les changements de capacité
 * 
 * @param id - UUID de la réservation
 * @param data - Données à mettre à jour (partielles)
 * @returns Réservation mise à jour ou erreur
 * 
 * @remarks
 * Utilise la fonction RPC `update_reservation_safe` qui :
 * - Vérifie la capacité disponible si changement de slot ou nombre de places
 * - Met à jour les compteurs de capacité automatiquement
 * - Retourne une erreur explicite si capacité insuffisante
 * 
 * @example
 * ```ts
 * const result = await updateReservation('123', {
 *   numPlaces: 3,
 *   slotId: 'new-slot-uuid',
 * });
 * ```
 */
export async function updateReservation(
  id: string,
  data: UpdateReservationData
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    // Appel à la fonction RPC sécurisée
    const { data: result, error: rpcError } = await callRpc<Record<string, unknown>, RpcResult>(
      supabase,
      'update_reservation_safe',
      {
        p_reservation_id: id,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_email: data.email,
        p_phone: data.phone,
        p_email_secondary: data.emailSecondary,
        p_phone_secondary: data.phoneSecondary,
        p_address: data.address,
        p_postal_code: data.postalCode,
        p_city: data.city,
        p_country: data.country ?? null,
        p_organization: data.organization,
        p_function: data.function,
        p_afc_number: data.afcNumber,
        p_num_places: data.numPlaces,
        p_slot_id: data.slotId,
        p_special_requests: data.specialRequests,
        p_checkin_comment: data.checkinComment,
        p_checkin_venue_notes: data.checkinVenueNotes,
        p_checkin_internal_notes: data.checkinInternalNotes,
      },
    );

    if (rpcError) {
      logger.error('Erreur RPC update_reservation_safe', { id, error: rpcError.message });
      return { data: null, error: rpcError.message };
    }

    // Vérifier le résultat de la RPC
    if (!result || !result.success) {
      const errMsg = result?.error || ERROR_MESSAGES.UPDATE_RESERVATION;
      logger.error(ERROR_MESSAGES.UPDATE_RPC_FAIL, { id, error: errMsg });
      return { data: null, error: errMsg };
    }

    // S174 + Session B — IDs CRM Zoho (contact + structure) sur résas guest.
    // Les RPC update_reservation_safe / create_admin_reservation ne connaissent
    // ni `crm_id` (migration 119) ni `crm_structure_id` (migration 122) — ces
    // colonnes n'ont aucune logique de sécurité à porter (pas d'invariant
    // capacité/doublon/lock). On fait donc un UPDATE direct séparé quand le
    // caller envoie un crmId ou crmStructureId (`undefined` = on ne touche pas).
    // Les policies RLS `reservations_update_admin` autorisent ces colonnes pour
    // les admins.
    //
    // Défense en profondeur (retour audit Cursor S174 §3.5) : `.is('user_id', null)`
    // garantit que l'écriture ne s'applique JAMAIS sur une résa de pro connecté,
    // même si un caller programmatique envoyait `crmId` / `crmStructureId` par
    // erreur. La source de vérité pour ce cas reste `profiles.crm_id` et
    // `profiles.crm_structure_id`.
    //
    // Les deux champs sont combinés en un seul `.update({...})` pour éviter
    // deux round-trips quand le formulaire édite les deux à la fois.
    const crmUpdates: { crm_id?: string | null; crm_structure_id?: string | null } = {};
    if (data.crmId !== undefined) crmUpdates.crm_id = data.crmId;
    if (data.crmStructureId !== undefined) crmUpdates.crm_structure_id = data.crmStructureId;
    if (Object.keys(crmUpdates).length > 0) {
      const { error: crmIdError } = await supabase
        .from('reservations')
        .update(crmUpdates)
        .eq('id', id)
        .is('user_id', null);
      if (crmIdError) {
        // Sortie en erreur volontaire (retour audit Cursor S174 §3.1) — la RPC
        // principale est idempotente, l'admin peut retenter sans risque de
        // doubler les changements.
        logger.error('Erreur mise à jour IDs CRM sur résa guest', {
          id,
          error: crmIdError.message,
          fields: Object.keys(crmUpdates),
        });
        return {
          data: null,
          error: "L'ID CRM n'a pas pu être enregistré. Réessayez ; les autres champs sont déjà sauvegardés.",
        };
      }
    }

    // Récupérer la réservation mise à jour
    const updatedResult = await getAdminReservationById(id);
    if (updatedResult.data) {
      logger.info(`Réservation modifiée: ${id}`);
      logActivityClient({
        category: 'reservation',
        action: 'reservation_modify',
        success: true,
        reservation_id: id,
        details: {
          guest_name: `${updatedResult.data.firstName} ${updatedResult.data.lastName}`,
          guest_email: updatedResult.data.email,
          source: 'admin',
        },
      });
    }

    return updatedResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception updateReservation', { id, message });
    return { data: null, error: message };
  }
}

// ============================================
// ANNULATION
// ============================================

/**
 * Annule une réservation
 * 
 * @param id - UUID de la réservation
 * @param reason - Motif d'annulation (optionnel)
 * @returns Réservation annulée ou erreur
 * 
 * @remarks
 * - Met le statut à 'cancelled'
 * - Enregistre la date et le motif d'annulation
 * - La capacité du slot est automatiquement mise à jour via trigger
 * 
 * @example
 * ```ts
 * const result = await cancelReservation('123', 'Demande du programmateur');
 * ```
 */
export async function cancelReservation(
  id: string,
  reason?: string
): Promise<AdminReservationResult> {
  try {
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      })
      .eq('id', id);

    if (updateError) {
      logger.error(ERROR_MESSAGES.CANCEL, { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    const result = await getAdminReservationById(id);
    if (result.data) {
      logger.info(`Réservation annulée: ${id}`);
      logActivityClient({
        category: 'reservation',
        action: 'reservation_cancel',
        success: true,
        reservation_id: id,
        details: {
          guest_name: `${result.data.firstName} ${result.data.lastName}`,
          guest_email: result.data.email,
          reason: reason || null,
          source: 'admin',
        },
      });
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception cancelReservation', { id, message });
    return { data: null, error: message };
  }
}

// ============================================
// CRÉATION
// ============================================

/**
 * Crée une nouvelle réservation depuis l'interface admin
 * Utilise la RPC create_admin_reservation pour traçabilité
 * 
 * @param data - Données de la réservation à créer
 * @returns Succès avec ID ou erreur
 * 
 * @remarks
 * - Vérifie automatiquement la capacité disponible
 * - Détecte les doublons email/slot (règle R-RESA-04)
 * - Enregistre la source comme 'admin' pour traçabilité
 * 
 * @example
 * ```ts
 * const result = await createAdminReservation({
 *   slotId: 'slot-uuid',
 *   numPlaces: 2,
 *   firstName: 'Jean',
 *   lastName: 'Dupont',
 *   email: 'jean.dupont@example.com',
 * });
 * 
 * if (result.success) {
 *   console.log(`Réservation créée: ${result.reservationId}`);
 * }
 * ```
 */
export async function createAdminReservation(
  data: CreateAdminReservationData
): Promise<CreateAdminReservationResult> {
  try {
    const supabase = createClient();

    // Appel à la fonction RPC sécurisée
    const { data: result, error: rpcError } = await callRpc<Record<string, unknown>, RpcResult>(
      supabase,
      'create_admin_reservation',
      {
        p_slot_id: data.slotId,
        p_num_places: data.numPlaces,
        p_first_name: data.firstName.trim(),
        p_last_name: data.lastName.trim(),
        p_email: data.email.trim().toLowerCase(),
        p_phone: data.phone?.trim() || null,
        p_email_secondary: data.emailSecondary?.trim() || null,
        p_phone_secondary: data.phoneSecondary?.trim() || null,
        p_address: data.address?.trim() || null,
        p_postal_code: data.postalCode?.trim() || null,
        p_city: data.city?.trim() || null,
        p_country: data.country?.trim() || null,
        p_organization: data.organization?.trim() || null,
        p_function: data.function?.trim() || null,
        p_afc_number: data.afcNumber?.trim() || null,
        p_comment: data.comment?.trim() || null,
        p_checkin_comment: data.checkinComment?.trim() || null,
        p_checkin_venue_notes: data.checkinVenueNotes?.trim() || null,
        p_checkin_internal_notes: data.checkinInternalNotes?.trim() || null,
      },
    );

    if (rpcError) {
      logger.error('Erreur RPC create_admin_reservation', { error: rpcError.message });
      return { success: false, error: rpcError.message };
    }

    if (!result || !result.success) {
      const errMsg = result?.error || 'Erreur lors de la création';
      logger.error(ERROR_MESSAGES.CREATE_RPC_FAIL, { error: errMsg });
      return { success: false, error: errMsg };
    }

    // S174 + Session B — Si un ID CRM Zoho (contact ou structure) a été
    // fourni à la création, on l'écrit dans la foulée via un UPDATE direct
    // (la RPC create_admin_reservation ne connaît ni crm_id ni
    // crm_structure_id, ajoutés en migrations 119 et 122).
    //
    // NB : volontairement NON-BLOQUANT ici, contrairement à updateReservation.
    // Convertir cette erreur en échec retournerait `success: false` au caller
    // alors que la résa a déjà été créée → l'admin retenterait → DOUBLON.
    // S175 — En cas d'échec, on remonte un `warning` distinct du `error`
    // pour que la page puisse afficher un toast d'info à l'admin tout en
    // gardant le `success: true`.
    let crmIdWarning: string | undefined;
    const trimmedCrmId =
      data.crmId !== undefined && data.crmId !== null && data.crmId.trim() !== ''
        ? data.crmId.trim()
        : undefined;
    const trimmedCrmStructureId =
      data.crmStructureId !== undefined &&
      data.crmStructureId !== null &&
      data.crmStructureId.trim() !== ''
        ? data.crmStructureId.trim()
        : undefined;

    if (result.reservation_id && (trimmedCrmId !== undefined || trimmedCrmStructureId !== undefined)) {
      const crmUpdates: { crm_id?: string; crm_structure_id?: string } = {};
      if (trimmedCrmId !== undefined) crmUpdates.crm_id = trimmedCrmId;
      if (trimmedCrmStructureId !== undefined) crmUpdates.crm_structure_id = trimmedCrmStructureId;

      const { error: crmIdError } = await supabase
        .from('reservations')
        .update(crmUpdates)
        .eq('id', result.reservation_id)
        .is('user_id', null);
      if (crmIdError) {
        logger.error('Erreur écriture IDs CRM à la création (non-bloquante : résa déjà créée)', {
          reservationId: result.reservation_id,
          error: crmIdError.message,
          fields: Object.keys(crmUpdates),
        });
        crmIdWarning =
          "L'ID CRM n'a pas été enregistré. La réservation est créée — vous pouvez le renseigner via le dialog d'édition.";
      }
    }

    logger.info('Réservation admin créée', { reservationId: result.reservation_id });
    logActivityClient({
      category: 'reservation',
      action: 'reservation_create',
      success: true,
      reservation_id: result.reservation_id,
      details: {
        guest_name: `${data.firstName} ${data.lastName}`,
        guest_email: data.email,
        slot_id: data.slotId,
        num_places: data.numPlaces,
        source: 'admin',
      },
    });
    return {
      success: true,
      reservationId: result.reservation_id,
      ...(crmIdWarning ? { warning: crmIdWarning } : {}),
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception createAdminReservation', { message });
    return { success: false, error: message };
  }
}
