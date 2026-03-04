/**
 * Hook useTransferSlot - Logique du drawer de transfert
 * Derviche Diffusion
 * 
 * Gère :
 * - Le chargement des slots cibles
 * - La sélection du slot de destination
 * - Le nombre de places à transférer
 * - L'exécution du transfert
 */

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  DEFAULT_NOTIFICATION_OPTIONS,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';
import { getFullName } from '@/lib/utils/guest';
import { 
  getTransferTargetSlots, 
  transferReservation,
  formatSlotDate,
  formatSlotTime,
  type TransferTargetSlot,
} from '@/lib/services/checkin';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { ReservationRowData } from '../ReservationRow';
import type { UseTransferSlotReturn } from './types';
import { MAX_PLACES } from './constants';
import { wouldCauseOverbooking } from './helpers';

// ============================================
// PROPS DU HOOK
// ============================================

interface UseTransferSlotProps {
  reservation: ReservationRowData | null;
  /** ID du créneau actuel (avant transfert) — utilisé pour l'email de modification */
  currentSlotId: string;
  open: boolean;
  onSuccess: (updatedReservation: ReservationRowData) => void;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// HOOK
// ============================================

export function useTransferSlot({
  reservation,
  currentSlotId,
  open,
  onSuccess,
  onOpenChange,
}: UseTransferSlotProps): UseTransferSlotReturn {
  const { userId, role, companyId, isLoading: accessLoading } = useCheckinAccess();
  
  // Protection contre les race conditions
  const isTransferringRef = useRef(false);
  
  // ==========================================
  // ÉTATS
  // ==========================================
  const [slots, setSlots] = useState<TransferTargetSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [numPlaces, setNumPlaces] = useState(1);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifOptions, setNotifOptions] = useState<NotificationOptions>(DEFAULT_NOTIFICATION_OPTIONS);

  // ==========================================
  // EFFET - Charger les slots cibles
  // ==========================================
  useEffect(() => {
    // Guard : ne rien faire si le drawer est fermé ou si les données manquent
    if (!open || !reservation || !userId || !role) {
      return;
    }

    // Capturer l'ID de la réservation au début pour détecter les changements
    const currentReservationId = reservation.id;
    const currentNumPlaces = reservation.numPlaces;
    let cancelled = false;

    setIsLoadingSlots(true);
    setError(null);
    setSelectedSlotId(null);
    setNumPlaces(currentNumPlaces);
    
    void (async () => {
      try {
        const result = await getTransferTargetSlots(
          currentReservationId,
          userId,
          role,
          companyId
        );
        
        // Ignorer le résultat si annulé (drawer fermé ou réservation changée)
        if (cancelled) return;
        
        if (result.error) {
          setError(result.error);
          setSlots([]);
        } else {
          setSlots(result.data);
          if (result.data.length === 0) {
            setError('Aucun autre créneau disponible pour ce spectacle');
          }
        }
      } catch (err) {
        // Ignorer le résultat si annulé
        if (cancelled) return;
        
        logger.error('useTransferSlot - Erreur chargement slots', err as Error);
        setError('Erreur lors du chargement des créneaux');
        setSlots([]);
      } finally {
        // Ignorer le résultat si annulé
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      }
    })();

    // Cleanup : marquer comme annulé si le drawer se ferme ou la réservation change
    return () => {
      cancelled = true;
    };
    // Note: on utilise reservation?.id pour éviter les re-renders inutiles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation?.id, userId, role, companyId]);

  // ==========================================
  // EFFET - Réinitialiser à la fermeture
  // ==========================================
  useEffect(() => {
    if (!open) {
      setSlots([]);
      setSelectedSlotId(null);
      setNumPlaces(1);
      setError(null);
      setNotifOptions(DEFAULT_NOTIFICATION_OPTIONS);
    }
  }, [open]);

  // ==========================================
  // COMPUTED VALUES (mémorisées)
  // ==========================================
  
  const displayName = useMemo(() => {
    if (!reservation) return 'Sans nom';
    return getFullName(reservation.guestFirstName, reservation.guestLastName);
  }, [reservation]);
  
  const selectedSlot = useMemo(() => {
    return slots.find(s => s.id === selectedSlotId);
  }, [slots, selectedSlotId]);
  
  const wouldOverbook = useMemo(() => {
    if (!selectedSlot) return false;
    return wouldCauseOverbooking(selectedSlot, numPlaces);
  }, [selectedSlot, numPlaces]);

  const canTransfer = useMemo(() => {
    return (
      selectedSlotId !== null && 
      !selectedSlot?.hasExistingGuestReservation &&
      !isSubmitting && 
      !accessLoading && 
      !isLoadingSlots
    );
  }, [selectedSlotId, selectedSlot, isSubmitting, accessLoading, isLoadingSlots]);

  // ==========================================
  // HANDLERS - Nombre de places
  // ==========================================
  const handleDecrease = useCallback(() => {
    setNumPlaces(prev => Math.max(1, prev - 1));
  }, []);

  const handleIncrease = useCallback(() => {
    setNumPlaces(prev => Math.min(MAX_PLACES, prev + 1));
  }, []);

  const handleNumPlacesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permettre le champ vide temporairement (l'utilisateur efface pour retaper)
    if (value === '') return;
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= MAX_PLACES) {
      setNumPlaces(numValue);
    }
  }, []);

  // ==========================================
  // HANDLER - Transfert
  // ==========================================
  const handleTransfer = useCallback(async () => {
    // Protection contre les doubles soumissions
    if (isTransferringRef.current) return;
    
    if (!reservation || !selectedSlotId || !userId || !role) {
      toast.error('Données manquantes pour le transfert');
      return;
    }

    isTransferringRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await transferReservation({
        reservationId: reservation.id,
        targetSlotId: selectedSlotId,
        newNumPlaces: numPlaces,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        // Reset avant le return (critique pour éviter le blocage)
        isTransferringRef.current = false;
        setIsSubmitting(false);
        toast.error(result.error || 'Erreur lors du transfert');
        return;
      }

      // Message de succès (utiliser selectedSlot mémorisé)
      const slotInfo = selectedSlot 
        ? `${formatSlotDate(selectedSlot.date)} à ${formatSlotTime(selectedSlot.time)}`
        : 'nouveau créneau';
      
      // Avertissement overbooking si applicable
      if (result.data.targetSlotCapacity.isOverbooking) {
        toast.warning(
          `Transféré vers ${slotInfo} (attention: surbooking)`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Transféré vers ${slotInfo}`);
      }

      // Callback avec les données mises à jour
      onSuccess({
        ...reservation,
        numPlaces: result.data.reservation.numPlaces,
        checkinStatus: result.data.reservation.checkinStatus,
        checkinComment: result.data.reservation.checkinComment,
        checkinVenueNotes: result.data.reservation.checkinVenueNotes,
        checkinInternalNotes: result.data.reservation.checkinInternalNotes,
      });

      // Email de modification (non-bloquant)
      if (notifOptions.sendEmail) {
        void fetch('/api/emails/send-modification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: reservation.id,
            oldSlotId: currentSlotId,
          }),
        }).catch((err) =>
          logger.warn('useTransferSlot - Email modification non envoyé', { err })
        );
      }

      // Fermer le drawer
      onOpenChange(false);

    } catch (err) {
      logger.error('useTransferSlot - Erreur transfert', err as Error);
      toast.error('Erreur lors du transfert');
    } finally {
      setIsSubmitting(false);
      isTransferringRef.current = false;
    }
  }, [reservation, currentSlotId, selectedSlotId, numPlaces, userId, role, companyId, notifOptions, selectedSlot, onSuccess, onOpenChange]);

  // ==========================================
  // RETURN
  // ==========================================
  return {
    // États
    slots,
    selectedSlotId,
    numPlaces,
    isLoadingSlots,
    isSubmitting,
    error,
    
    // Computed
    displayName,
    selectedSlot,
    wouldOverbook,
    canTransfer,
    
    // Setters
    setSelectedSlotId,
    
    // Handlers
    handleDecrease,
    handleIncrease,
    handleNumPlacesChange,
    handleTransfer,

    // Notification
    notifOptions,
    setNotifOptions,
    hasCalendarEvent: !!reservation?.googleCalendarEventId,
  };
}
