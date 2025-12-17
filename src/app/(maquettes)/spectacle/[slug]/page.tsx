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

// Types
interface TimeSlot {
    id: string;
    date: Date;
    time: string;
    remainingCapacity: number;
    totalCapacity: number;
}

interface Venue {
    name: string;
    address: string;
}

interface SpectacleData {
    id: number;
    title: string;
    slug: string;
    company: string;
    description: string;
    duration: string;
    genre: string;
    pricing: string;
    image: string;
    venue: Venue;
    period: string;
    slots: TimeSlot[];
    status: 'available' | 'coming_soon' | 'closed';
}

type Step = 'calendar' | 'time' | 'participants' | 'form';

// Données mock pour tous les spectacles du catalogue
const spectaclesDataMap: Record<string, SpectacleData> = {
    'a-moi': {
        id: 1,
        title: 'À MOI !',
        slug: 'a-moi',
        company: 'Cie A Kan la dériv\'',
        description: `À MOI ! est un spectacle de théâtre contemporain qui explore les relations humaines à travers le prisme de l'identité et de l'appartenance. 

Une création originale qui mêle texte, mouvement et musique pour raconter une histoire universelle de quête de soi et de reconnaissance. Les comédiens nous emmènent dans un voyage émotionnel intense où chaque personnage cherche sa place dans le monde.

Le spectacle aborde avec sensibilité et humour des thèmes profonds comme la famille, l'amitié, la solitude et le besoin d'être reconnu. Une performance captivante qui résonne longtemps après le rideau final.`,
        duration: '35 min',
        genre: 'Théâtre',
        pricing: 'Gratuit',
        image: '/images/spectacles/a-moi.jpg',
        venue: {
            name: 'Théâtre des Béliers',
            address: '53, rue du Portail Magnanen, 84000 Avignon',
        },
        period: 'Du 5 au 26 juillet - relâche les mercredis 9, 16 et 23',
        status: 'available',
        slots: [
            { id: '1', date: new Date(2025, 6, 5), time: '11h00', remainingCapacity: 8, totalCapacity: 20 },
            { id: '2', date: new Date(2025, 6, 5), time: '15h00', remainingCapacity: 12, totalCapacity: 20 },
            { id: '3', date: new Date(2025, 6, 6), time: '11h00', remainingCapacity: 5, totalCapacity: 20 },
            { id: '4', date: new Date(2025, 6, 6), time: '15h00', remainingCapacity: 15, totalCapacity: 20 },
            { id: '5', date: new Date(2025, 6, 12), time: '11h00', remainingCapacity: 10, totalCapacity: 20 },
            { id: '6', date: new Date(2025, 6, 12), time: '15h00', remainingCapacity: 18, totalCapacity: 20 },
            { id: '7', date: new Date(2025, 6, 13), time: '11h00', remainingCapacity: 3, totalCapacity: 20 },
            { id: '8', date: new Date(2025, 6, 13), time: '15h00', remainingCapacity: 7, totalCapacity: 20 },
        ],
    },
    'rossignol-a-la-langue-pourrie': {
        id: 2,
        title: 'ROSSIGNOL À LA LANGUE POURRIE',
        slug: 'rossignol-a-la-langue-pourrie',
        company: 'Cie Des Lumières et des Ombres',
        description: `Un spectacle jeune public qui revisite les contes traditionnels avec poésie et humour.`,
        duration: '45 min',
        genre: 'Jeune public',
        pricing: 'Gratuit',
        image: '/images/spectacles/rossignol-a-la-langue-pourrie.jpg',
        venue: {
            name: 'Théâtre du Balcon',
            address: '38, rue Guillaume Puy, 84000 Avignon',
        },
        period: 'Dates à venir',
        status: 'coming_soon',
        slots: [], // Pas encore de créneaux
    },
    'la-honte': {
        id: 7,
        title: 'LA HONTE',
        slug: 'la-honte',
        company: 'Cie Mouvement',
        description: `Une pièce de danse contemporaine qui explore les émotions profondes.`,
        duration: '50 min',
        genre: 'Danse',
        pricing: 'Gratuit',
        image: '/images/spectacles/la-honte.jpg',
        venue: {
            name: 'Théâtre du Balcon',
            address: '38, rue Guillaume Puy, 84000 Avignon',
        },
        period: 'Dates à venir',
        status: 'coming_soon',
        slots: [], // Pas encore de créneaux
    },
    'toutes-les-choses-geniales': {
        id: 12,
        title: 'TOUTES LES CHOSES GÉNIALES',
        slug: 'toutes-les-choses-geniales',
        company: 'Cie Street',
        description: `Un spectacle sur la beauté des petites choses du quotidien.`,
        duration: '1h10',
        genre: 'Théâtre',
        pricing: 'Gratuit',
        image: '/images/spectacles/toutes-les-choses-geniales-cat.jpg',
        venue: {
            name: 'Théâtre du Balcon',
            address: '38, rue Guillaume Puy, 84000 Avignon',
        },
        period: 'Dates à venir',
        status: 'coming_soon',
        slots: [], // Pas encore de créneaux
    },
};

// Données par défaut pour les spectacles non définis
const defaultSpectacleData: SpectacleData = {
    id: 0,
    title: 'Spectacle',
    slug: 'spectacle',
    company: 'Compagnie',
    description: 'Description du spectacle.',
    duration: '1h',
    genre: 'Théâtre',
    pricing: 'Gratuit',
    image: '/images/spectacles/a-moi.jpg',
    venue: {
        name: 'Théâtre',
        address: 'Avignon',
    },
    period: 'Juillet 2025',
    status: 'available',
    slots: [
        { id: '1', date: new Date(2025, 6, 10), time: '14h00', remainingCapacity: 10, totalCapacity: 20 },
        { id: '2', date: new Date(2025, 6, 12), time: '14h00', remainingCapacity: 15, totalCapacity: 20 },
    ],
};

const MAX_RESERVATIONS_PER_BOOKING = 3;

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

export default function SpectacleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    // Récupérer les données du spectacle selon le slug
    const spectacleData = spectaclesDataMap[slug] || defaultSpectacleData;

    // États
    const [currentStep, setCurrentStep] = useState<Step>('calendar');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 6, 1));
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

    // Reset des états quand le slug change (navigation entre spectacles)
    useEffect(() => {
        setCurrentStep('calendar');
        setCurrentMonth(new Date(2025, 6, 1));
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
    }, [slug]);

    // Vérifier si le spectacle est "bientôt réservable"
    const isComingSoon = spectacleData.status === 'coming_soon';

    // Trouver les dates avec créneaux DISPONIBLES pour le mois courant
    const datesWithSlots = useMemo(() => {
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
    }, [currentMonth, spectacleData.slots]);

    // Créneaux pour la date sélectionnée
    const slotsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return spectacleData.slots.filter((slot) => isSameDay(slot.date, selectedDate));
    }, [selectedDate, spectacleData.slots]);

    // Générer la grille du calendrier
    const calendarDays = useMemo(() => {
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
    }, [currentMonth]);

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
        alert('Réservation confirmée !');
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
    const renderTimeStep = () => (
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {slotsForSelectedDate.map((slot) => {
                            const isSlotComplet = slot.remainingCapacity === 0;
                            return (
                                <Button
                                    key={slot.id}
                                    variant="outline"
                                    onClick={() => !isSlotComplet && handleSlotSelect(slot)}
                                    disabled={isSlotComplet}
                                    className={`flex items-center justify-between ${
                                        isSlotComplet
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-derviche hover:text-white hover:border-derviche'
                                    }`}
                                >
                                    <span className="font-medium">{slot.time}</span>
                                    <div className="flex items-center gap-1 text-xs">
                                        {isSlotComplet ? (
                                            <span className="text-error font-medium">Complet</span>
                                        ) : (
                                            <>
                                                <Users className="w-3 h-3" />
                                                <span>
                                                    {slot.remainingCapacity}/{slot.totalCapacity}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );

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
                                <span>{spectacleData.venue.name}</span>
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
                                {/* Colonne gauche - Infos (1/2) - INCHANGÉE */}
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
