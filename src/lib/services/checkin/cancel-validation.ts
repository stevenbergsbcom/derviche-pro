/**
 * Validation et permission checking pour Cancel/Reactivate
 * Derviche Diffusion
 *
 * Logique de validation des r\u00e9servations avant annulation ou r\u00e9activation.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';

import { canAccessSlot } from './shows';

/**
 * R\u00e9sultat de la validation d'annulation
 */
export interface CancelValidationResult {
  valid: boolean;
  error: string | null;
  reservation: { id: string; slot_id: string; status: string } | null;
}

/**
 * R\u00e9sultat de la validation de r\u00e9activation (inclut les infos du slot)
 */
export interface ReactivateValidationResult {
  valid: boolean;
  error: string | null;
  reservation: {
    id: string;
    slot_id: string;
    num_places: number;
    status: string;
    slots: { id: string; capacity: number; remaining_capacity: number };
  } | null;
}

/**
 * Valide qu'une r\u00e9servation peut \u00eatre annul\u00e9e :
 * - Existe
 * - Est confirm\u00e9e
 * - L'utilisateur a acc\u00e8s au slot
 */
export async function validateCancelReservation(
  reservationId: string,
  userId: string,
  role: UserRole,
  companyId: string | null = null
): Promise<CancelValidationResult> {
  const supabase = createClient();

  // 1. R\u00e9cup\u00e9rer la r\u00e9servation
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('id, slot_id, status')
    .eq('id', reservationId)
    .single();

  if (fetchError || !reservation) {
    logger.warn('checkin.cancelReservationFromPWA - R\u00e9servation non trouv\u00e9e', {
      reservationId,
      error: fetchError,
    });
    return {
      valid: false,
      error: 'R\u00e9servation non trouv\u00e9e',
      reservation: null,
    };
  }

  // 2. V\u00e9rifier que la r\u00e9servation est bien confirm\u00e9e
  if (reservation.status !== 'confirmed') {
    logger.warn('checkin.cancelReservationFromPWA - R\u00e9servation non confirm\u00e9e', {
      reservationId,
      status: reservation.status,
    });
    return {
      valid: false,
      error: 'Cette r\u00e9servation n\'est pas confirm\u00e9e',
      reservation: null,
    };
  }

  // 3. V\u00e9rifier l'acc\u00e8s au slot
  const hasAccess = await canAccessSlot(
    reservation.slot_id,
    userId,
    role,
    companyId
  );

  if (!hasAccess) {
    logger.warn('checkin.cancelReservationFromPWA - Acc\u00e8s refus\u00e9', {
      reservationId,
      slotId: reservation.slot_id,
      userId,
    });
    return {
      valid: false,
      error: 'Acc\u00e8s non autoris\u00e9 \u00e0 cette repr\u00e9sentation',
      reservation: null,
    };
  }

  return { valid: true, error: null, reservation };
}

/**
 * Valide qu'une r\u00e9servation peut \u00eatre r\u00e9activ\u00e9e :
 * - Existe
 * - Est annul\u00e9e
 * - L'utilisateur a acc\u00e8s au slot
 */
export async function validateReactivateReservation(
  reservationId: string,
  userId: string,
  role: UserRole,
  companyId: string | null = null
): Promise<ReactivateValidationResult> {
  const supabase = createClient();

  // 1. R\u00e9cup\u00e9rer la r\u00e9servation avec les infos du slot
  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select(`
      id,
      slot_id,
      num_places,
      status,
      slots!inner (
        id,
        capacity,
        remaining_capacity
      )
    `)
    .eq('id', reservationId)
    .single();

  if (fetchError || !reservation) {
    logger.warn('checkin.reactivateReservation - R\u00e9servation non trouv\u00e9e', {
      reservationId,
      error: fetchError,
    });
    return {
      valid: false,
      error: 'R\u00e9servation non trouv\u00e9e',
      reservation: null,
    };
  }

  // 2. V\u00e9rifier que la r\u00e9servation est bien annul\u00e9e
  if (reservation.status !== 'cancelled') {
    logger.warn('checkin.reactivateReservation - R\u00e9servation non annul\u00e9e', {
      reservationId,
      status: reservation.status,
    });
    return {
      valid: false,
      error: 'Cette r\u00e9servation n\'est pas annul\u00e9e',
      reservation: null,
    };
  }

  // 3. V\u00e9rifier l'acc\u00e8s au slot
  const hasAccess = await canAccessSlot(
    reservation.slot_id,
    userId,
    role,
    companyId
  );

  if (!hasAccess) {
    logger.warn('checkin.reactivateReservation - Acc\u00e8s refus\u00e9', {
      reservationId,
      slotId: reservation.slot_id,
      userId,
    });
    return {
      valid: false,
      error: 'Acc\u00e8s non autoris\u00e9 \u00e0 cette repr\u00e9sentation',
      reservation: null,
    };
  }

  // Cast slots pour le typage
  const slots = reservation.slots as unknown as {
    id: string;
    capacity: number;
    remaining_capacity: number;
  };

  return {
    valid: true,
    error: null,
    reservation: {
      id: reservation.id,
      slot_id: reservation.slot_id,
      num_places: reservation.num_places,
      status: reservation.status,
      slots,
    },
  };
}
