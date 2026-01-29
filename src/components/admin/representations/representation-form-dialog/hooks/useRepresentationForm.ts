/**
 * Hook pour la gestion du formulaire de représentation
 * Derviche Diffusion - Session 103
 *
 * @important Les callbacks parents (onSubmit, onOpenChange) doivent être stables
 * (mémorisés avec useCallback) pour éviter des re-renders inutiles.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import type {
  RepresentationFormData,
  MockRepresentation,
  UseRepresentationFormReturn,
  SlotHostedBy,
} from '../types';
import { DEFAULT_FORM_DATA, DEFAULT_CAPACITY, ERROR_MESSAGES } from '../constants';
import { getLocalDateString } from '../utils';

// ============================================
// OPTIONS DU HOOK
// ============================================

interface UseRepresentationFormOptions {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Représentation en cours d'édition (null = mode création) */
  editingRepresentation: MockRepresentation | null;
  /**
   * Callback à la soumission
   * @important Doit être stable (useCallback)
   */
  onSubmit: (data: RepresentationFormData, isEditing: boolean) => void | Promise<void>;
  /**
   * Callback pour fermer la modale
   * @important Doit être stable (useCallback)
   */
  onOpenChange: (open: boolean) => void;
  /** ID du lieu nouvellement créé (pour auto-sélection) */
  newlyCreatedVenueId?: string | null;
  /** Callback pour reset l'ID du lieu nouvellement créé */
  onClearNewlyCreatedVenueId?: () => void;
  /** Indique si la représentation a des réservations */
  hasReservations: boolean;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook gérant toute la logique du formulaire de représentation
 */
export function useRepresentationForm({
  open,
  editingRepresentation,
  onSubmit,
  onOpenChange,
  newlyCreatedVenueId,
  onClearNewlyCreatedVenueId,
  hasReservations,
}: UseRepresentationFormOptions): UseRepresentationFormReturn {
  // ============================================
  // MODE
  // ============================================
  const isEditing = editingRepresentation !== null;

  // ============================================
  // ÉTATS
  // ============================================
  const [formData, setFormData] = useState<RepresentationFormData>(DEFAULT_FORM_DATA);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // REFS POUR STABILITÉ DES CALLBACKS
  // ============================================
  const onSubmitRef = useRef(onSubmit);
  const onOpenChangeRef = useRef(onOpenChange);
  const onClearNewlyCreatedVenueIdRef = useRef(onClearNewlyCreatedVenueId);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    onClearNewlyCreatedVenueIdRef.current = onClearNewlyCreatedVenueId;
  }, [onClearNewlyCreatedVenueId]);

  // ============================================
  // EFFETS
  // ============================================

  // Auto-sélection du nouveau lieu créé
  useEffect(() => {
    if (newlyCreatedVenueId && open) {
      setFormData((prev) => ({ ...prev, venueId: newlyCreatedVenueId }));
      if (onClearNewlyCreatedVenueIdRef.current) {
        onClearNewlyCreatedVenueIdRef.current();
      }
    }
  }, [newlyCreatedVenueId, open]);

  // Initialiser le formulaire quand on ouvre la modale
  useEffect(() => {
    if (open) {
      // Réinitialiser les états à l'ouverture
      setIsSubmitting(false);
      setError(null);

      if (editingRepresentation) {
        // Mode édition
        const isUnlimitedValue = editingRepresentation.capacity === null;
        setFormData({
          date: editingRepresentation.date,
          time: editingRepresentation.time,
          venueId: editingRepresentation.venueId,
          capacity: editingRepresentation.capacity ?? DEFAULT_CAPACITY,
          hostedBy: editingRepresentation.hostedBy,
          hostedById: editingRepresentation.hostedById ?? null,
        });
        setIsUnlimited(isUnlimitedValue);
      } else {
        // Mode création
        setFormData(DEFAULT_FORM_DATA);
        setIsUnlimited(true);
      }
    }
  }, [open, editingRepresentation]);

  // ============================================
  // CALCULS DÉRIVÉS
  // ============================================

  const minDate = getLocalDateString();

  const isDateTimeDisabled = hasReservations && isEditing;

  // Validation du formulaire
  // Note: hostedById est temporairement optionnel car les mockDervisheUsers ont des IDs non-UUID
  // TODO: Rendre obligatoire quand useDervisheUsers sera implémenté
  const isValid =
    formData.date !== '' &&
    formData.time !== '' &&
    formData.venueId !== '' &&
    (isUnlimited || (formData.capacity !== null && formData.capacity >= 1));

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Réinitialise le formulaire
   */
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setIsUnlimited(true);
    setError(null);
  }, []);

  /**
   * Ferme la modale
   */
  const handleClose = useCallback(() => {
    resetForm();
    onOpenChangeRef.current(false);
  }, [resetForm]);

  /**
   * Change la date
   */
  const handleDateChange = useCallback((date: string) => {
    setFormData((prev) => ({ ...prev, date }));
  }, []);

  /**
   * Change l'heure
   */
  const handleTimeChange = useCallback((time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  }, []);

  /**
   * Change le lieu
   */
  const handleVenueChange = useCallback((venueId: string) => {
    setFormData((prev) => ({ ...prev, venueId }));
  }, []);

  /**
   * Change la capacité
   */
  const handleCapacityChange = useCallback((capacity: number) => {
    setFormData((prev) => ({ ...prev, capacity }));
  }, []);

  /**
   * Change le mode illimité
   */
  const handleUnlimitedChange = useCallback((unlimited: boolean) => {
    setIsUnlimited(unlimited);
    if (unlimited) {
      setFormData((prev) => ({ ...prev, capacity: null }));
    } else {
      setFormData((prev) => ({ ...prev, capacity: DEFAULT_CAPACITY }));
    }
  }, []);

  /**
   * Change le type d'accueil
   */
  const handleHostedByChange = useCallback((hostedBy: SlotHostedBy) => {
    setFormData((prev) => ({
      ...prev,
      hostedBy,
      // Reset hostedById si on passe à company
      hostedById: hostedBy === 'company' ? null : prev.hostedById,
    }));
  }, []);

  /**
   * Change l'utilisateur accueillant
   */
  const handleHostedByIdChange = useCallback((hostedById: string | null) => {
    setFormData((prev) => ({ ...prev, hostedById }));
  }, []);

  /**
   * Soumet le formulaire
   */
  const handleSubmit = useCallback(async () => {
    if (!formData.date || !formData.time || !formData.venueId) {
      return;
    }
    if (!isUnlimited && (formData.capacity === null || formData.capacity < 1)) {
      return;
    }

    const capacityValue = isUnlimited ? null : formData.capacity;

    // Si des réservations existent, forcer les valeurs originales de date/time
    // Cela garantit qu'aucune modification n'est possible même via manipulation
    const finalDate =
      hasReservations && editingRepresentation
        ? editingRepresentation.date
        : formData.date;
    const finalTime =
      hasReservations && editingRepresentation
        ? editingRepresentation.time
        : formData.time;

    setIsSubmitting(true);
    setError(null);

    try {
      // Attendre que onSubmit se termine avant de fermer
      await onSubmitRef.current(
        {
          ...formData,
          date: finalDate,
          time: finalTime,
          capacity: capacityValue,
        },
        isEditing
      );
      // Succès : fermer le dialog
      handleClose();
    } catch (err) {
      // Erreur : garder le dialog ouvert et permettre de réessayer
      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.submissionFailed;
      setError(errorMessage);
      setIsSubmitting(false);
      console.error('Erreur lors de la soumission:', err);
    }
    // Pas de finally : évite setState sur composant démonté
  }, [formData, isUnlimited, hasReservations, editingRepresentation, isEditing, handleClose]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // Mode
    isEditing,

    // États
    formData,
    isUnlimited,
    isSubmitting,
    error,

    // Calculs dérivés
    isValid,
    minDate,
    isDateTimeDisabled,

    // Handlers
    handleDateChange,
    handleTimeChange,
    handleVenueChange,
    handleCapacityChange,
    handleUnlimitedChange,
    handleHostedByChange,
    handleHostedByIdChange,
    handleSubmit,
    handleClose,
  };
}
