/**
 * Hook useSpectacleBooking — Logique metier de la page de reservation
 * Derviche Diffusion
 *
 * Gere l'ensemble des etats, effets et handlers du parcours de reservation :
 * calendrier, selection de creneau, participants, formulaire et soumission.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePublicShow } from '@/hooks/usePublicShow';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { createReservation, enrichUserProfile } from '@/lib/services/reservations';
import { checkDuplicateReservation } from '@/lib/services/reservations-duplicate';
import type { DuplicateCheckResult } from '@/lib/services/reservations-duplicate';
import { createClient } from '@/lib/supabase/client';
import { formatDuration } from '@/lib/utils/shows';

import type { TimeSlot, Step, ReservationFormData } from '../types';
import { DEFAULT_MAX_RESERVATIONS, INITIAL_FORM_DATA } from '../types';
import {
  convertToTimeSlot,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isSameDay,
  createDateKey,
} from '../utils/calendar';

// ============================================
// TYPES
// ============================================

export interface UseSpectacleBookingReturn {
  /** Donnees du spectacle */
  show: ReturnType<typeof usePublicShow>['show'];
  isLoading: boolean;
  notFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  slug: string;

  /** Montage client */
  isMounted: boolean;

  /** Role admin */
  isAdminRole: boolean;
  isRoleLoading: boolean;

  /** Etape courante */
  currentStep: Step;
  activeStepNumber: number;

  /** Calendrier */
  currentMonth: Date;
  calendarDays: (Date | null)[];
  datesWithSlots: Set<string>;
  selectedDate: Date | null;

  /** Creneaux */
  slotsForSelectedDate: TimeSlot[];
  selectedSlot: TimeSlot | null;

  /** Participants */
  participantCount: number;
  maxReservations: number;

  /** Formulaire */
  formData: ReservationFormData;
  isSubmitting: boolean;
  submitError: string | null;

  /** Description et image */
  duration: string;
  description: string;
  hasImage: boolean;
  showFullDescription: boolean;
  isComingSoon: boolean;

  /** Auth modal */
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;

  /** Doublon */
  duplicateInfo: DuplicateCheckResult | null;
  showDuplicateDialog: boolean;

  /** Handlers */
  handleDayClick: (date: Date | null) => void;
  handleSlotSelect: (slot: TimeSlot) => void;
  handleBack: () => void;
  handleParticipantChange: (delta: number) => void;
  handleContinueToForm: () => Promise<void>;
  handleFormDataChange: (updates: Partial<ReservationFormData>) => void;
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  handleConfirmDuplicate: () => Promise<void>;
  handleCancelDuplicate: () => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  onImageError: () => void;
  onToggleDescription: () => void;
  setFormData: React.Dispatch<React.SetStateAction<ReservationFormData>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
}

// ============================================
// HOOK
// ============================================

export function useSpectacleBooking(): UseSpectacleBookingReturn {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Etat pour eviter les erreurs d'hydratation
  const [isMounted, setIsMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Hook Supabase pour charger le spectacle
  const { show, isLoading, notFound, error, refresh } = usePublicShow(slug);

  // Hook pour detecter si l'utilisateur est un admin
  const { isAdminRole, isLoading: isRoleLoading } = useCurrentUserRole();

  // Convertir les slots Supabase en TimeSlots pour le calendrier
  const timeSlots = useMemo(() => {
    if (!show) return [];
    return show.slots.map(convertToTimeSlot);
  }, [show]);

  // Calculer le mois initial base sur le premier slot disponible
  const initialMonth = useMemo(() => {
    if (timeSlots.length === 0) {
      return new Date();
    }
    const firstSlot = timeSlots[0];
    return new Date(firstSlot.date.getFullYear(), firstSlot.date.getMonth(), 1);
  }, [timeSlots]);

  // Etats
  const [currentStep, setCurrentStep] = useState<Step>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);

  // Formulaire
  const [formData, setFormData] = useState<ReservationFormData>(INITIAL_FORM_DATA);

  // Etats de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // S184 : Detection de doublons (avertissement, ne bloque pas)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Fix d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset du mois courant quand les donnees changent
  useEffect(() => {
    if (timeSlots.length > 0) {
      const firstSlot = timeSlots[0];
      setCurrentMonth(new Date(firstSlot.date.getFullYear(), firstSlot.date.getMonth(), 1));
    }
  }, [timeSlots]);

  // Reset des etats quand le slug change (navigation entre spectacles)
  useEffect(() => {
    setCurrentStep('calendar');
    setSelectedDate(null);
    setSelectedSlot(null);
    setParticipantCount(1);
    setShowAuthModal(false);
    setShowFullDescription(false);
    setImageError(false);
    setSubmitError(null);
    setFormData(INITIAL_FORM_DATA);
  }, [slug]);

  // Pre-remplissage du formulaire depuis le profil si l'utilisateur est connecte
  useEffect(() => {
    if (currentStep !== 'form') return;

    const prefillFromProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, email, phone, email2, phone2, address, postal_code, city, country, structure, function, afc_number'
        )
        .eq('id', user.id)
        .single();

      if (!profile) return;

      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || profile.first_name || '',
        lastName: prev.lastName || profile.last_name || '',
        email: prev.email || profile.email || '',
        phone: prev.phone || profile.phone || '',
        emailSecondary: prev.emailSecondary || profile.email2 || '',
        phoneSecondary: prev.phoneSecondary || profile.phone2 || '',
        address: prev.address || profile.address || '',
        postalCode: prev.postalCode || profile.postal_code || '',
        city: prev.city || profile.city || '',
        country: profile.country || prev.country || 'France',
        organization: prev.organization || profile.structure || '',
        function: prev.function || profile.function || '',
        afcNumber: prev.afcNumber || profile.afc_number || '',
      }));
    };

    void prefillFromProfile();
  }, [currentStep]);

  // Verifier si le spectacle est "bientot reservable"
  const isComingSoon =
    show?.status === 'draft' || (show?.status === 'published' && timeSlots.length === 0);

  // Nombre max de participants par reservation
  const maxReservations = show?.maxReservationsPerBooking ?? DEFAULT_MAX_RESERVATIONS;

  // Trouver les dates avec creneaux DISPONIBLES pour le mois courant
  const datesWithSlots = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const slotsInMonth = timeSlots.filter((slot) => {
      const hasCapacity = slot.remainingCapacity === null || slot.remainingCapacity > 0;
      return slot.date.getFullYear() === year && slot.date.getMonth() === month && hasCapacity;
    });

    const dates = new Set<string>();
    slotsInMonth.forEach((slot) => {
      dates.add(createDateKey(slot.date));
    });

    return dates;
  }, [currentMonth, timeSlots]);

  // Creneaux pour la date selectionnee
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return timeSlots.filter((slot) => isSameDay(slot.date, selectedDate));
  }, [selectedDate, timeSlots]);

  // Generer la grille du calendrier
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = getFirstDayOfMonth(year, month);
    const lastDay = getLastDayOfMonth(year, month);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Valeurs calculees
  const duration = show ? formatDuration(show.durationMinutes) : '';
  const description = show
    ? show.longDescription || show.shortDescription || 'Description du spectacle.'
    : '';
  const hasImage = !!(show?.imageUrl && !imageError);

  const activeStepNumber =
    currentStep === 'calendar' || currentStep === 'time'
      ? 1
      : currentStep === 'participants'
        ? 2
        : 3;

  // ============================================
  // HANDLERS
  // ============================================

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  }, []);

  const handleDayClick = useCallback(
    (date: Date | null) => {
      if (!date) return;
      const key = createDateKey(date);
      if (!datesWithSlots.has(key)) return;
      setSelectedDate(date);
      setCurrentStep('time');
    },
    [datesWithSlots]
  );

  const handleSlotSelect = useCallback(
    (slot: TimeSlot) => {
      if (isAdminRole) return;
      setSelectedSlot(slot);
      setCurrentStep('participants');
    },
    [isAdminRole]
  );

  const handleBack = useCallback(() => {
    if (currentStep === 'time') {
      setCurrentStep('calendar');
      setSelectedDate(null);
    } else if (currentStep === 'participants') {
      setCurrentStep('time');
      setSelectedSlot(null);
    } else if (currentStep === 'form') {
      setCurrentStep('participants');
    }
  }, [currentStep]);

  const handleParticipantChange = useCallback(
    (delta: number) => {
      setParticipantCount((prev) => {
        const newValue = prev + delta;
        if (newValue < 1) return 1;
        if (newValue > maxReservations) return maxReservations;
        return newValue;
      });
    },
    [maxReservations]
  );

  const handleContinueToForm = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentStep('form');
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const handleFormDataChange = useCallback((updates: Partial<ReservationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // S184 : Creer la reservation (appele directement ou apres confirmation doublon)
  const submitReservation = useCallback(async () => {
    if (!selectedSlot || !selectedDate || !show) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createReservation({
        slotId: selectedSlot.id,
        numPlaces: participantCount,
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          emailSecondary: formData.emailSecondary || undefined,
          phone: formData.phone,
          phoneSecondary: formData.phoneSecondary || undefined,
          address: formData.address || undefined,
          postalCode: formData.postalCode || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
          organization: formData.organization || undefined,
          function: formData.function || undefined,
          afcNumber: formData.afcNumber || undefined,
          comment: formData.comment || undefined,
        },
      });

      if (!result.success || !result.data) {
        setSubmitError(result.error || 'Une erreur est survenue.');
        setIsSubmitting(false);
        return;
      }

      // Formater la date pour l'URL (YYYY-MM-DD)
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      // Formater l'heure pour l'URL (HH:MM)
      const timeStr = selectedSlot.time.replace('h', ':');

      const confirmationUrl =
        `/spectacle/${slug}/confirmation?` +
        new URLSearchParams({
          id: result.data.reservationId,
          places: String(participantCount),
          date: dateStr,
          time: timeStr,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        }).toString();

      // Enrichir le profil si l'utilisateur est connecte (non-bloquant)
      void enrichUserProfile(formData);

      // Envoyer l'email de confirmation (non-bloquant)
      void (async () => {
        try {
          if (!result.data) return;
          const dateFormattedForEmail = selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          const slotDateFormatted =
            dateFormattedForEmail.charAt(0).toUpperCase() + dateFormattedForEmail.slice(1);

          await fetch('/api/emails/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: formData.email,
              guestFullName: `${formData.firstName} ${formData.lastName}`.trim(),
              reservationCode: result.data.code,
              reservationId: result.data.reservationId,
              showTitle: show.title,
              showSlug: show.slug,
              companyName: show.companyName,
              slotDateFormatted,
              slotTimeFormatted: selectedSlot.time,
              venueName: selectedSlot.venueName,
              venueCity: selectedSlot.venueCity,
              numPlaces: participantCount,
            }),
          });
        } catch {
          // Silencieux : un echec email ne doit jamais bloquer la reservation
        }
      })();

      router.push(confirmationUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  }, [selectedSlot, selectedDate, show, participantCount, formData, slug, router]);

  // S184 : Gerer la soumission du formulaire avec detection de doublons
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedSlot || !selectedDate) return;
      if (isSubmitting) return;

      setSubmitError(null);

      const email = formData.email.trim();
      if (email) {
        setIsSubmitting(true);
        const dupResult = await checkDuplicateReservation(selectedSlot.id, email);
        setIsSubmitting(false);

        if (dupResult.hasDuplicate) {
          setDuplicateInfo(dupResult);
          setShowDuplicateDialog(true);
          return;
        }
      }

      await submitReservation();
    },
    [selectedSlot, selectedDate, isSubmitting, formData.email, submitReservation]
  );

  // S184 : Confirmer la creation malgre le doublon
  const handleConfirmDuplicate = useCallback(async () => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
    await submitReservation();
  }, [submitReservation]);

  // S184 : Annuler la creation (doublon detecte)
  const handleCancelDuplicate = useCallback(() => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
  }, []);

  const onImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const onToggleDescription = useCallback(() => {
    setShowFullDescription((prev) => !prev);
  }, []);

  return {
    show,
    isLoading,
    notFound,
    error,
    refresh,
    slug,
    isMounted,
    isAdminRole,
    isRoleLoading,
    currentStep,
    activeStepNumber,
    currentMonth,
    calendarDays,
    datesWithSlots,
    selectedDate,
    slotsForSelectedDate,
    selectedSlot,
    participantCount,
    maxReservations,
    formData,
    isSubmitting,
    submitError,
    duration,
    description,
    hasImage,
    showFullDescription,
    isComingSoon,
    showAuthModal,
    setShowAuthModal,
    duplicateInfo,
    showDuplicateDialog,
    handleDayClick,
    handleSlotSelect,
    handleBack,
    handleParticipantChange,
    handleContinueToForm,
    handleFormDataChange,
    handleFormSubmit,
    handleConfirmDuplicate,
    handleCancelDuplicate,
    goToPreviousMonth,
    goToNextMonth,
    onImageError,
    onToggleDescription,
    setFormData,
    setCurrentStep,
  };
}
