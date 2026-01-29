/**
 * Hook de gestion du formulaire d'édition de réservation
 * Derviche Diffusion - Session 111
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { initializeFormData, validateFormData } from '../utils';
import type { 
  AdminReservation, 
  UpdateReservationData, 
  AvailableSlot,
  SlotsResult,
  UseEditReservationReturn,
  FieldChangeHandler
} from '../types';

// ============================================
// PARAMÈTRES DU HOOK
// ============================================

interface UseEditReservationParams {
  reservation: AdminReservation | null;
  open: boolean;
  onSave: (data: UpdateReservationData) => Promise<void>;
  onCancel: (reservation: AdminReservation) => void;
  onOpenChange: (open: boolean) => void;
  onGetSlots: (showId: string) => Promise<SlotsResult>;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useEditReservation({
  reservation,
  open,
  onSave,
  onCancel,
  onOpenChange,
  onGetSlots,
}: UseEditReservationParams): UseEditReservationReturn {
  // ============================================
  // ÉTAT LOCAL
  // ============================================
  
  const [formData, setFormData] = useState<UpdateReservationData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Le formulaire est prêt uniquement quand formData est peuplé
  const isFormReady = formData !== null;

  // ============================================
  // REFS POUR STABILITÉ
  // ============================================
  
  // Ref stable pour onGetSlots afin d'éviter les re-exécutions inutiles du useEffect
  const onGetSlotsRef = useRef(onGetSlots);
  useEffect(() => {
    onGetSlotsRef.current = onGetSlots;
  });

  // Ref stable pour onCancel
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  // Ref stable pour onOpenChange
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  // Ref stable pour onSave
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  // ============================================
  // INITIALISATION AU CHANGEMENT DE RÉSERVATION
  // ============================================
  
  useEffect(() => {
    if (reservation && open) {
      // Reset les erreurs de validation
      setValidationErrors([]);
      
      // Initialiser le formulaire
      setFormData(initializeFormData(reservation));

      // Charger les créneaux disponibles via la ref stable
      const showId = reservation.slot?.show?.id;
      if (showId) {
        setLoadingSlots(true);
        setSlotsError(null);
        
        onGetSlotsRef.current(showId)
          .then((result) => {
            if (result.success && result.data) {
              setAvailableSlots(result.data);
            } else if (result.error) {
              setSlotsError(result.error);
            }
          })
          .catch((err: Error) => {
            setSlotsError(err.message || 'Erreur lors du chargement des créneaux');
          })
          .finally(() => {
            setLoadingSlots(false);
          });
      }
    }
  }, [reservation, open]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Gère le changement d'un champ du formulaire
   */
  const handleChange: FieldChangeHandler = useCallback((field, value) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    
    // Effacer les erreurs de validation quand l'utilisateur modifie un champ
    setValidationErrors((prev) => (prev.length > 0 ? [] : prev));
  }, []);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = useCallback(async () => {
    const errors = validateFormData(formData);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    if (!formData) return;
    
    await onSaveRef.current(formData);
  }, [formData]);

  /**
   * Gère l'annulation de la réservation
   */
  const handleCancelReservation = useCallback(() => {
    if (reservation) {
      onOpenChangeRef.current(false);
      onCancelRef.current(reservation);
    }
  }, [reservation]);

  /**
   * Gère l'ouverture/fermeture du dialog avec reset
   */
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      // Reset du formulaire quand le dialog se ferme
      setFormData(null);
      setValidationErrors([]);
      setAvailableSlots([]);
      setSlotsError(null);
    }
    onOpenChangeRef.current(isOpen);
  }, []);

  // ============================================
  // RETOUR DU HOOK
  // ============================================
  
  return {
    // État
    formData,
    availableSlots,
    loadingSlots,
    slotsError,
    validationErrors,
    isFormReady,
    
    // Actions
    handleChange,
    handleSubmit,
    handleCancelReservation,
    handleOpenChange,
  };
}
