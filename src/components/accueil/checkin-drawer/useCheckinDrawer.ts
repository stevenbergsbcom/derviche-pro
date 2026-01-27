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

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import type { ReservationRowData } from '../ReservationRow';
import type { UseCheckinDrawerReturn } from './types';
import { useGuestForm, useCheckinForm, useCheckinActions } from './hooks';
import { getFullName } from './constants';

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

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const isCancelled = localStatus === 'cancelled';
  const displayName = getFullName(guestForm.firstName, guestForm.lastName);

  const hasChanges = useMemo(() => {
    if (!reservation) return false;
    return checkGuestHasChanges(reservation) || checkCheckinHasChanges(reservation, isAdmin);
  }, [reservation, checkGuestHasChanges, checkCheckinHasChanges, isAdmin]);

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
  });

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
    handleCancel,
    
    // Computed
    displayName,
    hasChanges,
    canSave: canSave && !isSubmitting,
    isCancelled,
    isAdmin,
    accessLoading,
  };
}
