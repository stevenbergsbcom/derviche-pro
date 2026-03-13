'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth';
import type { AuthSuccessData } from '@/components/auth';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { usePublicShow } from '@/hooks/usePublicShow';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { createReservation, enrichUserProfile } from '@/lib/services/reservations';
import { checkDuplicateReservation } from '@/lib/services/reservations-duplicate';
import type { DuplicateCheckResult } from '@/lib/services/reservations-duplicate';
import { DuplicateReservationDialog } from '@/components/shared';
import { createClient } from '@/lib/supabase/client';
import { formatDuration } from '@/lib/utils/shows';

import type { TimeSlot, Step, ReservationFormData } from './types';
import { DEFAULT_MAX_RESERVATIONS, INITIAL_FORM_DATA } from './types';
import {
  convertToTimeSlot,
  buildPeriod,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isSameDay,
  createDateKey,
} from './utils/calendar';
import {
  AdminBlockBanner,
  StepsIndicator,
  CalendarStep,
  TimeStep,
  ParticipantsStep,
  ReservationFormStep,
  ShowDetailSidebar,
} from './components';

// ============================================
// COMPOSANT PAGE
// ============================================

export default function SpectacleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // État pour éviter les erreurs d'hydratation
  const [isMounted, setIsMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Hook Supabase pour charger le spectacle
  const { show, isLoading, notFound, error, refresh } = usePublicShow(slug);

  // Hook pour détecter si l'utilisateur est un admin
  const { isAdminRole, isLoading: isRoleLoading } = useCurrentUserRole();

  // Convertir les slots Supabase en TimeSlots pour le calendrier
  const timeSlots = useMemo(() => {
    if (!show) return [];
    return show.slots.map(convertToTimeSlot);
  }, [show]);

  // Calculer le mois initial basé sur le premier slot disponible
  const initialMonth = useMemo(() => {
    if (timeSlots.length === 0) {
      return new Date(); // Mois actuel par défaut
    }
    const firstSlot = timeSlots[0];
    return new Date(firstSlot.date.getFullYear(), firstSlot.date.getMonth(), 1);
  }, [timeSlots]);

  // États
  const [currentStep, setCurrentStep] = useState<Step>('calendar');
  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);

  // Formulaire
  const [formData, setFormData] = useState<ReservationFormData>(INITIAL_FORM_DATA);

  // États de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // S184 : Détection de doublons (avertissement, ne bloque pas)
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Fix d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset du mois courant quand les données changent
  useEffect(() => {
    if (timeSlots.length > 0) {
      const firstSlot = timeSlots[0];
      setCurrentMonth(new Date(firstSlot.date.getFullYear(), firstSlot.date.getMonth(), 1));
    }
  }, [timeSlots]);

  // Reset des états quand le slug change (navigation entre spectacles)
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

  // Pré-remplissage du formulaire depuis le profil si l'utilisateur est connecté
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

  // Vérifier si le spectacle est "bientôt réservable"
  const isComingSoon =
    show?.status === 'draft' || (show?.status === 'published' && timeSlots.length === 0);

  // Nombre max de participants par réservation (depuis le spectacle ou valeur par défaut)
  const maxReservations = show?.maxReservationsPerBooking ?? DEFAULT_MAX_RESERVATIONS;

  // Trouver les dates avec créneaux DISPONIBLES pour le mois courant
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

  // Créneaux pour la date sélectionnée
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return timeSlots.filter((slot) => isSameDay(slot.date, selectedDate));
  }, [selectedDate, timeSlots]);

  // Générer la grille du calendrier
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

  // ============================================
  // EARLY RETURNS
  // ============================================

  // Attendre que le composant soit monté
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-derviche mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du spectacle...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">Erreur : {error}</p>
          <Button onClick={() => void refresh()} variant="outline">
            Réessayer
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Si spectacle non trouvé
  if (notFound || !show) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-derviche-dark mb-4">Spectacle non trouvé</h1>
          <p className="text-muted-foreground mb-6">
            Ce spectacle n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Button asChild>
            <Link href="/catalogue">Retour au catalogue</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const duration = formatDuration(show.durationMinutes);
  const period = buildPeriod(timeSlots);
  const description = show.longDescription || show.shortDescription || 'Description du spectacle.';
  const hasImage = show.imageUrl && !imageError;

  // Étape active pour le fil d'Ariane
  const activeStepNumber =
    currentStep === 'calendar' || currentStep === 'time'
      ? 1
      : currentStep === 'participants'
        ? 2
        : 3;

  // ============================================
  // HANDLERS
  // ============================================

  // Navigation mois
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Gérer le clic sur un jour
  const handleDayClick = (date: Date | null) => {
    if (!date) return;
    const key = createDateKey(date);
    if (!datesWithSlots.has(key)) return;
    setSelectedDate(date);
    setCurrentStep('time');
  };

  // Gérer la sélection d'un créneau
  const handleSlotSelect = (slot: TimeSlot) => {
    if (isAdminRole) return; // Les admins ne peuvent pas réserver côté public
    setSelectedSlot(slot);
    setCurrentStep('participants');
  };

  // Gérer le retour en arrière
  const handleBack = () => {
    if (currentStep === 'time') {
      setCurrentStep('calendar');
      setSelectedDate(null);
    } else if (currentStep === 'participants') {
      setCurrentStep('time');
      setSelectedSlot(null);
    } else if (currentStep === 'form') {
      setCurrentStep('participants');
    }
  };

  // Gérer le nombre de participants
  const handleParticipantChange = (delta: number) => {
    setParticipantCount((prev) => {
      const newValue = prev + delta;
      if (newValue < 1) return 1;
      if (newValue > maxReservations) return maxReservations;
      return newValue;
    });
  };

  // Gérer le clic sur "Continuer" à l'étape participants
  // Si déjà connecté → aller directement au formulaire
  // Sinon → ouvrir la modale d'authentification
  const handleContinueToForm = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentStep('form');
    } else {
      setShowAuthModal(true);
    }
  };

  // Handler pour mise à jour partielle du formulaire
  const handleFormDataChange = (updates: Partial<ReservationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // S184 : Créer la réservation (appelé directement ou après confirmation doublon)
  const submitReservation = async () => {
    if (!selectedSlot || !selectedDate) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Appeler le service de création de réservation
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

      // Formater l'heure pour l'URL (HH:MM) - convertir "11h00" en "11:00"
      const timeStr = selectedSlot.time.replace('h', ':');

      // Construire l'URL de confirmation avec les données
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

      // Enrichir le profil si l'utilisateur est connecté (Option C - non-bloquant)
      void enrichUserProfile(formData);

      // Envoyer l'email de confirmation (non-bloquant : n'empêche pas la redirection)
      void (async () => {
        try {
          if (!result.data) return;
          // Formater la date pour l'affichage dans l'email
          const dateFormattedForEmail = selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          // Capitaliser la première lettre
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
          // Silencieux : un échec email ne doit jamais bloquer la réservation
        }
      })();

      // Rediriger vers la page de confirmation
      router.push(confirmationUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  // S184 : Gérer la soumission du formulaire avec détection de doublons
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot || !selectedDate) return;
    if (isSubmitting) return;

    setSubmitError(null);

    // Vérifier les doublons avant de créer
    const email = formData.email.trim();
    if (email) {
      setIsSubmitting(true);
      const dupResult = await checkDuplicateReservation(selectedSlot.id, email);
      setIsSubmitting(false);

      if (dupResult.hasDuplicate) {
        setDuplicateInfo(dupResult);
        setShowDuplicateDialog(true);
        return; // Attendre la confirmation utilisateur
      }
    }

    // Pas de doublon → créer directement
    await submitReservation();
  };

  // S184 : Confirmer la création malgré le doublon
  const handleConfirmDuplicate = async () => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
    await submitReservation();
  };

  // S184 : Annuler la création (doublon détecté)
  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setDuplicateInfo(null);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Bouton retour */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" className="text-derviche hover:text-derviche-dark" asChild>
          <Link href="/catalogue" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </Link>
        </Button>
      </div>

      {/* Card principale - Layout Calendly */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-white rounded-xl shadow-lg overflow-hidden p-0">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Colonne gauche - Infos */}
                <ShowDetailSidebar
                  show={show}
                  hasImage={!!hasImage}
                  onImageError={() => setImageError(true)}
                  duration={duration}
                  period={period}
                  description={description}
                  showFullDescription={showFullDescription}
                  onToggleDescription={() => setShowFullDescription(!showFullDescription)}
                />

                {/* Colonne droite - Étapes */}
                <div className="p-6 md:p-8">
                  {/* Bandeau d'alerte pour les admins */}
                  <AdminBlockBanner isAdminRole={isAdminRole} isRoleLoading={isRoleLoading} />

                  {/* Fil d'Ariane */}
                  <StepsIndicator activeStepNumber={activeStepNumber} />

                  {/* Bouton retour (sauf étape calendar) */}
                  {currentStep !== 'calendar' && (
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      className="mb-4 text-derviche hover:text-derviche-dark"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                  )}

                  {/* Contenu selon l'étape */}
                  <div className="transition-all duration-300">
                    {currentStep === 'calendar' && (
                      <CalendarStep
                        isComingSoon={!!isComingSoon}
                        currentMonth={currentMonth}
                        calendarDays={calendarDays}
                        datesWithSlots={datesWithSlots}
                        selectedDate={selectedDate}
                        onDayClick={handleDayClick}
                        onPreviousMonth={goToPreviousMonth}
                        onNextMonth={goToNextMonth}
                      />
                    )}
                    {currentStep === 'time' && (
                      <TimeStep
                        selectedDate={selectedDate}
                        slotsForSelectedDate={slotsForSelectedDate}
                        isAdminRole={isAdminRole}
                        onSlotSelect={handleSlotSelect}
                      />
                    )}
                    {currentStep === 'participants' && (
                      <ParticipantsStep
                        participantCount={participantCount}
                        maxReservations={maxReservations}
                        onParticipantChange={handleParticipantChange}
                        onContinue={() => {
                          void handleContinueToForm();
                        }}
                      />
                    )}
                    {currentStep === 'form' && (
                      <ReservationFormStep
                        selectedSlot={selectedSlot}
                        participantCount={participantCount}
                        formData={formData}
                        isSubmitting={isSubmitting}
                        submitError={submitError}
                        onFormDataChange={handleFormDataChange}
                        onSubmit={handleFormSubmit}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* S184 : Modale de confirmation doublon */}
      <DuplicateReservationDialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          if (!open) handleCancelDuplicate();
        }}
        email={formData.email}
        existingReservation={duplicateInfo?.existingReservation}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
      />

      {/* Modale d'authentification */}
      <AuthDialog
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Gérez vos réservations facilement"
        description="Connectez-vous ou créez un compte pour retrouver toutes vos réservations. Vous pouvez aussi continuer sans compte."
        onSuccess={(data: AuthSuccessData) => {
          setFormData((prev) => ({
            ...prev,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
          }));
          setShowAuthModal(false);
          setCurrentStep('form');
        }}
        onContinueAsGuest={() => {
          setShowAuthModal(false);
          setCurrentStep('form');
        }}
      />

      <Footer />
    </div>
  );
}
