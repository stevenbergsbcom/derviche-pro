/**
 * Fonctions de validation Transfer pour le service Check-in
 * Derviche Diffusion
 *
 * Récupération des créneaux cibles disponibles pour le transfert.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy } from '@/types/database';

import type {
  TransferTargetSlot,
  TransferTargetSlotsResult,
} from './types';
import { isValidVenue, isValidShow, isValidHostedBy } from './guards';
import { canAccessSlot } from './shows';

/**
 * Récupère les créneaux disponibles pour le transfert d'une réservation
 * Retourne tous les créneaux du même spectacle (sauf le créneau actuel)
 * avec indication si l'invité a déjà une réservation sur chaque créneau
 */
export async function getTransferTargetSlots(
  reservationId: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<TransferTargetSlotsResult> {
  try {
    logger.info('checkin.getTransferTargetSlots - Début', { reservationId, userId, role });

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id actuel ET l'email de l'invité
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        status,
        guest_email,
        slots!inner (
          id,
          show_id,
          shows!inner (
            slug
          )
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.getTransferTargetSlots - Réservation non trouvée', { reservationId });
      return { data: [], error: 'Réservation non trouvée' };
    }

    // 2. Vérifier l'accès au slot source
    const hasAccess = await canAccessSlot(reservation.slot_id, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.getTransferTargetSlots - Accès refusé');
      return { data: [], error: 'Accès non autorisé à cette réservation' };
    }

    // Extraire les infos du slot
    const sourceSlot = reservation.slots as unknown as {
      id: string;
      show_id: string;
      shows: { slug: string }
    };

    if (!sourceSlot?.shows?.slug) {
      logger.error('checkin.getTransferTargetSlots - Données slot invalides');
      return { data: [], error: 'Erreur interne: données invalides' };
    }

    // 3. Récupérer tous les slots du même spectacle
    const { data: allSlots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        capacity,
        remaining_capacity,
        hosted_by,
        hosted_by_id,
        venues (
          id,
          name,
          city
        ),
        shows!inner (
          id,
          slug,
          title
        ),
        reservations (
          id,
          status,
          checkin_status,
          guest_email
        )
      `)
      .eq('show_id', sourceSlot.show_id)
      .neq('id', reservation.slot_id) // Exclure le slot actuel
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      logger.error('checkin.getTransferTargetSlots - Erreur Supabase', { error: slotsError });
      return { data: [], error: slotsError.message };
    }

    if (!allSlots || allSlots.length === 0) {
      return { data: [], error: null };
    }

    // Normaliser l'email de l'invité pour la comparaison
    const guestEmailNormalized = reservation.guest_email?.toLowerCase().trim() || null;

    // 4. Transformer les données
    const slots: TransferTargetSlot[] = [];

    for (const slot of allSlots) {
      // Valider le venue
      const venue = isValidVenue(slot.venues)
        ? { id: slot.venues.id, name: slot.venues.name, city: (slot.venues as { city?: string }).city || '' }
        : { id: '', name: 'Lieu inconnu', city: '' };

      // Valider le show
      if (!isValidShow(slot.shows)) continue;
      const show = slot.shows;

      // Valider hosted_by
      const hostedBy: SlotHostedBy = isValidHostedBy(slot.hosted_by)
        ? slot.hosted_by
        : 'derviche';

      // Compter les réservations
      const reservations = Array.isArray(slot.reservations) ? slot.reservations : [];
      const confirmedReservations = reservations.filter(
        (r): r is { id: string; status: string; checkin_status: string | null; guest_email: string | null } =>
          typeof r === 'object' && r !== null && (r as { status?: unknown }).status === 'confirmed'
      );
      const confirmedCount = confirmedReservations.length;
      const checkedInCount = confirmedReservations.filter(
        (r) =>
          r.checkin_status !== null &&
          r.checkin_status !== 'absent'
      ).length;

      // Vérifier si l'invité a déjà une réservation confirmée sur ce créneau
      const hasExistingGuestReservation = guestEmailNormalized
        ? confirmedReservations.some(
            (r) => r.guest_email?.toLowerCase().trim() === guestEmailNormalized
          )
        : false;

      slots.push({
        id: slot.id,
        date: slot.date,
        time: slot.time,
        capacity: slot.capacity,
        remainingCapacity: slot.remaining_capacity,
        hostedBy,
        hostedById: slot.hosted_by_id,
        venue,
        show: {
          id: show.id,
          slug: show.slug,
          title: show.title,
        },
        confirmedCount,
        checkedInCount,
        hasExistingGuestReservation,
      });
    }

    logger.info('checkin.getTransferTargetSlots - Succès', { count: slots.length });
    return { data: slots, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getTransferTargetSlots - Exception', { error: message });
    return { data: [], error: 'Une erreur inattendue est survenue' };
  }
}
