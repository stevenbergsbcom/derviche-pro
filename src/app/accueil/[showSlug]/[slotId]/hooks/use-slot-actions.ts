/**
 * Hook use-slot-actions - Mutation handlers (checkin, transfer, drawer)
 * Derviche Diffusion
 *
 * Extracted from useSlotDetails (Session refactoring)
 */

'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CheckinReservation } from '@/lib/services/checkin';
import type { ReservationRowData } from '@/components/accueil';

// ============================================
// PROPS
// ============================================

export interface UseSlotActionsProps {
  reservations: CheckinReservation[];
  setReservations: React.Dispatch<React.SetStateAction<CheckinReservation[]>>;
  isLoading: boolean;
  isMountedRef: React.RefObject<boolean>;
}

// ============================================
// RETURN TYPE
// ============================================

export interface UseSlotActionsReturn {
  // Drawer check-in
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  selectedReservation: ReservationRowData | null;

  // Drawer transfert
  transferDrawerOpen: boolean;
  setTransferDrawerOpen: (open: boolean) => void;

  // Handlers
  handleReservationClick: (reservation: CheckinReservation) => void;
  handleCheckinSuccess: (updatedReservation: ReservationRowData) => void;
  handleTransferClick: () => void;
  handleTransferSuccess: (updatedReservation: ReservationRowData) => void;
}

// ============================================
// HOOK
// ============================================

export function useSlotActions({
  reservations,
  setReservations,
  isLoading,
  isMountedRef,
}: UseSlotActionsProps): UseSlotActionsReturn {
  // États pour le drawer de check-in
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRowData | null>(null);

  // État pour le drawer de transfert
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);

  // Ref pour auto-ouverture unique
  const autoOpenDoneRef = useRef(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const targetReservationId = searchParams.get('reservationId');

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Clic sur une réservation - ouvre le drawer
   */
  const handleReservationClick = useCallback(
    (reservation: CheckinReservation) => {
      const rowData: ReservationRowData = {
        id: reservation.id,
        guestFirstName: reservation.guestFirstName,
        guestLastName: reservation.guestLastName,
        guestStructure: reservation.guestStructure,
        guestEmail: reservation.guestEmail,
        guestEmailSecondary: reservation.guestEmailSecondary,
        guestPhone: reservation.guestPhone,
        guestPhoneSecondary: reservation.guestPhoneSecondary,
        guestFunction: reservation.guestFunction,
        guestAddress: reservation.guestAddress,
        guestPostalCode: reservation.guestPostalCode,
        guestCity: reservation.guestCity,
        guestCountry: reservation.guestCountry,
        guestAfcNumber: reservation.guestAfcNumber,
        numPlaces: reservation.numPlaces,
        checkinStatus: reservation.checkinStatus,
        checkinComment: reservation.checkinComment,
        checkinVenueNotes: reservation.checkinVenueNotes,
        checkinInternalNotes: reservation.checkinInternalNotes,
        specialRequests: reservation.specialRequests,
        status: reservation.status,
        googleCalendarEventId: reservation.googleCalendarEventId,
        checkinFollowupEmails: reservation.checkinFollowupEmails,
        userId: reservation.userId,
      };
      setSelectedReservation(rowData);
      setDrawerOpen(true);
    },
    []
  );

  /**
   * Auto-ouverture depuis la recherche globale.
   * Si un ?reservationId= est présent dans l'URL, ouvre le drawer une seule fois
   * puis nettoie le param sans rechargement.
   */
  useEffect(() => {
    if (
      !targetReservationId ||
      isLoading ||
      reservations.length === 0 ||
      autoOpenDoneRef.current
    ) return;

    const target = reservations.find((r) => r.id === targetReservationId);
    if (!target) return;

    autoOpenDoneRef.current = true;

    const tid = setTimeout(() => {
      if (!isMountedRef.current) return;
      handleReservationClick(target);
      const url = new URL(window.location.href);
      url.searchParams.delete('reservationId');
      const cleanUrl = url.pathname + (url.search ? url.search : '');
      router.replace(cleanUrl, { scroll: false });
    }, 350);

    return () => clearTimeout(tid);
  }, [targetReservationId, isLoading, reservations, handleReservationClick, router, isMountedRef]);

  const handleCheckinSuccess = useCallback(
    (updatedReservation: ReservationRowData) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === updatedReservation.id
            ? {
                ...r,
                status: updatedReservation.status,
                checkinStatus: updatedReservation.checkinStatus,
                checkinComment: updatedReservation.checkinComment ?? null,
                checkinVenueNotes: updatedReservation.checkinVenueNotes ?? null,
                checkinInternalNotes: updatedReservation.checkinInternalNotes ?? null,
                guestFirstName: updatedReservation.guestFirstName,
                guestLastName: updatedReservation.guestLastName,
                guestEmail: updatedReservation.guestEmail,
                guestEmailSecondary: updatedReservation.guestEmailSecondary ?? null,
                guestPhone: updatedReservation.guestPhone ?? null,
                guestPhoneSecondary: updatedReservation.guestPhoneSecondary ?? null,
                guestStructure: updatedReservation.guestStructure,
                guestFunction: updatedReservation.guestFunction ?? null,
                guestAddress: updatedReservation.guestAddress ?? null,
                guestPostalCode: updatedReservation.guestPostalCode ?? null,
                guestCity: updatedReservation.guestCity ?? null,
                guestCountry: updatedReservation.guestCountry ?? null,
                guestAfcNumber: updatedReservation.guestAfcNumber ?? null,
                specialRequests: updatedReservation.specialRequests ?? null,
              }
            : r
        )
      );
    },
    [setReservations]
  );

  const handleTransferClick = useCallback(() => {
    setDrawerOpen(false);
    setTransferDrawerOpen(true);
  }, []);

  const handleTransferSuccess = useCallback(
    (updatedReservation: ReservationRowData) => {
      setReservations((prev) =>
        prev.filter((r) => r.id !== updatedReservation.id)
      );
      setTransferDrawerOpen(false);
      setSelectedReservation(null);
    },
    [setReservations]
  );

  // ============================================
  // RETOUR
  // ============================================

  return {
    drawerOpen,
    setDrawerOpen,
    selectedReservation,
    transferDrawerOpen,
    setTransferDrawerOpen,
    handleReservationClick,
    handleCheckinSuccess,
    handleTransferClick,
    handleTransferSuccess,
  };
}
