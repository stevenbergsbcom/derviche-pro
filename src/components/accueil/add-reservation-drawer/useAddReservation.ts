/**
 * Hook useAddReservation
 * Derviche Diffusion - Session 82
 *
 * Encapsule la logique du formulaire d'ajout de réservation :
 * - Form react-hook-form avec validation Zod
 * - Gestion des états (collapsibles, capacité, doublons)
 * - Handlers de soumission et confirmation
 *
 * Corrections appliquées (audit Cursor) :
 * - Cleanup dans useEffect pour checkSlotCapacity
 * - Dépendances useEffect optimisées (form retiré)
 * - Reset isSubmittingRef en cas d'erreur
 * - useMemo pour l'objet state
 * - useRef pour pendingFormData
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createReservationFromCheckin,
  checkDuplicateEmail,
  checkSlotCapacity,
  type CreateCheckinReservationData,
  type DuplicateCheckResult,
} from '@/lib/services/checkin';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import { logger } from '@/lib/logger';
// CheckinStatus est inféré par Zod, pas besoin d'import explicite
import { addReservationSchema, DEFAULT_FORM_VALUES } from './constants';
import type {
  AddReservationFormData,
  AddReservationDrawerStep,
  AddReservationState,
  CapacityInfo,
  UseAddReservationReturn,
} from './types';
import type { FoundProfile } from '@/app/api/pwa/search-professional/route';
import {
  DEFAULT_NOTIFICATION_OPTIONS,
  type NotificationOptions,
} from '@/components/admin/reservations/notification-switches';

// ============================================
// HOOK
// ============================================

interface UseAddReservationParams {
  slotId?: string;
  open: boolean;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useAddReservation({
  slotId,
  open,
  onSuccess,
  onOpenChange,
}: UseAddReservationParams): UseAddReservationReturn {
  const { userId, role, companyId, isAdmin } = useCheckinAccess();
  const isStaffDD = role !== null && role !== 'company';

  // ============================================
  // ÉTATS
  // ============================================

  // Step : 'select-slot' (si pas de slotId) → 'search' → 'form'
  const initialStep: AddReservationDrawerStep = slotId ? 'search' : 'select-slot';
  const [step, setStep] = useState<AddReservationDrawerStep>(initialStep);
  const [activeSlotId, setActiveSlotId] = useState<string>(slotId ?? '');

  const [notifOptions, setNotifOptions] = useState<NotificationOptions>(DEFAULT_NOTIFICATION_OPTIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(false);
  const [checkinFieldsOpen, setCheckinFieldsOpen] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<AddReservationState['createdReservation']>(null);

  // Refs pour éviter les problèmes de race conditions et dépendances
  const isSubmittingRef = useRef(false);
  const pendingFormDataRef = useRef<AddReservationFormData | null>(null);

  // ============================================
  // FORM REACT-HOOK-FORM
  // ============================================

  const form = useForm<AddReservationFormData>({
    resolver: zodResolver(addReservationSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  // ============================================
  // EFFETS
  // ============================================

  /**
   * Charger la capacité du slot quand le drawer s'ouvre
   * Avec cleanup pour annuler si le drawer se ferme
   */
  useEffect(() => {
    if (!open || !activeSlotId) {
      setCapacityInfo(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      const capacity = await checkSlotCapacity(activeSlotId);
      if (!cancelled && capacity) {
        setCapacityInfo({
          remaining: capacity.remaining,
          isUnlimited: capacity.isUnlimited,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, activeSlotId]);

  /**
   * Reset form et états quand le drawer s'ouvre
   * Note: form.reset est stable, pas besoin dans les dépendances
   */
  useEffect(() => {
    const { reset } = form;
    if (open) {
      setStep(slotId ? 'search' : 'select-slot');
      setActiveSlotId(slotId ?? '');
      setNotifOptions(DEFAULT_NOTIFICATION_OPTIONS);
      reset(DEFAULT_FORM_VALUES);
      setOptionalFieldsOpen(false);
      setCheckinFieldsOpen(false);
      setDuplicateInfo(null);
      pendingFormDataRef.current = null;
      setShowDuplicateDialog(false);
      setCreatedReservation(null);
    }
  }, [open, slotId, form]); // form stable (useForm), slotId pour resync si navigation avec drawer ouvert

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Soumet le formulaire avec vérification optionnelle des doublons
   */
  const handleSubmit = useCallback(
    async (formData: AddReservationFormData, skipDuplicateCheck = false) => {
      // Protection contre les doubles soumissions
      if (isSubmittingRef.current) return;

      if (!userId || !role) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      // Vérifier les doublons si pas déjà fait
      if (!skipDuplicateCheck) {
        const duplicate = await checkDuplicateEmail(activeSlotId, formData.email);
        if (duplicate.hasDuplicate) {
          setDuplicateInfo(duplicate);
          pendingFormDataRef.current = formData;
          setShowDuplicateDialog(true);
          return;
        }
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        const data: CreateCheckinReservationData = {
          slotId: activeSlotId,
          numPlaces: formData.numPlaces,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          emailSecondary: formData.emailSecondary || undefined,
          phoneSecondary: formData.phoneSecondary || undefined,
          address: formData.address || undefined,
          postalCode: formData.postalCode || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
          organization: formData.organization || undefined,
          function: formData.function || undefined,
          afcNumber: formData.afcNumber || undefined,
          specialRequests: formData.specialRequests || undefined,
          checkinStatus: formData.checkinStatus,
          checkinComment: formData.checkinComment || undefined,
          checkinVenueNotes: formData.checkinVenueNotes || undefined,
          checkinInternalNotes: formData.checkinInternalNotes || undefined,
        };

        const result = await createReservationFromCheckin(data, userId, role, companyId);

        if (!result.success) {
          // Reset des flags avant le return early
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          toast.error(result.error || 'Erreur lors de la création');
          return;
        }

        // Afficher le warning si doublon (mais création réussie)
        if (result.warning) {
          toast.warning(result.warning);
        }

        toast.success(`Réservation créée pour ${formData.firstName} ${formData.lastName}`);

        // Envoyer email + calendar si demandé (non-bloquant)
        if (notifOptions.sendEmail && result.reservationId) {
          void fetch('/api/emails/send-confirmation-by-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: result.reservationId,
              syncCalendar: notifOptions.syncCalendar,
            }),
          }).catch((err) => {
            logger.error('useAddReservation - Erreur envoi email confirmation', { err });
          });
        }

        onSuccess();

        // Si un statut checkin est défini, afficher l'étape email avant de fermer
        if (formData.checkinStatus && result.reservationId) {
          setCreatedReservation({
            id: result.reservationId,
            guestFirstName: formData.firstName,
            guestLastName: formData.lastName,
            guestEmail: formData.email,
            guestStructure: formData.organization ?? null,
            numPlaces: formData.numPlaces,
            checkinStatus: formData.checkinStatus,
            status: 'confirmed',
            checkinFollowupEmails: [],
          });
          setStep('success');
        } else {
          onOpenChange(false);
        }
      } catch (error) {
        logger.error('useAddReservation - Erreur création réservation', { error });
        toast.error('Erreur lors de la création de la réservation');
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [userId, role, companyId, activeSlotId, notifOptions, onSuccess, onOpenChange]
  );

  /**
   * Handler pour le form submit (wrappé par react-hook-form)
   */
  const onFormSubmit = form.handleSubmit((data) => {
    void handleSubmit(data);
  });

  /**
   * Slot sélectionné via SelectSlotStep → passe à 'search'
   */
  const handleSlotSelected = useCallback((selectedSlotId: string) => {
    setActiveSlotId(selectedSlotId);
    setStep('search');
  }, []);

  /**
   * Profil sélectionné via SearchStep → pré-remplit le formulaire + passe à 'form'
   */
  const handleSelectProfile = useCallback((profile: FoundProfile) => {
    form.reset({
      ...DEFAULT_FORM_VALUES,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email,
      phone: profile.phone ?? '',
      emailSecondary: profile.email2 ?? '',
      phoneSecondary: profile.phone2 ?? '',
      organization: profile.organization ?? '',
      function: profile.function ?? '',
      afcNumber: profile.afcNumber ?? '',
      address: profile.address ?? '',
      postalCode: profile.postalCode ?? '',
      city: profile.city ?? '',
      country: profile.country ?? 'France',
    });
    setStep('form');
  }, [form]);

  /**
   * Passer la recherche → formulaire vide
   */
  const handleSkipSearch = useCallback(() => {
    setStep('form');
  }, []);

  /**
   * Confirme la création malgré un doublon détecté
   * Utilise la ref pour éviter les problèmes de dépendances
   */
  const handleConfirmDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    if (pendingFormDataRef.current) {
      void handleSubmit(pendingFormDataRef.current, true);
    }
  }, [handleSubmit]);

  /**
   * Annule après détection d'un doublon
   */
  const handleCancelDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    pendingFormDataRef.current = null;
  }, []);

  // ============================================
  // ÉTAT MÉMORISÉ (évite les re-renders)
  // ============================================

  const state = useMemo(
    () => ({
      step,
      activeSlotId,
      isSubmitting,
      optionalFieldsOpen,
      checkinFieldsOpen,
      capacityInfo,
      duplicateInfo,
      showDuplicateDialog,
      createdReservation,
    }),
    [
      step,
      activeSlotId,
      isSubmitting,
      optionalFieldsOpen,
      checkinFieldsOpen,
      capacityInfo,
      duplicateInfo,
      showDuplicateDialog,
      createdReservation,
    ]
  );

  // ============================================
  // RETOUR
  // ============================================

  return {
    form,
    state,
    notifOptions,
    setNotifOptions,
    setOptionalFieldsOpen,
    setCheckinFieldsOpen,
    onFormSubmit,
    handleSlotSelected,
    handleSelectProfile,
    handleSkipSearch,
    handleConfirmDuplicate,
    handleCancelDuplicate,
    isAdmin,
    isStaffDD,
  };
}
