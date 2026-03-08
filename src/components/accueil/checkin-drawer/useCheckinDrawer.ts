/**
 * Hook useCheckinDrawer - Orchestrateur du drawer de pointage
 * Derviche Diffusion
 * 
 * Assemble les hooks spécialisés :
 * - useGuestForm : 13 champs guest
 * - useCheckinForm : 4 champs check-in
 * - useCheckinActions : handlers save/reactivate/cancel
 * 
 * Refactoré Session 88 : 520 lignes → ~150 lignes
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { ReservationRowData } from '../ReservationRow';
import type { UseCheckinDrawerReturn } from './types';
import { useGuestForm, useCheckinForm, useCheckinActions } from './hooks';
import { updateCheckinStatus } from '@/lib/services/checkin';
import { mapResultToReservationUpdate } from './helpers';
import type { CheckinResultData, GuestResultData } from './helpers';
import {
  DEFAULT_NOTIFICATION_OPTIONS,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';
import { getFullName } from './constants';
import type { CheckinStatus } from '@/types/database';

// ============================================
// PROPS DU HOOK
// ============================================

interface UseCheckinDrawerProps {
  reservation: ReservationRowData | null;
  onSuccess: (updatedReservation: ReservationRowData) => void;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// HOOK
// ============================================

export function useCheckinDrawer({
  reservation,
  onSuccess,
  onOpenChange,
}: UseCheckinDrawerProps): UseCheckinDrawerReturn {
  // ==========================================
  // HOOKS SPÉCIALISÉS
  // ==========================================
  const { userId, role, companyId, isAdmin, isLoading: accessLoading } = useCheckinAccess();
  // Vrai pour tout le staff DD (admin + externe) — jamais pour les compagnies
  const isStaffDD = role !== null && role !== 'company';
  // Emails post-checkin : staff DD + compagnies (jamais les professionnels)
  const canSendCheckinEmails = role !== null && role !== 'professional';
  
  const {
    guestForm,
    setGuestFirstName,
    setGuestLastName,
    setGuestEmail,
    setGuestEmailSecondary,
    setGuestPhone,
    setGuestPhoneSecondary,
    setGuestStructure,
    setGuestFunction,
    setGuestAddress,
    setGuestPostalCode,
    setGuestCity,
    setGuestCountry,
    setGuestAfcNumber,
    setSpecialRequests,
    resetFromReservation: resetGuestForm,
    checkHasChanges: checkGuestHasChanges,
  } = useGuestForm();

  const {
    checkinForm,
    setSelectedStatus,
    setComment,
    setVenueNotes,
    setInternalNotes,
    resetFromReservation: resetCheckinForm,
    checkHasChanges: checkCheckinHasChanges,
  } = useCheckinForm();

  // ==========================================
  // ÉTATS UI
  // ==========================================
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [justReactivated, setJustReactivated] = useState(false);
  const [localStatus, setLocalStatus] = useState<'confirmed' | 'cancelled' | 'no_show'>('confirmed');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reactivateNotifOptions, setReactivateNotifOptions] = useState<NotificationOptions>(DEFAULT_NOTIFICATION_OPTIONS);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const isCancelled = localStatus === 'cancelled';
  const displayName = getFullName(guestForm.firstName, guestForm.lastName);

  const hasChanges = useMemo(() => {
    if (!reservation) return false;
    return checkGuestHasChanges(reservation) || checkCheckinHasChanges(reservation);
  }, [reservation, checkGuestHasChanges, checkCheckinHasChanges]);

  const isResettingStatus = checkinForm.selectedStatus === null && reservation?.checkinStatus !== null;
  const canSave = (checkinForm.selectedStatus !== null || isResettingStatus || hasChanges) && !accessLoading;

  // Callback stable pour réinitialiser le statut (évite re-renders inutiles)
  const clearSelectedStatus = useCallback(() => setSelectedStatus(null), [setSelectedStatus]);

  // ==========================================
  // HOOK ACTIONS (après computed values pour isCancelled)
  // ==========================================
  const { isSubmitting, handleSave, handleReactivate, handleCancel } = useCheckinActions({
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
    setSelectedStatus: clearSelectedStatus,
    reactivateNotifOptions,
  });

  // ==========================================
  // HANDLER - Auto-save du statut (sans fermer le drawer)
  // ==========================================
  const isSavingStatusRef = useRef(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const handleAutoSaveStatus = useCallback(async (status: CheckinStatus | null) => {
    if (!reservation || !userId || !role) return;
    if (isSavingStatusRef.current) return;

    isSavingStatusRef.current = true;
    setIsSavingStatus(true);
    try {
      const result = await updateCheckinStatus({
        reservationId: reservation.id,
        status,
        comment: null,
        venueNotes: null,
        internalNotes: undefined,
        userId,
        role,
        companyId,
        guestFirstName: guestForm.firstName.trim() || undefined,
        guestLastName: guestForm.lastName.trim() || undefined,
        guestEmail: guestForm.email.trim() || undefined,
        guestPhone: guestForm.phone.trim() || undefined,
        guestStructure: guestForm.structure.trim() || undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erreur lors de la sauvegarde du statut');
        // Rollback : revenir au statut BDD
        setSelectedStatus(reservation.checkinStatus ?? null);
        return;
      }

      // Notifier le parent sans fermer le drawer
      const updatedReservation = mapResultToReservationUpdate(
        reservation,
        result.data as GuestResultData,
        result.data as CheckinResultData
      );
      onSuccess(updatedReservation);
    } catch (err) {
      logger.error('[handleAutoSaveStatus] Exception', err as Error);
      toast.error('Erreur lors de la sauvegarde du statut');
      setSelectedStatus(reservation.checkinStatus ?? null);
    } finally {
      isSavingStatusRef.current = false;
      setIsSavingStatus(false);
    }
  }, [reservation, userId, role, companyId, guestForm, setSelectedStatus, onSuccess]);

  // Ouvre la modale de confirmation d'annulation
  const handleCancelClick = useCallback(() => {
    setCancelDialogOpen(true);
  }, []);

  // Wrapper : annule + ferme la modale UNIQUEMENT en cas de succès
  // En cas d'échec, la modale reste ouverte pour permettre de réessayer
  const handleCancelWithDialog = useCallback(async (
    notifOptions: Parameters<typeof handleCancel>[0]
  ) => {
    const success = await handleCancel(notifOptions);
    if (success) {
      setCancelDialogOpen(false);
    }
    return success;
  }, [handleCancel]);

  // ==========================================
  // EFFET - Réinitialiser quand la réservation change
  // ==========================================
  useEffect(() => {
    if (reservation) {
      resetGuestForm(reservation);
      resetCheckinForm(reservation);
      setDetailsOpen(false);
      setJustReactivated(false);
      setLocalStatus(reservation.status);
      setCancelDialogOpen(false);
      setReactivateNotifOptions(DEFAULT_NOTIFICATION_OPTIONS);
    }
  }, [reservation, resetGuestForm, resetCheckinForm]);

  // ==========================================
  // RETURN - Interface compatible avec index.tsx
  // ==========================================
  return {
    // États groupés
    guestForm,
    checkinForm,
    uiState: {
      isSubmitting,
      detailsOpen,
      justReactivated,
      localStatus,
    },
    
    // Setters guest
    setGuestFirstName,
    setGuestLastName,
    setGuestEmail,
    setGuestEmailSecondary,
    setGuestPhone,
    setGuestPhoneSecondary,
    setGuestStructure,
    setGuestFunction,
    setGuestAddress,
    setGuestPostalCode,
    setGuestCity,
    setGuestCountry,
    setGuestAfcNumber,
    setSpecialRequests,
    
    // Setters check-in
    setSelectedStatus,
    setComment,
    setVenueNotes,
    setInternalNotes,
    
    // Setters UI
    setDetailsOpen,
    
    // Handlers
    handleSave,
    handleReactivate,
    handleCancel: handleCancelWithDialog,
    handleAutoSaveStatus,
    isSavingStatus,

    // Modale de confirmation d'annulation
    cancelDialogOpen,
    setCancelDialogOpen,
    handleCancelClick,
    
    // Computed
    displayName,
    hasChanges,
    canSave: canSave && !isSubmitting,
    isCancelled,
    isAdmin,
    isStaffDD,
    canSendCheckinEmails,
    accessLoading,

    // Options de notification (réactivation uniquement)
    reactivateNotifOptions,
    setReactivateNotifOptions,
    hasCalendarEvent: !!reservation?.googleCalendarEventId,
  };
}
