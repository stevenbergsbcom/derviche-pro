/**
 * Hook useGuestForm - Gestion des 13 champs guest
 * Derviche Diffusion
 * 
 * Regroupe les 13 useState en un seul état objet
 * Fournit des setters individuels pour compatibilité avec le composant existant
 */

'use client';

import { useState, useCallback } from 'react';
import type { GuestFormState } from '../types';
import type { ReservationRowData } from '../../ReservationRow';
import { mapReservationToGuestState, hasGuestChanges } from '../helpers';

// ============================================
// ÉTAT INITIAL
// ============================================

const INITIAL_GUEST_STATE: GuestFormState = {
  firstName: '',
  lastName: '',
  email: '',
  emailSecondary: '',
  phone: '',
  phoneSecondary: '',
  structure: '',
  function: '',
  address: '',
  postalCode: '',
  city: '',
  afcNumber: '',
  specialRequests: '',
};

// ============================================
// TYPES
// ============================================

export interface UseGuestFormReturn {
  /** État complet du formulaire guest */
  guestForm: GuestFormState;
  
  /** Setters individuels pour chaque champ */
  setGuestFirstName: (value: string) => void;
  setGuestLastName: (value: string) => void;
  setGuestEmail: (value: string) => void;
  setGuestEmailSecondary: (value: string) => void;
  setGuestPhone: (value: string) => void;
  setGuestPhoneSecondary: (value: string) => void;
  setGuestStructure: (value: string) => void;
  setGuestFunction: (value: string) => void;
  setGuestAddress: (value: string) => void;
  setGuestPostalCode: (value: string) => void;
  setGuestCity: (value: string) => void;
  setGuestAfcNumber: (value: string) => void;
  setSpecialRequests: (value: string) => void;
  
  /** Réinitialise le formulaire depuis une réservation */
  resetFromReservation: (reservation: ReservationRowData) => void;
  
  /** Vérifie si des modifications ont été faites */
  checkHasChanges: (reservation: ReservationRowData) => boolean;
}

// ============================================
// HOOK
// ============================================

export function useGuestForm(): UseGuestFormReturn {
  const [guestForm, setGuestForm] = useState<GuestFormState>(INITIAL_GUEST_STATE);

  // ==========================================
  // SETTERS INDIVIDUELS (mémorisés)
  // ==========================================
  
  const setGuestFirstName = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, firstName: value }));
  }, []);

  const setGuestLastName = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, lastName: value }));
  }, []);

  const setGuestEmail = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, email: value }));
  }, []);

  const setGuestEmailSecondary = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, emailSecondary: value }));
  }, []);

  const setGuestPhone = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, phone: value }));
  }, []);

  const setGuestPhoneSecondary = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, phoneSecondary: value }));
  }, []);

  const setGuestStructure = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, structure: value }));
  }, []);

  const setGuestFunction = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, function: value }));
  }, []);

  const setGuestAddress = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, address: value }));
  }, []);

  const setGuestPostalCode = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, postalCode: value }));
  }, []);

  const setGuestCity = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, city: value }));
  }, []);

  const setGuestAfcNumber = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, afcNumber: value }));
  }, []);

  const setSpecialRequests = useCallback((value: string) => {
    setGuestForm(prev => ({ ...prev, specialRequests: value }));
  }, []);

  // ==========================================
  // RESET DEPUIS RÉSERVATION
  // ==========================================
  
  const resetFromReservation = useCallback((reservation: ReservationRowData) => {
    setGuestForm(mapReservationToGuestState(reservation));
  }, []);

  // ==========================================
  // CHECK HAS CHANGES
  // ==========================================
  
  const checkHasChanges = useCallback((reservation: ReservationRowData) => {
    return hasGuestChanges(guestForm, reservation);
  }, [guestForm]);

  // ==========================================
  // RETURN
  // ==========================================
  
  return {
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
    resetFromReservation,
    checkHasChanges,
  };
}
