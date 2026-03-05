/**
 * Hook useWalkInReservation
 * Derviche Diffusion
 *
 * Orchestre toute la logique du formulaire walk-in :
 *   - Étape 1 : recherche d'un professionnel par email
 *   - Étape 2 : formulaire complet + soumission
 *
 * Réutilise les services existants :
 *   - getAccessibleShows (checkin service) — respecte les droits selon le rôle
 *   - getAvailableSlotsForShow (admin-reservations service)
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useCheckinAccess } from '@/hooks/useCheckinAccess';
import { getAccessibleShows } from '@/lib/services/checkin';
import { getAvailableSlotsForShow } from '@/lib/services/admin-reservations';
import { DEFAULT_NOTIF_OPTIONS, INITIAL_FORM_DATA, TOAST_MESSAGES } from '../constants';
import type {
  WalkInStep,
  FoundProfile,
  WalkInFormData,
  CapacityWarning,
  SlotOption,
  ShowOption,
  UseWalkInReservationReturn,
} from '../types';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';
import type { SearchProfessionalResult } from '@/app/api/pwa/search-professional/route';

// ============================================
// HOOK
// ============================================

interface UseWalkInReservationProps {
  defaultShowId?: string;
  /** Slug du spectacle depuis l'URL — résolu en ID dès que les spectacles sont chargés */
  defaultShowSlug?: string;
  defaultSlotId?: string;
  onSuccess?: (reservationId: string) => void;
}

export function useWalkInReservation({
  defaultShowId,
  defaultShowSlug,
  defaultSlotId,
  onSuccess,
}: UseWalkInReservationProps): UseWalkInReservationReturn {
  const { userId, role, companyId } = useCheckinAccess();

  // Flag pour savoir si le slug a déjà été résolu en showId
  const slugResolvedRef = useRef(false);

  // ── Étape courante ───────────────────────────────────────────
  const [step, setStep] = useState<WalkInStep>('email-search');

  // ── Recherche email ──────────────────────────────────────────
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundProfile, setFoundProfile] = useState<FoundProfile | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  // ── Formulaire ───────────────────────────────────────────────
  const [formData, setFormData] = useState<WalkInFormData>({
    ...INITIAL_FORM_DATA,
    showId: defaultShowId ?? '',
    slotId: defaultSlotId ?? '',
  });

  // ── Spectacles + créneaux ────────────────────────────────────
  const [shows, setShows] = useState<ShowOption[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Capacité ─────────────────────────────────────────────────
  const [capacityWarning, setCapacityWarning] = useState<CapacityWarning | null>(null);

  // ── Soumission ───────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Notifications ────────────────────────────────────────────
  const [notifOptions, setNotifOptions] = useState<NotificationOptions>(DEFAULT_NOTIF_OPTIONS);

  // Ref stable pour éviter les re-renders dans les callbacks
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; });

  // ============================================================
  // Chargement des spectacles (une fois, au montage)
  // ============================================================
  useEffect(() => {
    if (!userId || !role) return;

    const load = async () => {
      setLoadingShows(true);
      try {
        const result = await getAccessibleShows(userId, role, companyId ?? null);
        if (result.error) {
          logger.error('[useWalkInReservation] Erreur chargement spectacles', { error: result.error });
          toast.error(TOAST_MESSAGES.loadShowsError);
        } else {
          setShows(
            result.data.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))
          );
        }
      } catch (err) {
        logger.error('[useWalkInReservation] Exception chargement spectacles', { err: String(err) });
        toast.error(TOAST_MESSAGES.loadShowsError);
      } finally {
        setLoadingShows(false);
      }
    };

    void load();
  }, [userId, role, companyId]);

  // ============================================================
  // Chargement des créneaux si defaultShowId fourni
  // ============================================================
  useEffect(() => {
    if (!defaultShowId) return;

    const load = async () => {
      setLoadingSlots(true);
      try {
        const result = await getAvailableSlotsForShow(defaultShowId);
        if (result.error) {
          logger.error('[useWalkInReservation] Erreur chargement créneaux initiaux', { error: result.error });
        } else {
          setSlots(
            result.data.map((s) => ({
              id: s.id,
              date: s.date,
              time: s.time,
              remainingCapacity: s.remainingCapacity,
              venueName: s.venue?.name ?? '',
            }))
          );
        }
      } catch (err) {
        logger.error('[useWalkInReservation] Exception créneaux initiaux', { err: String(err) });
      } finally {
        setLoadingSlots(false);
      }
    };

    void load();
  }, [defaultShowId]);

  // ============================================================
  // Recherche email
  // ============================================================
  const handleEmailSearch = useCallback(async () => {
    const email = searchEmail.trim();
    if (!email) return;

    setIsSearching(true);
    setFoundProfile(null);
    setSearchDone(false);

    try {
      const res = await fetch(
        `/api/pwa/search-professional?email=${encodeURIComponent(email)}`
      );
      const data = (await res.json()) as SearchProfessionalResult;

      if (!res.ok) {
        toast.error(TOAST_MESSAGES.searchError);
        return;
      }

      setSearchDone(true);

      if (data.found) {
        setFoundProfile(data.profile);
      } else {
        setFoundProfile(null);
      }
    } catch (err) {
      logger.error('[useWalkInReservation] Erreur recherche email', { err: String(err) });
      toast.error(TOAST_MESSAGES.searchError);
    } finally {
      setIsSearching(false);
    }
  }, [searchEmail]);

  // ============================================================
  // Passage à l'étape formulaire (pré-remplit si compte trouvé)
  // ============================================================
  const goToForm = useCallback(() => {
    if (foundProfile) {
      setFormData((prev) => ({
        ...prev,
        email: foundProfile.email,
        firstName: foundProfile.firstName ?? '',
        lastName: foundProfile.lastName ?? '',
        organization: foundProfile.organization ?? '',
        phone: foundProfile.phone ?? '',
        phoneSecondary: foundProfile.phone2 ?? '',
        emailSecondary: foundProfile.email2 ?? '',
        afcNumber: foundProfile.afcNumber ?? '',
        function: foundProfile.function ?? '',
        address: foundProfile.address ?? '',
        postalCode: foundProfile.postalCode ?? '',
        city: foundProfile.city ?? '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        email: searchEmail.trim(),
      }));
    }
    setStep('form');
  }, [foundProfile, searchEmail]);

  // ============================================================
  // Retour à l'étape recherche
  // ============================================================
  const goBack = useCallback(() => {
    setStep('email-search');
    setCapacityWarning(null);
    setSubmitError(null);
  }, []);

  // ============================================================
  // Changement de spectacle → recharger les créneaux
  // ============================================================
  const handleShowChange = useCallback(async (showId: string) => {
    setFormData((prev) => ({ ...prev, showId, slotId: '' }));
    setSlots([]);
    setCapacityWarning(null);

    if (!showId) return;

    setLoadingSlots(true);
    try {
      const result = await getAvailableSlotsForShow(showId);
      if (result.error) {
        toast.error(TOAST_MESSAGES.loadSlotsError);
      } else {
        const slotOptions = result.data.map((s) => ({
          id: s.id,
          date: s.date,
          time: s.time,
          remainingCapacity: s.remainingCapacity,
          venueName: s.venue?.name ?? '',
        }));
        setSlots(slotOptions);
        // Auto-sélection si un seul créneau
        if (slotOptions.length === 1 && slotOptions[0]) {
          setFormData((prev) => ({ ...prev, slotId: slotOptions[0]!.id }));
        }
      }
    } catch (err) {
      logger.error('[useWalkInReservation] Exception chargement créneaux', { err: String(err) });
      toast.error(TOAST_MESSAGES.loadSlotsError);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // ============================================================
  // Résolution slug → showId (APRÈS handleShowChange, une seule fois)
  // ============================================================
  useEffect(() => {
    if (!defaultShowSlug || slugResolvedRef.current || shows.length === 0) return;
    const match = shows.find((s) => s.slug === defaultShowSlug);
    if (!match) return;
    slugResolvedRef.current = true;
    void handleShowChange(match.id);
  }, [defaultShowSlug, shows, handleShowChange]);

  // ============================================================
  // Setter générique pour un champ du formulaire
  // ============================================================
  const setFormField = useCallback(<K extends keyof WalkInFormData>(
    field: K,
    value: WalkInFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'slotId') {
      setCapacityWarning(null);
    }
  }, []);

  // ============================================================
  // Validation locale
  // ============================================================
  const validate = (data: WalkInFormData): string | null => {
    if (!data.slotId) return TOAST_MESSAGES.validationMissingSlot;
    if (!data.firstName.trim() || !data.lastName.trim()) return TOAST_MESSAGES.validationMissingName;
    if (!data.email.trim()) return TOAST_MESSAGES.validationMissingEmail;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) return TOAST_MESSAGES.validationInvalidEmail;
    return null;
  };

  // ============================================================
  // Soumission
  // ============================================================
  const handleSubmit = useCallback(async () => {
    const validationError = validate(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setCapacityWarning(null);

    try {
      const res = await fetch('/api/pwa/walkin-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: formData.slotId,
          numPlaces: formData.numPlaces,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          emailSecondary: formData.emailSecondary || null,
          phoneSecondary: formData.phoneSecondary || null,
          address: formData.address || null,
          postalCode: formData.postalCode || null,
          city: formData.city || null,
          organization: formData.organization || null,
          function: formData.function || null,
          afcNumber: formData.afcNumber || null,
          specialRequests: formData.specialRequests || null,
          checkinVenueNotes: formData.checkinVenueNotes || null,
          checkinInternalNotes: formData.checkinInternalNotes || null,
          checkinStatus: formData.checkinStatus ?? null,
          overrideCapacity: formData.overrideCapacity,
          sendEmail: notifOptions.sendEmail,
          syncCalendar: notifOptions.syncCalendar,
        }),
      });

      const result = (await res.json()) as {
        success: boolean;
        reservationId?: string;
        capacityWarning?: boolean;
        remaining?: number;
        requested?: number;
        error?: string;
      };

      if (!result.success && result.capacityWarning) {
        setCapacityWarning({
          remaining: result.remaining ?? 0,
          requested: result.requested ?? formData.numPlaces,
        });
        return;
      }

      if (!result.success) {
        const errorMsg = result.error ?? TOAST_MESSAGES.createError;
        setSubmitError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success(TOAST_MESSAGES.createSuccess);
      onSuccessRef.current?.(result.reservationId!);

    } catch (err) {
      const msg = err instanceof Error ? err.message : TOAST_MESSAGES.createError;
      logger.error('[useWalkInReservation] Exception soumission', { err: String(err) });
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, notifOptions]);

  // ============================================================
  // Reset complet
  // ============================================================
  const reset = useCallback(() => {
    setStep('email-search');
    setSearchEmail('');
    setFoundProfile(null);
    setSearchDone(false);
    slugResolvedRef.current = false;
    setFormData({
      ...INITIAL_FORM_DATA,
      showId: defaultShowId ?? '',
      slotId: defaultSlotId ?? '',
    });
    setCapacityWarning(null);
    setSubmitError(null);
    setNotifOptions(DEFAULT_NOTIF_OPTIONS);
  }, [defaultShowId, defaultSlotId]);

  // ============================================================
  // Retour
  // ============================================================
  return {
    step,
    searchEmail,
    setSearchEmail,
    isSearching,
    foundProfile,
    searchDone,
    handleEmailSearch,
    formData,
    setFormField,
    shows,
    loadingShows,
    slots,
    loadingSlots,
    handleShowChange,
    capacityWarning,
    clearCapacityWarning: () => setCapacityWarning(null),
    isSubmitting,
    submitError,
    handleSubmit,
    notifOptions,
    setNotifOptions,
    goToForm,
    goBack,
    reset,
  };
}
