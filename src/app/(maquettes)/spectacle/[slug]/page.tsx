'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
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
} from 'lucide-react';
import {
    mockShows,
    mockRepresentations,
    mockVenues,
    type MockShow,
    type MockRepresentation,
} from '@/lib/mock-data';

// Types
interface TimeSlot {
    id: string;
    date: Date;
    time: string;
    remainingCapacity: number;
    totalCapacity: number;
    venueId: string;
    venueName: string;
}

interface SpectacleData {
    id: string;
    title: string;
    slug: string;
    company: string;
    description: string;
    duration: string;
    genre: string;
    pricing: string;
    image: string;
    venue: {
        name: string;
        address: string;
    };
    period: string;
    slots: TimeSlot[];
    status: 'available' | 'coming_soon' | 'closed';
}

type Step = 'calendar' | 'time' | 'participants' | 'form';

const MAX_RESERVATIONS_PER_BOOKING = 3;

// ============================================
// HELPERS
// ============================================

/**
 * Transformer un MockShow + ses représentations en SpectacleData pour cette page
 */
function transformToSpectacleData(show: MockShow, representations: MockRepresentation[]): SpectacleData {
    // Filtrer les représentations de ce spectacle
    const showReps = representations.filter((rep) => rep.showId === show.id);
    
    // Trier par date croissante
    const sortedReps = [...showReps].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
    });

    // Convertir en TimeSlots
    const slots: TimeSlot[] = sortedReps.map((rep) => {
        const [year, month, day] = rep.date.split('-').map(Number);
        return {
            id: rep.id,
            date: new Date(year, month - 1, day), // month est 0-indexed en JS
            time: rep.time.replace(':', 'h'), // "11:00" → "11h00"
            remainingCapacity: rep.capacity !== null ? rep.capacity - rep.booked : 999,
            totalCapacity: rep.capacity !== null ? rep.capacity : 999,
            venueId: rep.venueId,
            venueName: rep.venueName,
        };
    });

    // Trouver le premier lieu (pour l'affichage par défaut)
    const firstVenue = sortedReps[0] 
        ? mockVenues.find((v) => v.id === sortedReps[0].venueId)
        : null;

    // Déterminer le statut
    let status: 'available' | 'coming_soon' | 'closed' = 'available';
    if (show.status === 'draft') {
        status = 'coming_soon';
    } else if (show.status === 'archived') {
        status = 'closed';
    }

    // Construire la période à partir des dates
    let period = show.period || 'Dates à venir';
    if (sortedReps.length > 0 && status !== 'coming_soon') {
        const firstDate = new Date(sortedReps[0].date);
        const lastDate = new Date(sortedReps[sortedReps.length - 1].date);
        const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        period = `Du ${formatDate(firstDate)} au ${formatDate(lastDate)}`;
    }

    // Déterminer le pricing
    let pricing = 'Gratuit';
    if (show.priceType === 'paid_on_site') {
        pricing = 'Payant sur place';
    }

    return {
        id: show.id,
        title: show.title,
        slug: show.slug,
        company: show.companyName,
        description: show.description || show.shortDescription || 'Description du spectacle.',
        duration: show.duration ? `${show.duration} min` : '1h',
        genre: show.categories[0] || 'Spectacle',
        pricing,
        image: show.imageUrl || '/images/spectacles/placeholder.jpg',
        venue: {
            name: firstVenue?.name || 'Lieu à définir',
            address: firstVenue 
                ? `${firstVenue.address || ''}, ${firstVenue.postalCode || ''} ${firstVenue.city}`
                : 'Adresse à confirmer',
        },
        period,
        slots,
        status,
    };
}

/**
 * Récupérer les données d'un spectacle par son slug
 */
function getSpectacleBySlug(slug: string): SpectacleData | null {
    const show = mockShows.find((s) => s.slug === slug);
    if (!show) return null;
    return transformToSpectacleData(show, mockRepresentations);
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

// ============================================
// COMPOSANT PAGE
// ============================================

export default function SpectacleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    // État pour éviter les erreurs d'hydratation
    const [isMounted, setIsMounted] = useState(false);

    // Récupérer les données du spectacle selon le slug
    const spectacleData = useMemo(() => {
        return getSpectacleBySlug(slug);
    }, [slug]);

    // Calculer le mois initial basé sur le premier slot disponible
    const initialMonth = useMemo(() => {
        if (!spectacleData || spectacleData.slots.length === 0) {
            return new Date(); // Mois actuel par défaut
        }
        // Prendre le mois du premier slot
        const firstSlot = spectacleData.slots[0];
        return new Date(firstSlot.date.getFullYear(), firstSlot.date.getMonth(), 1);
    }, [spectacleData]);

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

    // Fix d'hydratation
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Reset des états quand le slug change (navigation entre spectacles)
    useEffect(() => {
        setCurrentStep('calendar');
        setCurrentMonth(initialMonth);
        setSelectedDate(null);
        setSelectedSlot(null);
        setParticipantCount(1);
        setShowAuthModal(false);
        setShowFullDescription(false);
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
    }, [slug, initialMonth]);

    // Si spectacle non trouvé
    if (!spectacleData) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold text-derviche-dark mb-4">Spectacle non trouvé</h1>
                    <p className="text-muted-foreground mb-6">Ce spectacle n'existe pas ou n'est plus disponible.</p>
                    <Button asChild>
                        <Link href="/catalogue">Retour au catalogue</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

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

    // Vérifier si le spectacle est "bientôt réservable"
    const isComingSoon = spectacleData.status === 'coming_soon';

    // Trouver les dates avec créneaux DISPONIBLES pour le mois courant
    const datesWithSlots = (() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const slotsInMonth = spectacleData.slots.filter((slot) => {
            return slot.date.getFullYear() === year && 
                   slot.date.getMonth() === month &&
                   slot.remainingCapacity > 0; // Seulement les créneaux disponibles
        });

        const dates = new Set<string>();
        slotsInMonth.forEach((slot) => {
            const dateKey = `${slot.date.getFullYear()}-${slot.date.getMonth()}-${slot.date.getDate()}`;
            dates.add(dateKey);
        });

        return dates;
    })();

    // Créneaux pour la date sélectionnée
    const slotsForSelectedDate = (() => {
        if (!selectedDate) return [];
        return spectacleData.slots.filter((slot) => isSameDay(slot.date, selectedDate));
    })();

    // Générer la grille du calendrier
    const calendarDays = (() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = getFirstDayOfMonth(year, month);
        const lastDay = getLastDayOfMonth(year, month);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

        const days: (Date | null)[] = [];

        // Jours vides au début
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    })();

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
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return datesWithSlots.has(dateKey);
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
            if (newValue > MAX_RESERVATIONS_PER_BOOKING) return MAX_RESERVATIONS_PER_BOOKING;
            return newValue;
        });
    };

    // Gérer la soumission du formulaire
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSlot || !selectedDate) return;
        
        // Générer un ID mock pour la réservation
        const mockReservationId = crypto.randomUUID();
        
        // Formater la date pour l'URL (YYYY-MM-DD)
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        
        // Formater l'heure pour l'URL (HH:MM) - convertir "11h00" en "11:00"
        const timeStr = selectedSlot.time.replace('h', ':');
        
        // Construire l'URL de confirmation avec les données
        const confirmationUrl = `/spectacle/${slug}/confirmation?` + new URLSearchParams({
            id: mockReservationId,
            places: String(participantCount),
            date: dateStr,
            time: timeStr,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
        }).toString();
        
        // Rediriger vers la page de confirmation
        router.push(confirmationUrl);
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
                {isComingSoon ? 'Réservations bientôt disponibles' : 'Sélectionnez la date et l\'heure'}
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
                        <span>Fuseau horaire : Heure d'Europe centrale</span>
                    </div>
                </>
            )}
        </>
    );

    // Rendu de l'étape time
    const renderTimeStep = () => {
        // Filtrer uniquement les créneaux avec places disponibles
        const availableSlots = slotsForSelectedDate.filter((slot) => slot.remainingCapacity > 0);

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
                                        className="hover:bg-derviche hover:text-white hover:border-derviche"
                                    >
                                        <span className="font-medium">{slot.time}</span>
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
                        disabled={participantCount >= MAX_RESERVATIONS_PER_BOOKING}
                        className="rounded-full h-10 w-10"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                    Maximum {MAX_RESERVATIONS_PER_BOOKING} personnes par réservation
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

                <Button
                    type="submit"
                    className="w-full bg-derviche hover:bg-derviche-dark text-white"
                >
                    Confirmer ma réservation
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
                                        <Image
                                            src={spectacleData.image}
                                            alt={spectacleData.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <p className="text-white/80 text-sm mb-1">Derviche Diffusion</p>
                                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                                {spectacleData.title}
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Infos sous l'image */}
                                    <div className="p-6 md:p-8 space-y-4">
                                        {/* Durée */}
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{spectacleData.duration}</span>
                                        </div>

                                        {/* Lieu */}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-derviche mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-derviche-dark">
                                                    {spectacleData.venue.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {spectacleData.venue.address}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Compagnie */}
                                        <div>
                                            <p className="text-sm font-medium text-derviche">Compagnie</p>
                                            <p className="text-sm text-foreground">{spectacleData.company}</p>
                                        </div>

                                        {/* Période */}
                                        <div>
                                            <p className="text-sm font-medium text-derviche">Période</p>
                                            <p className="text-sm text-foreground">{spectacleData.period}</p>
                                        </div>

                                        {/* Description avec "Lire la suite" */}
                                        <div className="pt-4 border-t border-border">
                                            <div className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                                                {spectacleData.description}
                                            </div>
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
