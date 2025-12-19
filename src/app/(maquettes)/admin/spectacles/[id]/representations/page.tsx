'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    Calendar,
    Maximize2,
    Minimize2,
    Clock,
    MapPin,
    Copy,
    AlertTriangle,
} from 'lucide-react';

// Interface Représentation
interface Representation {
    id: number;
    date: string; // Format ISO: "2025-07-05"
    time: string; // Format: "11:00"
    venueId: number;
    venueName: string;
    capacity: number | null; // null = illimité
    booked: number;
    welcomeBy: 'derviche' | 'company';
    welcomeById?: number | null;
}

// Données mock spectacles (même que la page spectacles)
const showsMock = [
    {
        id: 1,
        title: 'À moi',
        companyName: 'Compagnie du Soleil',
    },
    {
        id: 2,
        title: 'Le Rossignol',
        companyName: 'Les Artistes Associés',
    },
    {
        id: 3,
        title: 'Madame Bovary',
        companyName: 'Théâtre Nomade',
    },
    {
        id: 4,
        title: 'Le Jeu',
        companyName: 'Collectif Éphémère',
    },
    {
        id: 5,
        title: 'La Mer',
        companyName: 'La Troupe Vagabonde',
    },
];

// Données mock lieux
const venuesMock = [
    { id: 1, name: 'Théâtre des Béliers', city: 'Avignon' },
    { id: 2, name: 'Théâtre du Balcon', city: 'Avignon' },
    { id: 3, name: 'La Condition des Soies', city: 'Avignon' },
];

// Données mock utilisateurs Derviche
const dervisheUsersMock = [
    { id: 1, firstName: 'Alexandra', lastName: 'Martin', role: 'super_admin' },
    { id: 2, firstName: 'Sophie', lastName: 'Bernard', role: 'admin' },
    { id: 3, firstName: 'Pierre', lastName: 'Dupont', role: 'admin' },
    { id: 4, firstName: 'Marie', lastName: 'Lefebvre', role: 'externe' },
    { id: 5, firstName: 'Jean', lastName: 'Moreau', role: 'externe' },
    { id: 6, firstName: 'Claire', lastName: 'Dubois', role: 'externe' },
];

// Données mock représentations pour le spectacle 1 (À moi)
const representationsMock: Representation[] = [
    {
        id: 1,
        date: '2025-07-05',
        time: '11:00',
        venueId: 1,
        venueName: 'Théâtre des Béliers',
        capacity: 20,
        booked: 15,
        welcomeBy: 'derviche',
        welcomeById: 1, // Alexandra Martin
    },
    {
        id: 2,
        date: '2025-07-05',
        time: '15:00',
        venueId: 2,
        venueName: 'Théâtre du Balcon',
        capacity: 20,
        booked: 8,
        welcomeBy: 'company',
    },
    {
        id: 3,
        date: '2025-07-12',
        time: '11:00',
        venueId: 1,
        venueName: 'Théâtre des Béliers',
        capacity: 20,
        booked: 20,
        welcomeBy: 'derviche',
        welcomeById: 2, // Sophie Bernard
    },
    {
        id: 4,
        date: '2025-07-12',
        time: '15:00',
        venueId: 3,
        venueName: 'La Condition des Soies',
        capacity: 20,
        booked: 3,
        welcomeBy: 'company',
    },
    {
        id: 5,
        date: '2025-07-19',
        time: '11:00',
        venueId: 2,
        venueName: 'Théâtre du Balcon',
        capacity: 20,
        booked: 12,
        welcomeBy: 'derviche',
        welcomeById: 4, // Marie Lefebvre
    },
    {
        id: 6,
        date: '2025-07-19',
        time: '15:00',
        venueId: 1,
        venueName: 'Théâtre des Béliers',
        capacity: 20,
        booked: 5,
        welcomeBy: 'company',
    },
    {
        id: 7,
        date: '2025-07-26',
        time: '11:00',
        venueId: 3,
        venueName: 'La Condition des Soies',
        capacity: 20,
        booked: 18,
        welcomeBy: 'derviche',
        welcomeById: 3, // Pierre Dupont
    },
    {
        id: 8,
        date: '2025-07-26',
        time: '15:00',
        venueId: 2,
        venueName: 'Théâtre du Balcon',
        capacity: 20,
        booked: 10,
        welcomeBy: 'company',
    },
    {
        id: 9,
        date: '2025-08-02',
        time: '11:00',
        venueId: 1,
        venueName: 'Théâtre des Béliers',
        capacity: null, // Illimité
        booked: 5,
        welcomeBy: 'derviche',
        welcomeById: 6, // Claire Dubois
    },
];

// Fonction pour formater la date (utilise UTC pour éviter les décalages de timezone)
function formatDate(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00'); // Ajouter midi pour éviter les problèmes de timezone
    const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
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
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Fonction pour extraire le mois d'une date (utilise la même logique que formatDate)
function getMonthFromDate(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00'); // Ajouter midi pour éviter les problèmes de timezone
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Fonction pour formater le mois pour l'affichage
function formatMonth(monthString: string): string {
    const [year, month] = monthString.split('-');
    const months = [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
}

export default function AdminRepresentationsPage() {
    const params = useParams();
    const router = useRouter();
    const showId = parseInt(params.id as string);

    // Trouver le spectacle correspondant
    const show = showsMock.find((s) => s.id === showId);

    // États - DOIVENT être déclarés AVANT tout return conditionnel (Rules of Hooks)
    const [representations, setRepresentations] = useState<Representation[]>(representationsMock);
    const [venues, setVenues] = useState<typeof venuesMock>(venuesMock);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [editingRepresentation, setEditingRepresentation] = useState<Representation | null>(null);
    const [representationToDelete, setRepresentationToDelete] = useState<Representation | null>(null);
    const [isNewVenueDialogOpen, setIsNewVenueDialogOpen] = useState<boolean>(false);
    const [newVenueSource, setNewVenueSource] = useState<'simple' | 'series'>('simple');
    const [newVenueData, setNewVenueData] = useState<{ name: string; city: string }>({
        name: '',
        city: '',
    });
    const [formData, setFormData] = useState<Omit<Representation, 'id' | 'venueName'>>({
        date: '',
        time: '',
        venueId: 0,
        capacity: null,
        booked: 0,
        welcomeBy: 'derviche',
        welcomeById: null,
    });
    const [isUnlimited, setIsUnlimited] = useState<boolean>(true);
    const [isGenerateSeriesOpen, setIsGenerateSeriesOpen] = useState(false);
    const [isGenerateSeriesExpanded, setIsGenerateSeriesExpanded] = useState<boolean>(false);
    const [generateSeriesData, setGenerateSeriesData] = useState({
        startDate: '',
        endDate: '',
        weekDays: [true, true, true, true, true, true, true], // Dim, Lun, Mar, Mer, Jeu, Ven, Sam
        times: ['11:00'],
        excludedDates: [] as string[],
        venueId: 0,
        capacity: null as number | null,
        isUnlimited: true,
        welcomeBy: 'derviche' as 'derviche' | 'company',
        welcomeById: null as number | null,
        includeExactDuplicates: false,
        includeConflicts: false,
    });

    // Filtres
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [venueFilter, setVenueFilter] = useState<string>('all');
    const [dateSearch, setDateSearch] = useState<string>('');

    // Extraire les mois disponibles depuis les représentations
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        representations.forEach((rep) => {
            months.add(getMonthFromDate(rep.date));
        });
        return Array.from(months).sort();
    }, [representations]);

    // Extraire les lieux utilisés
    const usedVenues = useMemo(() => {
        const venueIds = new Set<number>();
        representations.forEach((rep) => {
            venueIds.add(rep.venueId);
        });
        return Array.from(venueIds).map((id) => venues.find((v) => v.id === id)).filter(Boolean) as typeof venues;
    }, [representations, venues]);

    // Filtrer les représentations
    const filteredRepresentations = useMemo(() => {
        let filtered = [...representations];

        // Filtre par mois
        if (monthFilter !== 'all') {
            filtered = filtered.filter((rep) => getMonthFromDate(rep.date) === monthFilter);
        }

        // Filtre par lieu
        if (venueFilter !== 'all') {
            filtered = filtered.filter((rep) => rep.venueId === parseInt(venueFilter));
        }

        // Recherche par date
        if (dateSearch.trim()) {
            const searchLower = dateSearch.toLowerCase();
            filtered = filtered.filter((rep) => {
                const formattedDate = formatDate(rep.date).toLowerCase();
                return formattedDate.includes(searchLower);
            });
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [representations, monthFilter, venueFilter, dateSearch]);

    // Labels des jours de la semaine
    const weekDayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Calculer les représentations générées
    const generatedRepresentations = useMemo(() => {
        const { startDate, endDate, weekDays, times, excludedDates, venueId } = generateSeriesData;

        if (!startDate || !endDate || times.length === 0 || venueId === 0) {
            return [];
        }

        const start = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        const results: Array<{
            date: string;
            time: string;
            venueId: number;
            venueName: string;
            status: 'ok' | 'exact_duplicate' | 'conflict';
        }> = [];
        const excludedDatesSet = new Set(excludedDates.filter((d) => d.trim() !== ''));

        // Parcourir chaque jour entre début et fin
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); // 0=Dim, 1=Lun, ..., 6=Sam

            // Vérifier si ce jour est coché (weekDays index 0=Dim, 1=Lun, etc.)
            if (!weekDays[dayOfWeek]) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Vérifier si cette date est exclue
            if (excludedDatesSet.has(dateString)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            const venue = venues.find((v) => v.id === venueId);
            if (venue) {
                // Pour chaque horaire
                times.forEach((time) => {
                    // Doublon exact : même date + même heure + même lieu
                    const isExactDuplicate = representations.some(
                        (r) => r.date === dateString && r.time === time && r.venueId === venueId
                    );

                    // Conflit horaire : même date + même heure + lieu DIFFÉRENT
                    const isConflict = !isExactDuplicate && representations.some(
                        (r) => r.date === dateString && r.time === time && r.venueId !== venueId
                    );

                    let status: 'ok' | 'exact_duplicate' | 'conflict' = 'ok';
                    if (isExactDuplicate) {
                        status = 'exact_duplicate';
                    } else if (isConflict) {
                        status = 'conflict';
                    }

                    results.push({
                        date: dateString,
                        time,
                        venueId,
                        venueName: venue.name,
                        status,
                    });
                });
            }

            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Trier chronologiquement
        return results.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [generateSeriesData, representations, venues]);

    // Calculer les représentations qui seront effectivement créées (selon les checkboxes)
    const representationsToCreate = useMemo(() => {
        return generatedRepresentations.filter((rep) => {
            if (rep.status === 'exact_duplicate' && !generateSeriesData.includeExactDuplicates) {
                return false;
            }
            if (rep.status === 'conflict' && !generateSeriesData.includeConflicts) {
                return false;
            }
            return true;
        });
    }, [generatedRepresentations, generateSeriesData.includeExactDuplicates, generateSeriesData.includeConflicts]);

    // Compteurs pour l'affichage
    const exactDuplicatesCount = useMemo(() =>
        generatedRepresentations.filter((r) => r.status === 'exact_duplicate').length
        , [generatedRepresentations]);

    const conflictsCount = useMemo(() =>
        generatedRepresentations.filter((r) => r.status === 'conflict').length
        , [generatedRepresentations]);

    // Validation pour la génération de série
    const isGenerateSeriesValid = useMemo(() => {
        const { startDate, endDate, weekDays, times, venueId, welcomeBy, welcomeById } = generateSeriesData;

        if (!startDate || !endDate) return false;
        if (new Date(endDate) < new Date(startDate)) return false;
        if (weekDays.every((d) => !d)) return false;
        if (times.length === 0 || times.some((t) => !t.trim())) return false;
        if (!venueId) return false;
        if (!generateSeriesData.isUnlimited && (!generateSeriesData.capacity || generateSeriesData.capacity < 1)) return false;
        if (welcomeBy === 'derviche' && !welcomeById) return false;
        // Vérifier qu'il y a au moins une représentation à créer
        if (representationsToCreate.length === 0) return false;
        return true;
    }, [generateSeriesData, representationsToCreate.length]);

    // Si le spectacle n'existe pas, rediriger (après tous les hooks)
    if (!show) {
        router.push('/admin/spectacles');
        return null;
    }

    // Ouvrir la modale en mode création
    const handleCreate = () => {
        setEditingRepresentation(null);
        setFormData({
            date: '',
            time: '',
            venueId: 0,
            capacity: null,
            booked: 0,
            welcomeBy: 'derviche',
            welcomeById: null,
        });
        setIsUnlimited(true);
        setIsDialogOpen(true);
    };

    // Ouvrir la modale en mode édition
    const handleEdit = (representation: Representation) => {
        setEditingRepresentation(representation);
        const isUnlimitedValue = representation.capacity === null;
        setFormData({
            date: representation.date,
            time: representation.time,
            venueId: representation.venueId,
            capacity: representation.capacity ?? 20,
            booked: representation.booked,
            welcomeBy: representation.welcomeBy,
            welcomeById: representation.welcomeById ?? null,
        });
        setIsUnlimited(isUnlimitedValue);
        setIsDialogOpen(true);
    };

    // Gérer la soumission du formulaire
    const handleSubmit = () => {
        if (!formData.date || !formData.time || !formData.venueId) {
            return;
        }
        if (!isUnlimited && (formData.capacity === null || formData.capacity < 1)) {
            return;
        }

        const venue = venues.find((v) => v.id === formData.venueId);
        if (!venue) return;

        const capacityValue = isUnlimited ? null : formData.capacity;

        if (editingRepresentation) {
            // Édition
            setRepresentations((prev) =>
                prev.map((rep) =>
                    rep.id === editingRepresentation.id
                        ? {
                            ...rep,
                            date: formData.date,
                            time: formData.time,
                            venueId: formData.venueId,
                            venueName: venue.name,
                            capacity: capacityValue,
                            booked: rep.booked, // Garder la valeur existante (lecture seule)
                            welcomeBy: formData.welcomeBy,
                            welcomeById: formData.welcomeById ?? null,
                        }
                        : rep
                )
            );
        } else {
            // Création
            const newId = Math.max(...representations.map((r) => r.id), 0) + 1;
            setRepresentations((prev) => [
                ...prev,
                {
                    id: newId,
                    date: formData.date,
                    time: formData.time,
                    venueId: formData.venueId,
                    venueName: venue.name,
                    capacity: capacityValue,
                    booked: 0, // Par défaut à 0 lors de la création
                    welcomeBy: formData.welcomeBy,
                    welcomeById: formData.welcomeById ?? null,
                },
            ]);
        }

        handleCloseDialog();
    };

    // Fermer la modale
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingRepresentation(null);
        setFormData({
            date: '',
            time: '',
            venueId: 0,
            capacity: null,
            booked: 0,
            welcomeBy: 'derviche',
            welcomeById: null,
        });
        setIsUnlimited(true);
    };

    // Gérer la suppression
    const handleDeleteClick = (representation: Representation) => {
        setRepresentationToDelete(representation);
    };

    const handleConfirmDelete = () => {
        if (representationToDelete) {
            setRepresentations((prev) => prev.filter((rep) => rep.id !== representationToDelete.id));
            setRepresentationToDelete(null);
        }
    };

    // Handlers pour la génération de série
    const handleOpenGenerateSeries = () => {
        setIsGenerateSeriesOpen(true);
    };

    const handleCloseGenerateSeries = () => {
        setIsGenerateSeriesOpen(false);
        setIsGenerateSeriesExpanded(false);
        setGenerateSeriesData({
            startDate: '',
            endDate: '',
            weekDays: [true, true, true, true, true, true, true],
            times: ['11:00'],
            excludedDates: [],
            venueId: 0,
            capacity: null,
            isUnlimited: true,
            welcomeBy: 'derviche',
            welcomeById: null,
            includeExactDuplicates: false,
            includeConflicts: false,
        });
    };

    const handleAddTime = () => {
        setGenerateSeriesData((prev) => ({
            ...prev,
            times: [...prev.times, '11:00'],
        }));
    };

    const handleRemoveTime = (index: number) => {
        setGenerateSeriesData((prev) => ({
            ...prev,
            times: prev.times.filter((_, i) => i !== index),
        }));
    };

    const handleAddExcludedDate = () => {
        setGenerateSeriesData((prev) => ({
            ...prev,
            excludedDates: [...prev.excludedDates, ''],
        }));
    };

    const handleRemoveExcludedDate = (index: number) => {
        setGenerateSeriesData((prev) => ({
            ...prev,
            excludedDates: prev.excludedDates.filter((_, i) => i !== index),
        }));
    };

    const handleGenerateSeries = () => {
        if (!isGenerateSeriesValid) return;

        const venue = venues.find((v) => v.id === generateSeriesData.venueId);
        if (!venue) return;

        // Utiliser representationsToCreate (déjà filtré selon les checkboxes)
        const maxId = Math.max(...representations.map((r) => r.id), 0);

        const newRepresentations: Representation[] = representationsToCreate.map((rep, index) => ({
            id: maxId + index + 1,
            date: rep.date,
            time: rep.time,
            venueId: rep.venueId,
            venueName: venue.name,
            capacity: generateSeriesData.isUnlimited ? null : generateSeriesData.capacity,
            booked: 0,
            welcomeBy: generateSeriesData.welcomeBy,
            welcomeById: generateSeriesData.welcomeById,
        }));

        setRepresentations((prev) => [...prev, ...newRepresentations]);
        handleCloseGenerateSeries();
    };

    // Calculer le pourcentage de capacité
    const getCapacityPercentage = (booked: number, capacity: number | null): number | null => {
        if (capacity === null) return null;
        return Math.round((booked / capacity) * 100);
    };

    // Obtenir la couleur de la barre de capacité
    const getCapacityColor = (percentage: number | null): string => {
        if (percentage === null) return 'bg-muted';
        if (percentage >= 50) return 'bg-green-500';
        if (percentage >= 20) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Header contextuel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/admin/spectacles"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-derviche transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour aux spectacles
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-derviche-dark truncate">
                        Représentations de &laquo; {show.title} &raquo;
                    </h1>
                    <p className="text-sm text-muted-foreground">{show.companyName}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={handleOpenGenerateSeries}
                        className="w-full sm:w-auto"
                    >
                        <Copy className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Générer une série</span>
                    </Button>
                    <Button onClick={handleCreate} className="w-full sm:w-auto bg-derviche hover:bg-derviche-light">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="sm:hidden">Ajouter</span>
                        <span className="hidden sm:inline">Ajouter une représentation</span>
                    </Button>
                </div>
            </div>

            {/* Barre de filtres */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
                <div className="grid grid-cols-2 gap-2 sm:contents">
                    <div className="sm:flex-1">
                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les mois" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les mois</SelectItem>
                                {availableMonths.map((month) => (
                                    <SelectItem key={month} value={month}>
                                        {formatMonth(month)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="sm:flex-1">
                        <Select value={venueFilter} onValueChange={setVenueFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les lieux" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les lieux</SelectItem>
                                {usedVenues.map((venue) => (
                                    <SelectItem key={venue.id} value={String(venue.id)}>
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="sm:flex-1">
                    <Input
                        type="text"
                        placeholder="Rechercher par date..."
                        value={dateSearch}
                        onChange={(e) => setDateSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="hidden lg:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Heure</TableHead>
                            <TableHead>Lieu</TableHead>
                            <TableHead>Places max</TableHead>
                            <TableHead>Accueil</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRepresentations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    Aucune représentation trouvée
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRepresentations.map((rep) => {
                                const percentage = getCapacityPercentage(rep.booked, rep.capacity);
                                const isUnlimited = rep.capacity === null;
                                const remaining = isUnlimited ? null : (rep.capacity ?? 0) - rep.booked;
                                return (
                                    <TableRow key={rep.id}>
                                        <TableCell className="font-medium">{formatDate(rep.date)}</TableCell>
                                        <TableCell>{rep.time}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                                {rep.venueName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isUnlimited ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">∞ Illimité</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">
                                                            {remaining}/{rep.capacity}
                                                        </span>
                                                        <span className="text-muted-foreground">{percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${getCapacityColor(percentage)}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {rep.welcomeBy === 'derviche' ? (
                                                <Badge className="bg-derviche/10 text-derviche border-derviche/20">
                                                    {rep.welcomeById
                                                        ? (() => {
                                                            const user = dervisheUsersMock.find((u) => u.id === rep.welcomeById);
                                                            return user
                                                                ? `Derviche - ${user.firstName} ${user.lastName.charAt(0)}.`
                                                                : 'Derviche';
                                                        })()
                                                        : 'Derviche'}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                                                    Compagnie
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEdit(rep)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    <span className="sr-only">Modifier</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteClick(rep)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="sr-only">Supprimer</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Cartes mobile */}
            <div className="lg:hidden space-y-4">
                {filteredRepresentations.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Aucune représentation trouvée
                        </CardContent>
                    </Card>
                ) : (
                    filteredRepresentations.map((rep) => {
                        const percentage = getCapacityPercentage(rep.booked, rep.capacity);
                        const isUnlimited = rep.capacity === null;
                        const remaining = isUnlimited ? null : (rep.capacity ?? 0) - rep.booked;
                        return (
                            <Card key={rep.id}>
                                <CardContent className="p-3 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="font-medium">{formatDate(rep.date)}</span>
                                                <span className="text-muted-foreground">•</span>
                                                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span>{rep.time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="flex-1 min-w-0">{rep.venueName}</span>
                                        {rep.welcomeBy === 'derviche' ? (
                                            <Badge className="bg-derviche/10 text-derviche border-derviche/20 shrink-0">
                                                {rep.welcomeById
                                                    ? (() => {
                                                        const user = dervisheUsersMock.find((u) => u.id === rep.welcomeById);
                                                        return user
                                                            ? `Derviche - ${user.firstName} ${user.lastName.charAt(0)}.`
                                                            : 'Derviche';
                                                    })()
                                                    : 'Derviche'}
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20 shrink-0">
                                                Compagnie
                                            </Badge>
                                        )}
                                    </div>

                                    {isUnlimited ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">∞ Illimité</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">
                                                    {remaining}/{rep.capacity} places restantes
                                                </span>
                                                <span className="text-muted-foreground">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${getCapacityColor(percentage)}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleEdit(rep)}
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteClick(rep)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Modale création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRepresentation ? 'Modifier la représentation' : 'Ajouter une représentation'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRepresentation
                                ? 'Modifiez les informations de la représentation.'
                                : 'Remplissez les informations pour créer une nouvelle représentation.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">
                                    Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">
                                    Heure <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="venueId">
                                Lieu <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.venueId ? String(formData.venueId) : ''}
                                onValueChange={(value) => {
                                    if (value === 'new') {
                                        setNewVenueSource('simple');
                                        setIsNewVenueDialogOpen(true);
                                        // Ne pas modifier formData.venueId pour garder la sélection précédente
                                    } else {
                                        setFormData({ ...formData, venueId: parseInt(value) });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un lieu" />
                                </SelectTrigger>
                                <SelectContent>
                                    {venues.map((venue) => (
                                        <SelectItem key={venue.id} value={String(venue.id)}>
                                            {venue.city ? `${venue.name} - ${venue.city}` : venue.name}
                                        </SelectItem>
                                    ))}
                                    <div className="border-t my-1" />
                                    <SelectItem value="new" className="text-derviche font-medium">
                                        ➕ Créer un nouveau lieu...
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">
                                Places max (pro) <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Nombre maximum de programmateurs pouvant réserver
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    value={formData.capacity ?? ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                                    }
                                    disabled={isUnlimited}
                                    required={!isUnlimited}
                                    className={isUnlimited ? 'flex-1 bg-muted text-muted-foreground' : 'flex-1'}
                                />
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isUnlimited"
                                        checked={isUnlimited}
                                        onCheckedChange={(checked) => {
                                            setIsUnlimited(checked === true);
                                            if (checked) {
                                                setFormData({ ...formData, capacity: null });
                                            } else {
                                                setFormData({ ...formData, capacity: 20 });
                                            }
                                        }}
                                    />
                                    <Label htmlFor="isUnlimited" className="font-normal cursor-pointer">
                                        Illimité
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="welcomeBy">
                                Accueil par <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.welcomeBy}
                                onValueChange={(value: 'derviche' | 'company') =>
                                    setFormData({
                                        ...formData,
                                        welcomeBy: value,
                                        welcomeById: value === 'company' ? null : formData.welcomeById,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="derviche">Derviche Diffusion</SelectItem>
                                    <SelectItem value="company">Compagnie</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.welcomeBy === 'derviche' && (
                            <div className="space-y-2">
                                <Label htmlFor="welcomeById">
                                    Accueilli par <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.welcomeById ? String(formData.welcomeById) : ''}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, welcomeById: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un membre Derviche" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dervisheUsersMock.map((user) => (
                                            <SelectItem key={user.id} value={String(user.id)}>
                                                {user.firstName} {user.lastName} - [
                                                {user.role === 'super_admin'
                                                    ? 'Super Admin'
                                                    : user.role === 'admin'
                                                        ? 'Admin'
                                                        : 'Externe'}
                                                ]
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !formData.date ||
                                !formData.time ||
                                !formData.venueId ||
                                (!isUnlimited && (formData.capacity === null || formData.capacity < 1)) ||
                                (formData.welcomeBy === 'derviche' && !formData.welcomeById)
                            }
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                        >
                            {editingRepresentation ? 'Modifier' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modale création de lieu */}
            <Dialog open={isNewVenueDialogOpen} onOpenChange={setIsNewVenueDialogOpen}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Créer un nouveau lieu</DialogTitle>
                        <DialogDescription>
                            Ajoutez un nouveau lieu pour vos représentations.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                        <div className="space-y-2">
                            <Label htmlFor="newVenueName">
                                Nom du lieu <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="newVenueName"
                                type="text"
                                value={newVenueData.name}
                                onChange={(e) =>
                                    setNewVenueData({ ...newVenueData, name: e.target.value })
                                }
                                placeholder="Ex: Théâtre de la Ville"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newVenueCity">
                                Ville <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="newVenueCity"
                                type="text"
                                value={newVenueData.city}
                                onChange={(e) =>
                                    setNewVenueData({ ...newVenueData, city: e.target.value })
                                }
                                placeholder="Ex: Avignon"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsNewVenueDialogOpen(false);
                                setNewVenueData({ name: '', city: '' });
                            }}
                            className="w-full sm:w-auto"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => {
                                if (!newVenueData.name.trim() || !newVenueData.city.trim()) {
                                    return;
                                }

                                // Générer un nouvel ID
                                const newId = Math.max(...venues.map((v) => v.id), 0) + 1;

                                // Créer le nouveau lieu
                                const newVenue = {
                                    id: newId,
                                    name: newVenueData.name.trim(),
                                    city: newVenueData.city.trim(),
                                };

                                // Ajouter au state
                                setVenues((prev) => [...prev, newVenue]);

                                // Sélectionner automatiquement ce nouveau lieu UNIQUEMENT dans le formulaire source
                                if (newVenueSource === 'simple') {
                                    setFormData((prev) => ({ ...prev, venueId: newId }));
                                } else {
                                    setGenerateSeriesData((prev) => ({ ...prev, venueId: newId }));
                                }

                                // Fermer la modale et réinitialiser
                                setIsNewVenueDialogOpen(false);
                                setNewVenueData({ name: '', city: '' });
                            }}
                            disabled={!newVenueData.name.trim() || !newVenueData.city.trim()}
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                        >
                            Créer et sélectionner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modale suppression */}
            <AlertDialog
                open={!!representationToDelete}
                onOpenChange={(open) => !open && setRepresentationToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette représentation ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {representationToDelete && representationToDelete.booked > 0 ? (
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium text-orange-900">
                                                Attention : {representationToDelete.booked} place(s) déjà réservée(s)
                                            </p>
                                            <p className="text-orange-700 mt-1">
                                                La suppression de cette représentation affectera les réservations existantes.
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm">
                                        Êtes-vous sûr de vouloir supprimer la représentation du{' '}
                                        <strong>{formatDate(representationToDelete.date)}</strong> à{' '}
                                        <strong>{representationToDelete.time}</strong> ? Cette action est irréversible.
                                    </p>
                                </div>
                            ) : (
                                <p>
                                    Êtes-vous sûr de vouloir supprimer la représentation du{' '}
                                    <strong>
                                        {representationToDelete && formatDate(representationToDelete.date)}
                                    </strong>{' '}
                                    à <strong>{representationToDelete?.time}</strong> ? Cette action est irréversible.
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modale génération de série */}
            <Dialog open={isGenerateSeriesOpen} onOpenChange={(open) => !open && handleCloseGenerateSeries()}>
                <DialogContent className={`w-full max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col transition-all duration-200 ${isGenerateSeriesExpanded ? 'sm:max-w-6xl sm:h-[90vh]' : 'sm:max-w-lg'}`}>
                    <DialogHeader className="relative">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle>Générer une série</DialogTitle>
                                <DialogDescription>
                                    Créez plusieurs représentations en une seule fois en définissant une période, des horaires et des jours de la semaine.
                                </DialogDescription>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="hidden sm:flex h-8 w-8 shrink-0"
                                onClick={() => setIsGenerateSeriesExpanded(!isGenerateSeriesExpanded)}
                                title={isGenerateSeriesExpanded ? 'Réduire' : 'Agrandir'}
                            >
                                {isGenerateSeriesExpanded ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                                <span className="sr-only">{isGenerateSeriesExpanded ? 'Réduire' : 'Agrandir'}</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                        {/* Période */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">
                                    Date de début <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={generateSeriesData.startDate}
                                    onChange={(e) =>
                                        setGenerateSeriesData({ ...generateSeriesData, startDate: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">
                                    Date de fin <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={generateSeriesData.endDate}
                                    onChange={(e) =>
                                        setGenerateSeriesData({ ...generateSeriesData, endDate: e.target.value })
                                    }
                                    min={generateSeriesData.startDate}
                                    required
                                />
                            </div>
                        </div>

                        {/* Jours de la semaine */}
                        <div className="space-y-2">
                            <Label>Jours de la semaine <span className="text-destructive">*</span></Label>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {weekDayLabels.map((label, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`series-day-${index}`}
                                            checked={generateSeriesData.weekDays[index]}
                                            onCheckedChange={(checked) => {
                                                setGenerateSeriesData((prev) => {
                                                    const newWeekDays = [...prev.weekDays];
                                                    newWeekDays[index] = checked === true;
                                                    return { ...prev, weekDays: newWeekDays };
                                                });
                                            }}
                                        />
                                        <Label htmlFor={`series-day-${index}`} className="font-normal cursor-pointer text-sm">
                                            {label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Horaires */}
                        <div className="space-y-2">
                            <Label>
                                Horaires <span className="text-destructive">*</span>
                            </Label>
                            <div className="space-y-2">
                                {generateSeriesData.times.map((time, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={time}
                                            onChange={(e) => {
                                                setGenerateSeriesData((prev) => {
                                                    const newTimes = [...prev.times];
                                                    newTimes[index] = e.target.value;
                                                    return { ...prev, times: newTimes };
                                                });
                                            }}
                                            className="flex-1"
                                            required
                                        />
                                        {generateSeriesData.times.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveTime(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="sr-only">Supprimer</span>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddTime}
                                    className="w-full sm:w-auto"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter un horaire
                                </Button>
                            </div>
                        </div>

                        {/* Dates à exclure */}
                        <div className="space-y-2">
                            <Label>Dates à exclure</Label>
                            <p className="text-xs text-muted-foreground">
                                Jours fériés, relâches exceptionnelles...
                            </p>
                            <div className="space-y-2">
                                {generateSeriesData.excludedDates.map((date, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => {
                                                setGenerateSeriesData((prev) => {
                                                    const newDates = [...prev.excludedDates];
                                                    newDates[index] = e.target.value;
                                                    return { ...prev, excludedDates: newDates };
                                                });
                                            }}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveExcludedDate(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="sr-only">Supprimer</span>
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddExcludedDate}
                                    className="w-full sm:w-auto"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter une exclusion
                                </Button>
                            </div>
                        </div>

                        {/* Lieu */}
                        <div className="space-y-2">
                            <Label htmlFor="seriesVenueId">
                                Lieu <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={generateSeriesData.venueId ? String(generateSeriesData.venueId) : ''}
                                onValueChange={(value) => {
                                    if (value === 'new') {
                                        setNewVenueSource('series');
                                        setIsNewVenueDialogOpen(true);
                                    } else {
                                        setGenerateSeriesData({ ...generateSeriesData, venueId: parseInt(value) });
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un lieu" />
                                </SelectTrigger>
                                <SelectContent>
                                    {venues.map((venue) => (
                                        <SelectItem key={venue.id} value={String(venue.id)}>
                                            {venue.city ? `${venue.name} - ${venue.city}` : venue.name}
                                        </SelectItem>
                                    ))}
                                    <div className="border-t my-1" />
                                    <SelectItem value="new" className="text-derviche font-medium">
                                        ➕ Créer un nouveau lieu...
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Places max (pro) */}
                        <div className="space-y-2">
                            <Label htmlFor="seriesCapacity">
                                Places max (pro) <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Nombre maximum de programmateurs pouvant réserver
                            </p>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="seriesCapacity"
                                    type="number"
                                    min="1"
                                    value={generateSeriesData.capacity ?? ''}
                                    onChange={(e) =>
                                        setGenerateSeriesData({
                                            ...generateSeriesData,
                                            capacity: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    disabled={generateSeriesData.isUnlimited}
                                    required={!generateSeriesData.isUnlimited}
                                    className={
                                        generateSeriesData.isUnlimited
                                            ? 'flex-1 bg-muted text-muted-foreground'
                                            : 'flex-1'
                                    }
                                />
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="seriesIsUnlimited"
                                        checked={generateSeriesData.isUnlimited}
                                        onCheckedChange={(checked) => {
                                            setGenerateSeriesData({
                                                ...generateSeriesData,
                                                isUnlimited: checked === true,
                                                capacity: checked === true ? null : 20,
                                            });
                                        }}
                                    />
                                    <Label htmlFor="seriesIsUnlimited" className="font-normal cursor-pointer">
                                        Illimité
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Accueil par */}
                        <div className="space-y-2">
                            <Label htmlFor="seriesWelcomeBy">
                                Accueil par <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={generateSeriesData.welcomeBy}
                                onValueChange={(value: 'derviche' | 'company') => {
                                    setGenerateSeriesData({
                                        ...generateSeriesData,
                                        welcomeBy: value,
                                        welcomeById: value === 'company' ? null : generateSeriesData.welcomeById,
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="derviche">Derviche Diffusion</SelectItem>
                                    <SelectItem value="company">Compagnie</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Membre Derviche (conditionnel) */}
                        {generateSeriesData.welcomeBy === 'derviche' && (
                            <div className="space-y-2">
                                <Label htmlFor="seriesWelcomeById">
                                    Accueilli par <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={generateSeriesData.welcomeById ? String(generateSeriesData.welcomeById) : ''}
                                    onValueChange={(value) =>
                                        setGenerateSeriesData({ ...generateSeriesData, welcomeById: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un membre Derviche" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dervisheUsersMock.map((user) => (
                                            <SelectItem key={user.id} value={String(user.id)}>
                                                {user.firstName} {user.lastName} - [
                                                {user.role === 'super_admin'
                                                    ? 'Super Admin'
                                                    : user.role === 'admin'
                                                        ? 'Admin'
                                                        : 'Externe'}
                                                ]
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Aperçu */}
                        <div className="border-t pt-4 mt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold">
                                    Aperçu : {generatedRepresentations.length} représentation{generatedRepresentations.length > 1 ? 's' : ''}
                                </h3>
                            </div>

                            {/* Warning doublons exacts */}
                            {exactDuplicatesCount > 0 && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900">
                                            {exactDuplicatesCount} représentation{exactDuplicatesCount > 1 ? 's' : ''} existe{exactDuplicatesCount > 1 ? 'nt' : ''} déjà (même lieu)
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Checkbox
                                                id="includeExactDuplicates"
                                                checked={generateSeriesData.includeExactDuplicates}
                                                onCheckedChange={(checked) => {
                                                    setGenerateSeriesData({
                                                        ...generateSeriesData,
                                                        includeExactDuplicates: checked === true,
                                                    });
                                                }}
                                            />
                                            <Label htmlFor="includeExactDuplicates" className="font-normal cursor-pointer text-sm text-red-800">
                                                Inclure les doublons existants
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Warning conflits horaires */}
                            {conflictsCount > 0 && (
                                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-orange-900">
                                            {conflictsCount} créneau{conflictsCount > 1 ? 'x' : ''} en conflit (autre lieu, même horaire)
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Checkbox
                                                id="includeConflicts"
                                                checked={generateSeriesData.includeConflicts}
                                                onCheckedChange={(checked) => {
                                                    setGenerateSeriesData({
                                                        ...generateSeriesData,
                                                        includeConflicts: checked === true,
                                                    });
                                                }}
                                            />
                                            <Label htmlFor="includeConflicts" className="font-normal cursor-pointer text-sm text-orange-800">
                                                Inclure les créneaux en conflit
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {generatedRepresentations.length > 0 ? (
                                <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-3 bg-muted/50">
                                    {generatedRepresentations.map((rep, index) => {
                                        // Déterminer si cette représentation sera créée
                                        const willBeCreated =
                                            rep.status === 'ok' ||
                                            (rep.status === 'exact_duplicate' && generateSeriesData.includeExactDuplicates) ||
                                            (rep.status === 'conflict' && generateSeriesData.includeConflicts);

                                        return (
                                            <div
                                                key={index}
                                                className={`text-sm flex items-center gap-2 ${rep.status === 'exact_duplicate'
                                                    ? 'text-red-700'
                                                    : rep.status === 'conflict'
                                                        ? 'text-orange-700'
                                                        : 'text-foreground'
                                                    } ${!willBeCreated ? 'opacity-50 line-through' : ''}`}
                                            >
                                                <Clock className="w-3 h-3 shrink-0" />
                                                <span>
                                                    {formatDate(rep.date)} à {rep.time}
                                                </span>
                                                {rep.status === 'exact_duplicate' && (
                                                    <Badge variant="outline" className="ml-auto text-xs bg-red-100 text-red-700 border-red-300">
                                                        Existant
                                                    </Badge>
                                                )}
                                                {rep.status === 'conflict' && (
                                                    <Badge variant="outline" className="ml-auto text-xs bg-orange-100 text-orange-700 border-orange-300">
                                                        Conflit
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic p-3 border rounded-md bg-muted/50">
                                    Aucune représentation générée. Remplissez les champs requis pour voir l&apos;aperçu.
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCloseGenerateSeries}
                            className="w-full sm:w-auto"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleGenerateSeries}
                            disabled={!isGenerateSeriesValid}
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                        >
                            Générer{' '}
                            {representationsToCreate.length > 0 &&
                                `(${representationsToCreate.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
