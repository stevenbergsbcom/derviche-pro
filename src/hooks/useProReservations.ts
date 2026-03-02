/**
 * Hook pour les réservations du programmateur connecté
 * Gère le chargement, le rafraîchissement et l'annulation
 *
 * @module hooks/useProReservations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMyReservations,
  cancelMyReservation,
  changeMyReservationSlot,
  type ProReservation,
} from '@/lib/services/pro-reservations';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface UseProReservationsResult {
  reservations: ProReservation[];
  isLoading: boolean;
  error: string | null;
  isCancelling: boolean;
  isChangingSlot: boolean;
  cancelReservation: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  changeSlot: (reservationId: string, newSlotId: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => void;
}

// ============================================
// HOOK
// ============================================

export function useProReservations(): UseProReservationsResult {
  const [reservations, setReservations] = useState<ProReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChangingSlot, setIsChangingSlot] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getMyReservations();

    if (result.error) {
      logger.error('useProReservations: erreur chargement', { error: result.error });
      setError(result.error);
    } else {
      setReservations(result.data ?? []);
    }

    setIsLoading(false);
  }, []);

  // Chargement initial
  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  const cancelReservation = useCallback(
    async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
      setIsCancelling(true);

      const result = await cancelMyReservation(id, reason);

      if (result.success) {
        logger.info('useProReservations: réservation annulée', { id });
        // Mettre à jour localement pour éviter un re-fetch complet
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'cancelled' as const,
                  cancelled_at: new Date().toISOString(),
                  cancellation_reason: reason ?? null,
                }
              : r
          )
        );
        setIsCancelling(false);

        // Envoyer l'email d'annulation de façon non-bloquante
        fetch('/api/emails/send-cancellation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId: id }),
        }).catch((err) => {
          logger.warn('useProReservations: échec envoi email annulation (non-bloquant)', {
            id,
            error: err instanceof Error ? err.message : 'Erreur inconnue',
          });
        });

        return { success: true };
      } else {
        logger.error('useProReservations: erreur annulation', { id, error: result.error });
        setIsCancelling(false);
        return { success: false, error: result.error };
      }
    },
    []
  );

  const changeSlot = useCallback(
    async (reservationId: string, newSlotId: string): Promise<{ success: boolean; error?: string }> => {
      setIsChangingSlot(true);

      // Conserver l'ancien slot_id avant modification (pour l'email)
      const currentReservation = reservations.find((r) => r.id === reservationId);
      const oldSlotId = currentReservation?.slot.id;

      const result = await changeMyReservationSlot(reservationId, newSlotId);

      if (result.success) {
        logger.info('useProReservations: créneau modifié', { reservationId, newSlotId });

        // Rafraîchir la liste pour obtenir les nouvelles données du créneau
        await load();
        setIsChangingSlot(false);

        // Envoyer l'email de modification de façon non-bloquante
        if (oldSlotId) {
          fetch('/api/emails/send-modification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId, oldSlotId }),
          }).catch((err) => {
            logger.warn('useProReservations: échec envoi email modification (non-bloquant)', {
              reservationId,
              error: err instanceof Error ? err.message : 'Erreur inconnue',
            });
          });
        }

        return { success: true };
      } else {
        logger.error('useProReservations: erreur modification créneau', {
          reservationId,
          error: result.error,
        });
        setIsChangingSlot(false);
        return { success: false, error: result.error };
      }
    },
    [reservations, load]
  );

  return {
    reservations,
    isLoading,
    error,
    isCancelling,
    isChangingSlot,
    cancelReservation,
    changeSlot,
    refresh,
  };
}
