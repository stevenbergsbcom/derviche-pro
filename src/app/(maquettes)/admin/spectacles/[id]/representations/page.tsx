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
    Clock,
    MapPin,
    Users,
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
    },
];

// Fonction pour formater la date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
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

// Fonction pour extraire le mois d'une date
function getMonthFromDate(dateString: string): string {
    const date = new Date(dateString);
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

    // Si le spectacle n'existe pas, rediriger
    if (!show) {
        router.push('/admin/spectacles');
        return null;
    }

    // États
    const [representations, setRepresentations] = useState<Representation[]>(representationsMock);
    const [venues, setVenues] = useState<typeof venuesMock>(venuesMock);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [editingRepresentation, setEditingRepresentation] = useState<Representation | null>(null);
    const [representationToDelete, setRepresentationToDelete] = useState<Representation | null>(null);
    const [isNewVenueDialogOpen, setIsNewVenueDialogOpen] = useState<boolean>(false);
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
    });
    const [isUnlimited, setIsUnlimited] = useState<boolean>(true);

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
                        Représentations de « {show.title} »
                    </h1>
                    <p className="text-sm text-muted-foreground">{show.companyName}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        disabled
                        title="Bientôt disponible"
                        className="cursor-not-allowed w-full sm:w-auto"
                    >
                        <Copy className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Duplication en masse</span>
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
                                                    Derviche
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
                                                Derviche
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
                                    setFormData({ ...formData, welcomeBy: value })
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
                                (!isUnlimited && (formData.capacity === null || formData.capacity < 1))
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

                                // Sélectionner automatiquement ce nouveau lieu
                                setFormData({ ...formData, venueId: newId });

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
        </div>
    );
}
