/**
 * Hook useCheckinForm - Gestion des 4 champs check-in
 * Derviche Diffusion
 * 
 * Regroupe les 4 useState en un seul état objet :
 * - selectedStatus
 * - comment
 * - venueNotes
 * - internalNotes
 */

'use client';

import { useState, useCallback } from 'react';
import type { CheckinFormState } from '../types';
import type { CheckinStatus } from '@/types/database';
import type { ReservationRowData } from '../../ReservationRow';
import { mapReservationToCheckinState, hasCheckinChanges } from '../helpers';

// ============================================
// ÉTAT INITIAL
// ============================================

const INITIAL_CHECKIN_STATE: CheckinFormState = {
  selectedStatus: null,
  comment: '',
  venueNotes: '',
  internalNotes: '',
};

// ============================================
// TYPES
// ============================================

export interface UseCheckinFormReturn {
  /** État complet du formulaire check-in */
  checkinForm: CheckinFormState;
  
  /** Setters individuels */
  setSelectedStatus: (status: CheckinStatus | null) => void;
  setComment: (value: string) => void;
  setVenueNotes: (value: string) => void;
  setInternalNotes: (value: string) => void;
  
  /** Réinitialise le formulaire depuis une réservation */
  resetFromReservation: (reservation: ReservationRowData) => void;
  
  /** Vérifie si des modifications ont été faites */
  checkHasChanges: (reservation: ReservationRowData) => boolean;
}

// ============================================
// HOOK
// ============================================

export function useCheckinForm(): UseCheckinFormReturn {
  const [checkinForm, setCheckinForm] = useState<CheckinFormState>(INITIAL_CHECKIN_STATE);

  // ==========================================
  // SETTERS INDIVIDUELS (mémorisés)
  // ==========================================
  
  const setSelectedStatus = useCallback((status: CheckinStatus | null) => {
    setCheckinForm(prev => ({ ...prev, selectedStatus: status }));
  }, []);

  const setComment = useCallback((value: string) => {
    setCheckinForm(prev => ({ ...prev, comment: value }));
  }, []);

  const setVenueNotes = useCallback((value: string) => {
    setCheckinForm(prev => ({ ...prev, venueNotes: value }));
  }, []);

  const setInternalNotes = useCallback((value: string) => {
    setCheckinForm(prev => ({ ...prev, internalNotes: value }));
  }, []);

  // ==========================================
  // RESET DEPUIS RÉSERVATION
  // ==========================================
  
  const resetFromReservation = useCallback((reservation: ReservationRowData) => {
    setCheckinForm(mapReservationToCheckinState(reservation));
  }, []);

  // ==========================================
  // CHECK HAS CHANGES
  // ==========================================
  
  const checkHasChanges = useCallback((reservation: ReservationRowData) => {
    return hasCheckinChanges(checkinForm, reservation);
  }, [checkinForm]);

  // ==========================================
  // RETURN
  // ==========================================
  
  return {
    checkinForm,
    setSelectedStatus,
    setComment,
    setVenueNotes,
    setInternalNotes,
    resetFromReservation,
    checkHasChanges,
  };
}
