/**
 * Hook useCheckinActions - Handlers save/reactivate/cancel
 * Derviche Diffusion
 * 
 * Contient la logique métier des actions du drawer de check-in :
 * - handleSave : sauvegarde check-in et infos guest
 * - handleReactivate : réactivation d'une réservation annulée
 * - handleCancel : annulation d'une réservation
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { 
  updateCheckinStatus, 
  updateGuestInfo, 
  reactivateReservation, 
  cancelReservationFromPWA 
} from '@/lib/services/checkin';
import { getFullName } from '../constants';
import type { ReservationRowData } from '../../ReservationRow';
import type { GuestFormState, CheckinFormState } from '../types';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import { 
  buildGuestPayload, 
  mapResultToReservationUpdate,
  type CheckinResultData,
  type GuestResultData,
} from '../helpers';
import { STATUS_BUTTONS } from '../constants';

// ============================================
// TYPES
// ============================================

export interface UseCheckinActionsProps {
  reservation: ReservationRowData | null;
  guestForm: GuestFormState;
  checkinForm: CheckinFormState;
  isAdmin: boolean;
  isCancelled: boolean;
  userId: string | null;
  role: UserRole | null;
  companyId: string | null;
  onSuccess: (updatedReservation: ReservationRowData) => void;
  onOpenChange: (open: boolean) => void;
  setLocalStatus: (status: 'confirmed' | 'cancelled' | 'no_show') => void;
  setJustReactivated: (value: boolean) => void;
  /** Réinitialise le statut sélectionné à null */
  setSelectedStatus: () => void;
}

export interface UseCheckinActionsReturn {
  isSubmitting: boolean;
  handleSave: () => Promise<void>;
  handleReactivate: () => Promise<void>;
  handleCancel: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

export function useCheckinActions({
  reservation,
  guestForm,
  checkinForm,
  isAdmin,
  isCancelled,
  userId,
  role,
  companyId,
  onSuccess,
  onOpenChange,
  setLocalStatus,
  setJustReactivated,
  setSelectedStatus,
}: UseCheckinActionsProps): UseCheckinActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // HANDLER - Sauvegarde
  // ==========================================
  const handleSave = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour la sauvegarde');
      return;
    }

    // Validation basique
    if (!guestForm.firstName.trim() || !guestForm.lastName.trim()) {
      toast.error('Le prénom et le nom sont obligatoires');
      return;
    }
    if (!guestForm.email.trim()) {
      toast.error('L\'email est obligatoire');
      return;
    }

    setIsSubmitting(true);

    try {
      const guestPayload = buildGuestPayload(guestForm);

      if (isCancelled) {
        // Réservation annulée : utiliser updateGuestInfo (pas de check-in possible)
        const result = await updateGuestInfo({
          reservationId: reservation.id,
          userId,
          role,
          companyId,
          ...guestPayload,
          checkinComment: checkinForm.comment.trim() || null,
          checkinVenueNotes: checkinForm.venueNotes.trim() || null,
          checkinInternalNotes: isAdmin ? (checkinForm.internalNotes.trim() || null) : undefined,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || 'Erreur lors de la mise à jour');
          return;
        }

        const guestName = getFullName(result.data.guestFirstName, result.data.guestLastName);
        toast.success(`${guestName} : Informations mises à jour`);

        // Callback avec les données mises à jour
        const updatedReservation = mapResultToReservationUpdate(
          reservation,
          result.data as GuestResultData,
          result.data as CheckinResultData
        );
        onSuccess(updatedReservation);
        onOpenChange(false);

      } else {
        // Réservation confirmée : utiliser updateCheckinStatus
        const result = await updateCheckinStatus({
          reservationId: reservation.id,
          status: checkinForm.selectedStatus,
          comment: checkinForm.comment.trim() || null,
          venueNotes: checkinForm.venueNotes.trim() || null,
          internalNotes: isAdmin ? (checkinForm.internalNotes.trim() || null) : undefined,
          userId,
          role,
          companyId,
          ...guestPayload,
        });

        if (!result.success || !result.data) {
          toast.error(result.error || 'Erreur lors du pointage');
          return;
        }

        // Succès - message adapté selon l'action
        const guestName = getFullName(result.data.guestFirstName, result.data.guestLastName);
        
        if (checkinForm.selectedStatus === null && reservation.checkinStatus !== null) {
          toast.success(`${guestName} : Statut réinitialisé (non pointé)`);
        } else if (checkinForm.selectedStatus) {
          const statusLabel = STATUS_BUTTONS.find(b => b.status === checkinForm.selectedStatus)?.label || 'Pointé';
          toast.success(`${guestName} : ${statusLabel}`);
        } else {
          toast.success(`${guestName} : Informations mises à jour`);
        }

        // Callback avec les données mises à jour
        const updatedReservation = mapResultToReservationUpdate(
          reservation,
          result.data as GuestResultData,
          result.data as CheckinResultData
        );
        onSuccess(updatedReservation);
        onOpenChange(false);
      }
    } catch (error) {
      logger.error('useCheckinActions - Erreur sauvegarde', error as Error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    reservation,
    guestForm,
    checkinForm,
    isAdmin,
    isCancelled,
    userId,
    role,
    companyId,
    onSuccess,
    onOpenChange,
  ]);

  // ==========================================
  // HANDLER - Réactivation
  // ==========================================
  const handleReactivate = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour la réactivation');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reactivateReservation({
        reservationId: reservation.id,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de la réactivation');
        return;
      }

      const guestName = getFullName(
        result.data.reservation.guestFirstName,
        result.data.reservation.guestLastName
      );

      if (result.data.isOverbooking) {
        toast.warning(`${guestName} : Réservation réactivée (attention: overbooking)`);
      } else {
        toast.success(`${guestName} : Réservation réactivée`);
      }

      // Mettre à jour l'état local pour afficher les boutons de statut
      setLocalStatus('confirmed');
      setJustReactivated(true);

      // NE PAS fermer le drawer pour permettre le check-in immédiat
      const updatedReservation = mapResultToReservationUpdate(
        reservation,
        result.data.reservation as GuestResultData,
        {
          status: 'confirmed',
          checkinStatus: result.data.reservation.checkinStatus,
          checkinComment: result.data.reservation.checkinComment,
          checkinVenueNotes: result.data.reservation.checkinVenueNotes,
          checkinInternalNotes: result.data.reservation.checkinInternalNotes,
        }
      );
      onSuccess(updatedReservation);

    } catch (error) {
      logger.error('useCheckinActions - Erreur réactivation', error as Error);
      toast.error('Erreur lors de la réactivation');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, userId, role, companyId, onSuccess, setLocalStatus, setJustReactivated]);

  // ==========================================
  // HANDLER - Annulation
  // ==========================================
  const handleCancel = useCallback(async () => {
    if (!reservation || !userId || !role) {
      toast.error('Données manquantes pour l\'annulation');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await cancelReservationFromPWA({
        reservationId: reservation.id,
        userId,
        role,
        companyId,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de l\'annulation');
        return;
      }

      const guestName = getFullName(
        result.data.guestFirstName,
        result.data.guestLastName
      );

      toast.success(`${guestName} : Réservation annulée`);

      // Mettre à jour l'état local
      setLocalStatus('cancelled');
      setSelectedStatus();

      // Notifier le parent
      const updatedReservation = mapResultToReservationUpdate(
        reservation,
        result.data as GuestResultData,
        {
          status: 'cancelled',
          checkinStatus: result.data.checkinStatus,
          checkinComment: result.data.checkinComment,
          checkinVenueNotes: result.data.checkinVenueNotes,
          checkinInternalNotes: result.data.checkinInternalNotes,
        }
      );
      onSuccess(updatedReservation);
      onOpenChange(false);

    } catch (error) {
      logger.error('useCheckinActions - Erreur annulation', error as Error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setIsSubmitting(false);
    }
  }, [reservation, userId, role, companyId, onSuccess, onOpenChange, setLocalStatus, setSelectedStatus]);

  // ==========================================
  // RETURN
  // ==========================================
  
  return {
    isSubmitting,
    handleSave,
    handleReactivate,
    handleCancel,
  };
}
