/**
 * Hook pour le rapatriement des réservations guest
 * Détecte les réservations orphelines (guest_email = user.email, user_id IS NULL)
 * et permet à l'utilisateur de choisir celles qu'il souhaite récupérer.
 *
 * Comportement :
 * - Détection automatique silencieuse au montage
 * - Bannière Dismissible : si l'utilisateur ferme sans agir, elle réapparaît à la prochaine session
 * - Une seule détection par montage de composant (useRef hasClaimed)
 *
 * @module hooks/useGuestReservationsClaim
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getGuestReservations,
  claimSelectedReservations,
  type GuestReservation,
} from '@/lib/services/pro-reservations';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

export interface UseGuestReservationsClaimResult {
  /** Réservations guest orphelines disponibles pour rapatriement */
  guestReservations: GuestReservation[];
  /** Détection en cours */
  isDetecting: boolean;
  /** Rapatriement en cours */
  isClaiming: boolean;
  /** IDs sélectionnés par l'utilisateur */
  selectedIds: Set<string>;
  /** Bannière visible (false si l'utilisateur a fermé ou s'il n'y a rien à rapatrier) */
  isBannerVisible: boolean;
  /** Bascule la sélection d'une réservation */
  toggleSelection: (id: string) => void;
  /** Sélectionne ou désélectionne tout */
  toggleAll: () => void;
  /** Lance le rapatriement des réservations sélectionnées */
  claimSelected: () => Promise<{ claimed: number; error?: string }>;
  /** Ferme la bannière (Dismissible) */
  dismiss: () => void;
}

// ============================================
// HOOK
// ============================================

export function useGuestReservationsClaim(
  /**
   * Callback appelé après un rapatriement réussi pour déclencher un refresh de la liste principale.
   * IMPORTANT : doit être une référence stable (useCallback ou fonction définie hors du render)
   * pour éviter de recréer claimSelected à chaque render du parent.
   */
  onClaimSuccess?: (count: number) => void
): UseGuestReservationsClaimResult {
  const [guestReservations, setGuestReservations] = useState<GuestReservation[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  // Garantit qu'on ne lance la détection qu'une seule fois par montage
  const hasDetected = useRef(false);

  // ============================================
  // DÉTECTION AU MONTAGE
  // ============================================

  useEffect(() => {
    if (hasDetected.current) return;
    hasDetected.current = true;

    void (async () => {
      setIsDetecting(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          setIsDetecting(false);
          return;
        }

        const result = await getGuestReservations(user.email);

        if (result.error) {
          // Échec silencieux : on ne bloque pas l'expérience principale
          logger.warn('useGuestReservationsClaim: détection échouée', { error: result.error });
          setIsDetecting(false);
          return;
        }

        if (result.data && result.data.length > 0) {
          setGuestReservations(result.data);
          // Tout coché par défaut
          setSelectedIds(new Set(result.data.map((r) => r.reservation_id)));
          setIsBannerVisible(true);
          logger.info('Réservations guest orphelines détectées', { count: result.data.length });
        }
      } catch (err) {
        logger.warn('useGuestReservationsClaim: exception détection', {
          message: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      } finally {
        setIsDetecting(false);
      }
    })();
  }, []);

  // ============================================
  // SÉLECTION
  // ============================================

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === guestReservations.length) {
        // Tout décocher
        return new Set();
      }
      // Tout cocher
      return new Set(guestReservations.map((r) => r.reservation_id));
    });
  }, [guestReservations]);

  // ============================================
  // RAPATRIEMENT
  // ============================================

  const claimSelected = useCallback(async (): Promise<{
    claimed: number;
    error?: string;
  }> => {
    if (selectedIds.size === 0) {
      return { claimed: 0, error: 'Aucune réservation sélectionnée' };
    }

    setIsClaiming(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email || !user.id) {
        return { claimed: 0, error: 'Utilisateur non authentifié' };
      }

      const result = await claimSelectedReservations(
        user.id,
        user.email,
        Array.from(selectedIds)
      );

      if (result.error) {
        return { claimed: 0, error: result.error };
      }

      // Retirer les réservations rapatriées de la liste locale
      const claimedIds = new Set(selectedIds);
      setGuestReservations((prev) => {
        const remaining = prev.filter((r) => !claimedIds.has(r.reservation_id));
        if (remaining.length === 0) {
          setIsBannerVisible(false);
        }
        return remaining;
      });
      setSelectedIds(new Set());

      // Notifier le parent pour rafraîchir la liste des réservations
      if (result.claimed > 0) {
        onClaimSuccess?.(result.claimed);
      }

      return { claimed: result.claimed };
    } finally {
      setIsClaiming(false);
    }
  }, [selectedIds, onClaimSuccess]);

  // ============================================
  // DISMISS
  // ============================================

  const dismiss = useCallback(() => {
    setIsBannerVisible(false);
    logger.info('Bannière rapatriement guest fermée par l\'utilisateur');
  }, []);

  return {
    guestReservations,
    isDetecting,
    isClaiming,
    selectedIds,
    isBannerVisible,
    toggleSelection,
    toggleAll,
    claimSelected,
    dismiss,
  };
}
