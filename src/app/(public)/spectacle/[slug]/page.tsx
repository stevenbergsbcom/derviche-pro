'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { SafeHtml } from '@/components/ui/safe-html';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Clock,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Users,
    Globe,
    ChevronDown,
    ChevronUp,
    Info,
    Calendar,
    LogIn,
    UserPlus,
    Minus,
    Plus,
    Loader2,
    AlertTriangle,
    Drama,
} from 'lucide-react';
import { usePublicShow } from '@/hooks/usePublicShow';
import type { PublicSlot } from '@/lib/services/public-catalog';
import { createReservation } from '@/lib/services/reservations';

// ============================================
// TYPES
// ============================================

/** TimeSlot interne avec date en objet Date (pour le calendrier) */
interface TimeSlot {
    id: string;
    date: Date;
    time: string; // Format "11h00"
    /** null = illimité */
    remainingCapacity: number | null;
    /** null = illimité */
    totalCapacity: number | null;
    venueId: string;
    venueName: string;
    venueCity: string;
}

type Step = 'calendar' | 'time' | 'participants' | 'form';

/** Valeur par défaut si le spectacle n'a pas de max défini */
const DEFAULT_MAX_RESERVATIONS = 3;

// ============================================
// HELPERS
// ============================================

/**
 * Convertir un PublicSlot en TimeSlot pour le calendrier
 */
function convertToTimeSlot(slot: PublicSlot): TimeSlot {
    // Parser la date ISO en objet Date local
    const [year, month, day] = slot.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month est 0-indexed

    // Convertir l'heure "11:00" → "11h00"
    const time = slot.time.replace(':', 'h');

    return {
        id: slot.id,
        date: dateObj,
        time,
        remainingCapacity: slot.remainingCapacity,
        totalCapacity: slot.capacity,
        venueId: slot.venueId,
        venueName: slot.venueName,
        venueCity: slot.venueCity,
    };
}

/**
 * Formater la durée en minutes en texte lisible
 */
function formatDuration(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return 'Durée non précisée';
    if (minutes === 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
}

/**
 * Construire la période à partir des slots
 */
function buildPeriod(slots: TimeSlot[]): string {
    if (slots.length === 0) return 'Dates à venir';

    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];

    const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

    if (slots.length === 1) {
        return `Le ${formatDate(firstSlot.date)}`;
    }

    return `Du ${formatDate(firstSlot.date)} au ${formatDate(lastSlot.date)}`;
}

// Fonction pour obtenir le premier jour du mois
function getFirstDayOfMonth(year: number, month: number): Date {
    return new Date(year, month, 1);
}

// Fonction pour obtenir le dernier jour du mois
function getLastDayOfMonth(year: number, month: number): Date {
    return new Date(year, month + 1, 0);
}

// Fonction pour formater le mois/année
function formatMonthYear(date: Date): string {
    const months = [
        'janvier',
        'février',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'août',
        'septembre',
        'octobre',
        'novembre',
        'décembre',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Fonction pour comparer deux dates (sans l'heure)
function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Créer une clé de date cohérente pour le Set (format: YYYY-M-D)
 * Utilise un format simple mais cohérent entre création et lookup
 */
function createDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// ============================================
// COMPOSANT PLACEHOLDER IMAGE
// ============================================

function ImagePlaceholder({ title }: { title: string }) {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-derviche/20 to-derviche/40 flex flex-col items-center justify-center p-4">
            <Drama className="w-16 h-16 text-muted-foreground/50 mb-2" />
            <p className="text-derviche-dark/80 text-sm font-medium text-center line-clamp-2">
                {title}
            </p>
        </div>
    );
}

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
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        email: '',
        emailSecondary: '',
        phone: '',
        phoneSecondary: '',
        address: '',
        postalCode: '',
        city: '',
        organization: '',
        function: '',
        comment: '',
    });

    // États de soumission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

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
        setFormData({
            lastName: '',
            firstName: '',
            email: '',
            emailSecondary: '',
            phone: '',
            phoneSecondary: '',
            address: '',
            postalCode: '',
            city: '',
            organization: '',
            function: '',
            comment: '',
        });
    }, [slug]);

    // Vérifier si le spectacle est "bientôt réservable"
    const isComingSoon = show?.status === 'draft' || (show?.status === 'published' && timeSlots.length === 0);

    // Nombre max de participants par réservation (depuis le spectacle ou valeur par défaut)
    const maxReservations = show?.maxReservationsPerBooking ?? DEFAULT_MAX_RESERVATIONS;

    // Trouver les dates avec créneaux DISPONIBLES pour le mois courant
    const datesWithSlots = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const slotsInMonth = timeSlots.filter((slot) => {
            const hasCapacity = slot.remainingCapacity === null || slot.remainingCapacity > 0;
            return slot.date.getFullYear() === year &&
                slot.date.getMonth() === month &&
                hasCapacity;
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
                    <p className="text-muted-foreground mb-6">Ce spectacle n&apos;existe pas ou n&apos;est plus disponible.</p>
                    <Button asChild>
                        <Link href="/catalogue">Retour au catalogue</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    // Données calculées pour l'affichage
    const duration = formatDuration(show.durationMinutes);
    const period = buildPeriod(timeSlots);
    const description = show.longDescription || show.shortDescription || 'Description du spectacle.';
    const hasImage = show.imageUrl && !imageError;

    // Navigation mois
    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    // Vérifier si une date a des créneaux
    const hasSlots = (date: Date | null): boolean => {
        if (!date) return false;
        return datesWithSlots.has(createDateKey(date));
    };

    // Gérer le clic sur un jour
    const handleDayClick = (date: Date | null) => {
        if (!date || !hasSlots(date)) return;
        setSelectedDate(date);
        setCurrentStep('time');
    };

    // Vérifier si un jour est sélectionné
    const isSelected = (date: Date | null): boolean => {
        if (!date || !selectedDate) return false;
        return isSameDay(date, selectedDate);
    };

    // Gérer la sélection d'un créneau
    const handleSlotSelect = (slot: TimeSlot) => {
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

    // Gérer la soumission du formulaire
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSlot || !selectedDate) return;

        // Éviter les doubles soumissions
        if (isSubmitting) return;

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
                    organization: formData.organization || undefined,
                    function: formData.function || undefined,
                    comment: formData.comment || undefined,
                },
                // userId: null pour l'instant (guest)
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
            const confirmationUrl = `/spectacle/${slug}/confirmation?` + new URLSearchParams({
                id: result.data.reservationId,
                places: String(participantCount),
                date: dateStr,
                time: timeStr,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
            }).toString();

            // Rediriger vers la page de confirmation
            router.push(confirmationUrl);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur inattendue';
            setSubmitError(message);
            setIsSubmitting(false);
        }
    };

    // Déterminer l'étape active pour le fil d'Ariane
    const getActiveStepNumber = (): number => {
        if (currentStep === 'calendar' || currentStep === 'time') return 1;
        if (currentStep === 'participants') return 2;
        return 3;
    };

    const activeStepNumber = getActiveStepNumber();

    // Rendu du fil d'Ariane
    const renderStepsIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${activeStepNumber >= 1 ? 'text-derviche' : 'text-muted-foreground'}`}>
                <span className={`text-sm font-medium ${activeStepNumber === 1 ? 'font-bold' : ''}`}>
                    ① Créneau
                </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${activeStepNumber >= 2 ? 'text-derviche' : 'text-muted-foreground'}`}>
                <span className={`text-sm font-medium ${activeStepNumber === 2 ? 'font-bold' : ''}`}>
                    ② Participants
                </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${activeStepNumber >= 3 ? 'text-derviche' : 'text-muted-foreground'}`}>
                <span className={`text-sm font-medium ${activeStepNumber === 3 ? 'font-bold' : ''}`}>
                    ③ Vos informations
                </span>
            </div>
        </div>
    );

    // Rendu de l'étape calendar
    const renderCalendarStep = () => (
        <>
            <h2 className="text-xl font-bold text-derviche-dark mb-6">
                {isComingSoon ? 'Réservations bientôt disponibles' : 'Sélectionnez la date et l’heure'}
            </h2>

            {/* Message si spectacle bientôt réservable */}
            {isComingSoon && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div className="text-sm text-foreground">
                            <p className="font-medium mb-1">Bientôt réservable</p>
                            <p className="text-muted-foreground">
                                Les réservations pour ce spectacle ne sont pas encore ouvertes. Revenez bientôt !
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendrier uniquement si pas coming_soon */}
            {!isComingSoon && (
                <>
                    {/* Navigation mois */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPreviousMonth}
                            className="rounded-full h-8 w-8"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="text-lg font-semibold text-derviche-dark capitalize">
                            {formatMonthYear(currentMonth)}
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNextMonth}
                            className="rounded-full h-8 w-8"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Grille calendrier */}
                    <div className="mb-6">
                        {/* En-têtes jours */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'].map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-xs font-medium text-muted-foreground py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Jours du mois */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((date, index) => {
                                if (!date) {
                                    return <div key={`empty-${index}`} className="aspect-square" />;
                                }

                                const hasSlotsForDate = hasSlots(date);
                                const isDateSelected = isSelected(date);

                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => handleDayClick(date)}
                                        disabled={!hasSlotsForDate}
                                        className={`
                                            aspect-square rounded-lg text-sm font-medium transition-colors
                                            ${isDateSelected
                                                ? 'bg-derviche text-white'
                                                : hasSlotsForDate
                                                    ? 'bg-derviche/10 text-derviche hover:bg-derviche/20 cursor-pointer'
                                                    : 'text-muted-foreground/30 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fuseau horaire */}
                    <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>Fuseau horaire : Heure d&apos;Europe centrale</span>
                    </div>
                </>
            )}
        </>
    );

    // Rendu de l'étape time
    const renderTimeStep = () => {
        // Filtrer uniquement les créneaux avec places disponibles
        const availableSlots = slotsForSelectedDate.filter((slot) => {
            return slot.remainingCapacity === null || slot.remainingCapacity > 0;
        });

        return (
            <>
                {selectedDate && (
                    <>
                        <h2 className="text-xl font-bold text-derviche-dark mb-4">
                            Créneaux disponibles le{' '}
                            {selectedDate.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </h2>
                        {availableSlots.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Aucun créneau disponible pour cette date.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {availableSlots.map((slot) => (
                                    <Button
                                        key={slot.id}
                                        variant="outline"
                                        onClick={() => handleSlotSelect(slot)}
                                        className="h-auto py-3 flex flex-col items-center hover:bg-derviche hover:text-white hover:border-derviche"
                                    >
                                        <span className="font-semibold text-base">{slot.time}</span>
                                        <span className="text-xs opacity-70 mt-0.5">{slot.venueName}</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </>
        );
    };

    // Rendu de l'étape participants
    const renderParticipantsStep = () => (
        <>
            {/* Encart info warning */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                        <p className="font-medium mb-1">Pour les professionnels :</p>
                        <p>
                            1 invitation + détaxe, sur réservation - Contact pour toute précision sur votre réservation : Alexandra - 06 62 41 95 51 - reservation.derviche@gmail.com
                        </p>
                    </div>
                </div>
            </div>

            {/* Encart info success */}
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                        Une invitation calendrier sera envoyée automatiquement avec votre réservation
                    </p>
                </div>
            </div>

            {/* Nombre de participants */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-derviche-dark mb-4">
                    Combien de personnes assisteront à la représentation ?
                </h3>
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleParticipantChange(-1)}
                        disabled={participantCount <= 1}
                        className="rounded-full h-10 w-10"
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Users className="w-6 h-6 text-derviche" />
                        <span className="text-2xl font-bold text-derviche-dark w-8 text-center">
                            {participantCount}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleParticipantChange(1)}
                        disabled={participantCount >= maxReservations}
                        className="rounded-full h-10 w-10"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                    Maximum {maxReservations} personne{maxReservations > 1 ? 's' : ''} par réservation
                </p>
            </div>

            {/* Bouton continuer */}
            <Button
                className="w-full bg-derviche hover:bg-derviche-dark text-white"
                onClick={() => setShowAuthModal(true)}
            >
                Continuer
            </Button>
        </>
    );

    // Rendu de l'étape form
    const renderFormStep = () => (
        <>
            {/* Récapitulatif */}
            {selectedSlot && (
                <Card className="bg-muted mb-6">
                    <CardContent className="p-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-derviche" />
                                <span>
                                    {selectedSlot.date.toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })} à {selectedSlot.time}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-derviche" />
                                <span>{participantCount} personne{participantCount > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-derviche" />
                                <span>{selectedSlot.venueName}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Formulaire */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                            id="lastName"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                            id="firstName"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emailSecondary">Email secondaire</Label>
                        <Input
                            id="emailSecondary"
                            type="email"
                            value={formData.emailSecondary}
                            onChange={(e) => setFormData({ ...formData, emailSecondary: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input
                            id="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phoneSecondary">Téléphone secondaire</Label>
                        <Input
                            id="phoneSecondary"
                            type="tel"
                            value={formData.phoneSecondary}
                            onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="postalCode">Code postal</Label>
                        <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="organization">Structure / Organisation</Label>
                        <Input
                            id="organization"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="function">Fonction</Label>
                        <Input
                            id="function"
                            value={formData.function}
                            onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="comment">Commentaire</Label>
                    <Textarea
                        id="comment"
                        rows={4}
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    />
                </div>

                {/* Affichage de l'erreur si présente */}
                {submitError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive">{submitError}</p>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-derviche hover:bg-derviche-dark text-white disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Réservation en cours...
                        </>
                    ) : (
                        'Confirmer ma réservation'
                    )}
                </Button>
            </form>
        </>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Bouton retour */}
            <div className="container mx-auto px-4 py-4">
                <Button
                    variant="ghost"
                    className="text-derviche hover:text-derviche-dark"
                    asChild
                >
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
                                {/* Colonne gauche - Infos (1/2) */}
                                <div className="lg:border-r border-border">
                                    {/* Bandeau image du spectacle */}
                                    <div className="relative w-full aspect-video">
                                        {hasImage ? (
                                            <Image
                                                src={show.imageUrl!}
                                                alt={show.title}
                                                fill
                                                className="object-cover"
                                                priority
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <ImagePlaceholder title={show.title} />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <p className="text-white/80 text-sm mb-1">Derviche Diffusion</p>
                                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                                {show.title}
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Infos sous l'image */}
                                    <div className="p-6 md:p-8 space-y-4">
                                        {/* Durée */}
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{duration}</span>
                                        </div>

                                        {/* Lieu(x) */}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-derviche mt-0.5 shrink-0" />
                                            <div>
                                                {show.venues.length === 0 ? (
                                                    <p className="font-semibold text-sm text-derviche-dark">Lieu à définir</p>
                                                ) : show.venues.length === 1 ? (
                                                    <>
                                                        <p className="font-semibold text-sm text-derviche-dark">
                                                            {show.venues[0].name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {show.venues[0].city}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-semibold text-sm text-derviche-dark mb-1">
                                                            {show.venues.length} lieux
                                                        </p>
                                                        <ul className="text-sm text-muted-foreground space-y-0.5">
                                                            {show.venues.map((venue) => (
                                                                <li key={venue.id}>
                                                                    • {venue.name}, {venue.city}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Compagnie */}
                                        <div>
                                            <p className="text-sm font-medium text-derviche">Compagnie</p>
                                            <p className="text-sm text-foreground">{show.companyName}</p>
                                        </div>

                                        {/* Période */}
                                        <div>
                                            <p className="text-sm font-medium text-derviche">Période</p>
                                            <p className="text-sm text-foreground">{period}</p>
                                        </div>

                                        {/* Description avec "Lire la suite" */}
                                        <div className="pt-4 border-t border-border">
                                            <SafeHtml
                                                html={description}
                                                className={`text-sm text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-3 [&_p]:m-0' : ''}`}
                                                disableProse={!showFullDescription}
                                            />
                                            <button
                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                                className="flex items-center gap-1 text-sm font-medium text-derviche hover:text-derviche-dark mt-2 transition-colors cursor-pointer"
                                            >
                                                {showFullDescription ? (
                                                    <>
                                                        Voir moins
                                                        <ChevronUp className="w-4 h-4" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Lire la suite
                                                        <ChevronDown className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Colonne droite - Étapes (1/2) */}
                                <div className="p-6 md:p-8">
                                    {/* Fil d'Ariane */}
                                    {renderStepsIndicator()}

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
                                        {currentStep === 'calendar' && renderCalendarStep()}
                                        {currentStep === 'time' && renderTimeStep()}
                                        {currentStep === 'participants' && renderParticipantsStep()}
                                        {currentStep === 'form' && renderFormStep()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modale d'authentification */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer un compte ou continuer</DialogTitle>
                        <DialogDescription>
                            Pour faciliter vos futures réservations, vous pouvez créer un compte ou vous connecter.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            className="w-full bg-derviche hover:bg-derviche-dark text-white"
                            onClick={() => router.push('/login')}
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Se connecter
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/register')}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Créer un compte
                        </Button>
                        <button
                            onClick={() => {
                                setShowAuthModal(false);
                                setCurrentStep('form');
                            }}
                            className="text-sm text-muted-foreground hover:text-derviche text-center mt-2 cursor-pointer"
                        >
                            Continuer sans compte
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
