'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Copy,
    AlertTriangle,
    RotateCcw,
} from 'lucide-react';
import { searchMatch } from '@/lib/utils';
import {
    mockVenues,
    mockDervisheUsers,
    getRepresentationsByShowId,
    getShowById,
    generateMockId,
    type MockRepresentation,
    type MockVenue,
} from '@/lib/mock-data';

// Composants admin réutilisables
import { DeleteConfirmDialog } from '@/components/admin';

// Composants spécifiques aux représentations
import {
    RepresentationFormDialog,
    VenueQuickCreateDialog,
    GenerateSeriesDialog,
    type RepresentationFormData,
    type GenerateSeriesData,
    type GeneratedRepresentation,
} from '@/components/admin/representations';

// Fonction pour formater la date
function formatDate(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00');
    const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Fonction pour extraire le mois d'une date
function getMonthFromDate(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00');
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Fonction pour formater le mois
function formatMonth(monthString: string): string {
    const [year, month] = monthString.split('-');
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
}

export default function AdminRepresentationsPage() {
    const params = useParams();
    const router = useRouter();
    const showId = params.id as string;

    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Trouver le spectacle correspondant
    const show = getShowById(showId);

    // États des données
    const [representations, setRepresentations] = useState<MockRepresentation[]>(getRepresentationsByShowId(showId));
    const [venues, setVenues] = useState<MockVenue[]>(mockVenues);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingRepresentation, setEditingRepresentation] = useState<MockRepresentation | null>(null);
    const [representationToDelete, setRepresentationToDelete] = useState<MockRepresentation | null>(null);
    const [isNewVenueDialogOpen, setIsNewVenueDialogOpen] = useState<boolean>(false);
    const [newVenueSource, setNewVenueSource] = useState<'simple' | 'series'>('simple');
    const [isGenerateSeriesOpen, setIsGenerateSeriesOpen] = useState(false);

    // Filtres
    const [monthFilter, setMonthFilter] = useState<string>('all');
    const [venueFilter, setVenueFilter] = useState<string>('all');
    const [dateSearch, setDateSearch] = useState<string>('');

    // Vérifier si des filtres sont actifs
    const hasActiveFilters = monthFilter !== 'all' || venueFilter !== 'all' || dateSearch.trim() !== '';

    // Réinitialiser les filtres
    const resetFilters = () => {
        setMonthFilter('all');
        setVenueFilter('all');
        setDateSearch('');
    };

    // Extraire les mois disponibles
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        representations.forEach((rep) => {
            months.add(getMonthFromDate(rep.date));
        });
        return Array.from(months).sort();
    }, [representations]);

    // Extraire les lieux utilisés
    const usedVenues = useMemo(() => {
        const venueIds = new Set<string>();
        representations.forEach((rep) => {
            venueIds.add(rep.venueId);
        });
        return Array.from(venueIds).map((id) => venues.find((v) => v.id === id)).filter(Boolean) as MockVenue[];
    }, [representations, venues]);

    // Filtrer les représentations
    const filteredRepresentations = useMemo(() => {
        let filtered = [...representations];

        if (monthFilter !== 'all') {
            filtered = filtered.filter((rep) => getMonthFromDate(rep.date) === monthFilter);
        }

        if (venueFilter !== 'all') {
            filtered = filtered.filter((rep) => rep.venueId === venueFilter);
        }

        if (dateSearch.trim()) {
            filtered = filtered.filter((rep) => {
                const formattedDate = formatDate(rep.date);
                return searchMatch(formattedDate, dateSearch);
            });
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [representations, monthFilter, venueFilter, dateSearch]);

    // Attendre que le composant soit monté
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // Si le spectacle n'existe pas, rediriger
    if (!show) {
        router.push('/admin/spectacles');
        return null;
    }

    // === HANDLERS ===

    // Création simple
    const handleCreate = () => {
        setEditingRepresentation(null);
        setIsFormDialogOpen(true);
    };

    // Édition
    const handleEdit = (representation: MockRepresentation) => {
        setEditingRepresentation(representation);
        setIsFormDialogOpen(true);
    };

    // Suppression
    const handleDeleteClick = (representation: MockRepresentation) => {
        setRepresentationToDelete(representation);
    };

    const handleConfirmDelete = () => {
        if (representationToDelete) {
            setRepresentations((prev) => prev.filter((rep) => rep.id !== representationToDelete.id));
            setRepresentationToDelete(null);
        }
    };

    // Soumission du formulaire
    const handleFormSubmit = (formData: RepresentationFormData, isEditing: boolean) => {
        const venue = venues.find((v) => v.id === formData.venueId);
        if (!venue) return;

        if (isEditing && editingRepresentation) {
            setRepresentations((prev) =>
                prev.map((rep) =>
                    rep.id === editingRepresentation.id
                        ? {
                            ...rep,
                            date: formData.date,
                            time: formData.time,
                            venueId: formData.venueId,
                            venueName: venue.name,
                            capacity: formData.capacity,
                            hostedBy: formData.hostedBy,
                            hostedById: formData.hostedById,
                        }
                        : rep
                )
            );
        } else {
            const newId = generateMockId('rep');
            setRepresentations((prev) => [
                ...prev,
                {
                    id: newId,
                    showId: showId,
                    showTitle: show.title,
                    companyName: show.companyName,
                    date: formData.date,
                    time: formData.time,
                    venueId: formData.venueId,
                    venueName: venue.name,
                    capacity: formData.capacity,
                    booked: 0,
                    hostedBy: formData.hostedBy,
                    hostedById: formData.hostedById,
                },
            ]);
        }
        setEditingRepresentation(null);
    };

    // Génération de série
    const handleGenerateSeriesSubmit = (data: GenerateSeriesData, repsToCreate: GeneratedRepresentation[]) => {
        const venue = venues.find((v) => v.id === data.venueId);
        if (!venue) return;

        const newRepresentations: MockRepresentation[] = repsToCreate.map((rep) => ({
            id: generateMockId('rep'),
            showId: showId,
            showTitle: show.title,
            companyName: show.companyName,
            date: rep.date,
            time: rep.time,
            venueId: rep.venueId,
            venueName: venue.name,
            capacity: data.isUnlimited ? null : data.capacity,
            booked: 0,
            hostedBy: data.hostedBy,
            hostedById: data.hostedById,
        }));

        setRepresentations((prev) => [...prev, ...newRepresentations]);
    };

    // Création de lieu
    const handleOpenNewVenueDialog = (source: 'simple' | 'series') => {
        setNewVenueSource(source);
        setIsNewVenueDialogOpen(true);
    };

    const handleCreateVenue = (data: { name: string; city: string }) => {
        const newId = generateMockId('venue');
        const newVenue: MockVenue = {
            id: newId,
            name: data.name,
            city: data.city,
        };
        setVenues((prev) => [...prev, newVenue]);
        // Note: La sélection automatique du nouveau lieu doit être gérée par les composants
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
                        onClick={() => setIsGenerateSeriesOpen(true)}
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
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {filteredRepresentations.length} représentation{filteredRepresentations.length > 1 ? 's' : ''}
                        {hasActiveFilters && ` (sur ${representations.length} au total)`}
                    </p>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Réinitialiser
                        </Button>
                    )}
                </div>

                <div className="sm:flex sm:flex-row sm:gap-4">
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
                    <div className="mt-2 sm:mt-0 sm:flex-1">
                        <Input
                            type="text"
                            placeholder="Rechercher par date..."
                            value={dateSearch}
                            onChange={(e) => setDateSearch(e.target.value)}
                        />
                    </div>
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
                                                <span className="font-medium">∞ Illimité</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">{remaining}/{rep.capacity}</span>
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
                                            {rep.hostedBy === 'derviche' ? (
                                                <Badge className="bg-derviche/10 text-derviche border-derviche/20">
                                                    {rep.hostedById
                                                        ? (() => {
                                                            const user = mockDervisheUsers.find((u) => u.id === rep.hostedById);
                                                            return user ? `Derviche - ${user.firstName} ${user.lastName.charAt(0)}.` : 'Derviche';
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rep)}>
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
                                        {rep.hostedBy === 'derviche' ? (
                                            <Badge className="bg-derviche/10 text-derviche border-derviche/20 shrink-0">
                                                {rep.hostedById
                                                    ? (() => {
                                                        const user = mockDervisheUsers.find((u) => u.id === rep.hostedById);
                                                        return user ? `Derviche - ${user.firstName} ${user.lastName.charAt(0)}.` : 'Derviche';
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
                                        <span className="text-sm font-medium">∞ Illimité</span>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{remaining}/{rep.capacity} places restantes</span>
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
                                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(rep)}>
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

            {/* === MODALES === */}

            {/* Formulaire création/édition */}
            <RepresentationFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                editingRepresentation={editingRepresentation}
                onSubmit={handleFormSubmit}
                venues={venues}
                dervisheUsers={mockDervisheUsers}
                onOpenNewVenueDialog={() => handleOpenNewVenueDialog('simple')}
            />

            {/* Génération de série */}
            <GenerateSeriesDialog
                open={isGenerateSeriesOpen}
                onOpenChange={setIsGenerateSeriesOpen}
                onSubmit={handleGenerateSeriesSubmit}
                venues={venues}
                dervisheUsers={mockDervisheUsers}
                existingRepresentations={representations}
                onOpenNewVenueDialog={() => handleOpenNewVenueDialog('series')}
            />

            {/* Création de lieu */}
            <VenueQuickCreateDialog
                open={isNewVenueDialogOpen}
                onOpenChange={setIsNewVenueDialogOpen}
                onCreateVenue={handleCreateVenue}
            />

            {/* Confirmation de suppression */}
            <DeleteConfirmDialog
                open={!!representationToDelete}
                onOpenChange={(open) => !open && setRepresentationToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Supprimer cette représentation ?"
                description={
                    representationToDelete && representationToDelete.booked > 0 ? (
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
                        <span>
                            Êtes-vous sûr de vouloir supprimer la représentation du{' '}
                            <strong>{representationToDelete && formatDate(representationToDelete.date)}</strong>{' '}
                            à <strong>{representationToDelete?.time}</strong> ? Cette action est irréversible.
                        </span>
                    )
                }
            />
        </div>
    );
}
