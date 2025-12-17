'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header, Footer } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
}

// Données mock - À MOI !
const spectacleData: SpectacleData = {
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
    slots: [
        // Samedis et dimanches en juillet 2025
        { id: '1', date: new Date(2025, 6, 5), time: '11h00', remainingCapacity: 8, totalCapacity: 20 },
        { id: '2', date: new Date(2025, 6, 5), time: '15h00', remainingCapacity: 12, totalCapacity: 20 },
        { id: '3', date: new Date(2025, 6, 6), time: '11h00', remainingCapacity: 5, totalCapacity: 20 },
        { id: '4', date: new Date(2025, 6, 6), time: '15h00', remainingCapacity: 15, totalCapacity: 20 },
        { id: '5', date: new Date(2025, 6, 12), time: '11h00', remainingCapacity: 10, totalCapacity: 20 },
        { id: '6', date: new Date(2025, 6, 12), time: '15h00', remainingCapacity: 18, totalCapacity: 20 },
        { id: '7', date: new Date(2025, 6, 13), time: '11h00', remainingCapacity: 3, totalCapacity: 20 },
        { id: '8', date: new Date(2025, 6, 13), time: '15h00', remainingCapacity: 7, totalCapacity: 20 },
        { id: '9', date: new Date(2025, 6, 19), time: '11h00', remainingCapacity: 14, totalCapacity: 20 },
        { id: '10', date: new Date(2025, 6, 19), time: '15h00', remainingCapacity: 20, totalCapacity: 20 },
        { id: '11', date: new Date(2025, 6, 20), time: '11h00', remainingCapacity: 6, totalCapacity: 20 },
        { id: '12', date: new Date(2025, 6, 20), time: '15h00', remainingCapacity: 9, totalCapacity: 20 },
        { id: '13', date: new Date(2025, 6, 26), time: '11h00', remainingCapacity: 11, totalCapacity: 20 },
        { id: '14', date: new Date(2025, 6, 26), time: '15h00', remainingCapacity: 16, totalCapacity: 20 },
        // Quelques jours de semaine (pas mercredis)
        { id: '15', date: new Date(2025, 6, 7), time: '14h00', remainingCapacity: 4, totalCapacity: 20 },
        { id: '16', date: new Date(2025, 6, 8), time: '14h00', remainingCapacity: 8, totalCapacity: 20 },
        { id: '17', date: new Date(2025, 6, 10), time: '14h00', remainingCapacity: 12, totalCapacity: 20 },
        { id: '18', date: new Date(2025, 6, 11), time: '14h00', remainingCapacity: 2, totalCapacity: 20 },
        { id: '19', date: new Date(2025, 6, 14), time: '14h00', remainingCapacity: 13, totalCapacity: 20 },
        { id: '20', date: new Date(2025, 6, 15), time: '14h00', remainingCapacity: 17, totalCapacity: 20 },
        { id: '21', date: new Date(2025, 6, 17), time: '14h00', remainingCapacity: 1, totalCapacity: 20 },
        { id: '22', date: new Date(2025, 6, 18), time: '14h00', remainingCapacity: 5, totalCapacity: 20 },
        { id: '23', date: new Date(2025, 6, 21), time: '14h00', remainingCapacity: 19, totalCapacity: 20 },
        { id: '24', date: new Date(2025, 6, 22), time: '14h00', remainingCapacity: 10, totalCapacity: 20 },
        { id: '25', date: new Date(2025, 6, 24), time: '14h00', remainingCapacity: 6, totalCapacity: 20 },
        { id: '26', date: new Date(2025, 6, 25), time: '14h00', remainingCapacity: 14, totalCapacity: 20 },
    ],
};

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
    const slug = params?.slug as string;

    // État initial : juillet 2025
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 6, 1));
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showFullDescription, setShowFullDescription] = useState<boolean>(false);

    // Trouver les dates avec créneaux pour le mois courant
    const datesWithSlots = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const slotsInMonth = spectacleData.slots.filter((slot) => {
            return slot.date.getFullYear() === year && slot.date.getMonth() === month;
        });

        const dates = new Set<string>();
        slotsInMonth.forEach((slot) => {
            const dateKey = `${slot.date.getFullYear()}-${slot.date.getMonth()}-${slot.date.getDate()}`;
            dates.add(dateKey);
        });

        return dates;
    }, [currentMonth]);

    // Créneaux pour la date sélectionnée
    const slotsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return spectacleData.slots.filter((slot) => isSameDay(slot.date, selectedDate));
    }, [selectedDate]);

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
    };

    // Vérifier si un jour est sélectionné
    const isSelected = (date: Date | null): boolean => {
        if (!date || !selectedDate) return false;
        return isSameDay(date, selectedDate);
    };

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
                                <div className="relative w-full aspect-video lg:aspect-[16/9]">
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

                            {/* Colonne droite - Calendrier (1/2) */}
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl font-bold text-derviche-dark mb-6">
                                    Sélectionnez la date et l'heure
                                </h2>

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

                                {/* Créneaux horaires pour la date sélectionnée */}
                                {selectedDate && slotsForSelectedDate.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <p className="text-sm font-medium text-derviche-dark mb-3">
                                            Créneaux disponibles le{' '}
                                            {selectedDate.toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                            })}
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {slotsForSelectedDate.map((slot) => (
                                                <Button
                                                    key={slot.id}
                                                    variant="outline"
                                                    className="flex items-center justify-between hover:bg-derviche hover:text-white hover:border-derviche"
                                                >
                                                    <span className="font-medium">{slot.time}</span>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Users className="w-3 h-3" />
                                                        <span>
                                                            {slot.remainingCapacity}/{slot.totalCapacity}
                                                        </span>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Fuseau horaire */}
                                <div className="mt-8 pt-6 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                                    <Globe className="w-4 h-4" />
                                    <span>Fuseau horaire : Heure d'Europe centrale</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
}
