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
  cancelReservation: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
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
        return { success: true };
      } else {
        logger.error('useProReservations: erreur annulation', { id, error: result.error });
        setIsCancelling(false);
        return { success: false, error: result.error };
      }
    },
    []
  );

  return {
    reservations,
    isLoading,
    error,
    isCancelling,
    cancelReservation,
    refresh,
  };
}
