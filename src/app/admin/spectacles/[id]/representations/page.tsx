'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
    Loader2,
} from 'lucide-react';
import { searchMatch } from '@/lib/utils';
import {
    mockDervisheUsers,
    type MockRepresentation,
    type MockVenue,
} from '@/lib/mock-data';

// Hooks Supabase
import { useRepresentations } from '@/hooks/useRepresentations';
import { useVenues } from '@/hooks/useVenues';
import { useShows } from '@/hooks/useShows';
import { getRepresentationById } from '@/lib/services/representations';
import type { SlotWithRelations } from '@/lib/services/representations';
import type { VenueRow } from '@/types/database';

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

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

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

// ============================================
// FONCTIONS DE MAPPING (Supabase → Mock)
// ============================================

/**
 * Convertit un SlotWithRelations en MockRepresentation
 * Pour compatibilité avec les composants existants
 * Note: capacity >= 999999 est considéré comme "illimité" (null dans le format Mock)
 */
function slotToMockRepresentation(slot: SlotWithRelations, showTitle: string, companyName: string): MockRepresentation {
    // Calculer booked à partir des valeurs brutes de la BDD (même pour capacité illimitée)
    // Protéger contre les valeurs négatives (si remaining_capacity > capacity par erreur de données)
    const booked = Math.max(0, slot.capacity - slot.remaining_capacity);
    // Convertir capacity >= 999999 en null (illimité) pour l'affichage
    const capacity = slot.capacity >= 999999 ? null : slot.capacity;

    return {
        id: slot.id,
        showId: slot.show_id,
        showTitle,
        companyName,
        date: slot.date,
        time: slot.time.slice(0, 5), // Convertir HH:MM:SS → HH:MM
        venueId: slot.venue_id,
        venueName: slot.venue?.name || 'Lieu inconnu',
        capacity,
        booked,
        hostedBy: slot.hosted_by as 'derviche' | 'company',
        hostedById: slot.hosted_by_id,
    };
}

/**
 * Convertit un VenueRow en MockVenue
 */
function venueToMockVenue(venue: VenueRow): MockVenue {
    return {
        id: venue.id,
        name: venue.name,
        city: venue.city,
    };
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AdminRepresentationsPage() {
    const params = useParams();
    const router = useRouter();
    const showId = params.id as string;

    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Hooks Supabase
    const {
        representations: slotsData,
        isLoading: slotsLoading,
        error: slotsError,
        create: createSlot,
        createBatch: createSlotBatch,
        update: updateSlot,
        remove: removeSlot,
        checkReservations,
        refresh: refreshSlots,
    } = useRepresentations(showId);

    const {
        venues: venuesData,
        isLoading: venuesLoading,
        error: venuesError,
        create: createVenue,
        refresh: refreshVenues,
    } = useVenues();

    const { shows: showsData, isLoading: showsLoading, hasLoaded: showsHasLoaded, error: showsError, refresh: refreshShows } = useShows();

    // Trouver le spectacle - mémorisé pour éviter les recalculs inutiles
    // getShowById crée un nouvel objet à chaque appel, donc on mémorise directement
    // en utilisant les données brutes pour éviter les changements de référence inutiles
    const show = useMemo(() => {
        const foundShow = showsData.find((s) => s.id === showId);
        if (!foundShow) return null;

        // Enrichir avec l'objet company pour compatibilité
        return {
            ...foundShow,
            company: {
                name: foundShow.company_name,
            },
        };
    }, [showsData, showId]);

    // Convertir les données Supabase en format Mock pour les composants
    const representations: MockRepresentation[] = useMemo(() => {
        if (!show) return [];
        return slotsData.map(slot =>
            slotToMockRepresentation(slot, show.title, show.company?.name || 'Compagnie inconnue')
        );
    }, [slotsData, show]);

    const venues: MockVenue[] = useMemo(() => {
        return venuesData.map(venueToMockVenue);
    }, [venuesData]);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingRepresentation, setEditingRepresentation] = useState<MockRepresentation | null>(null);
    const [editingReservationsCount, setEditingReservationsCount] = useState<number>(0);
    const [representationToDelete, setRepresentationToDelete] = useState<MockRepresentation | null>(null);
    const [deleteReservationsCount, setDeleteReservationsCount] = useState<number>(0);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isNewVenueDialogOpen, setIsNewVenueDialogOpen] = useState<boolean>(false);
    const [newVenueSource, setNewVenueSource] = useState<'simple' | 'series'>('simple');
    const [isGenerateSeriesOpen, setIsGenerateSeriesOpen] = useState(false);
    const [newlyCreatedVenueId, setNewlyCreatedVenueId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // État combiné pour les boutons qui doivent être désactivés pendant n'importe quelle opération
    const isSubmitting = isEditing || isDeleting;

    // Ref pour éviter les race conditions lors de la vérification des réservations
    const pendingDeleteRef = useRef<string | null>(null);
    const pendingEditRef = useRef<string | null>(null);

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

    // Loading state
    const isLoading = !isMounted || slotsLoading || venuesLoading || showsLoading;

    // Attendre que le composant soit monté
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-derviche" />
            </div>
        );
    }

    // Erreur de chargement
    const loadingError = slotsError || venuesError || showsError;

    // Fonction pour rafraîchir toutes les données
    const refreshAllData = async () => {
        await Promise.all([
            refreshSlots(),
            refreshVenues(),
            refreshShows(),
        ]);
    };

    if (loadingError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
                <p className="text-destructive">Erreur : {loadingError}</p>
                <Button onClick={() => void refreshAllData()} variant="outline">
                    Réessayer
                </Button>
            </div>
        );
    }

    // Si le spectacle n'existe pas ET que les shows sont chargés, rediriger
    // On vérifie hasLoaded pour éviter une redirection prématurée
    if (!show && showsHasLoaded) {
        router.push('/admin/spectacles');
        return null;
    }

    // Si show est null mais les données ne sont pas encore chargées, afficher un spinner
    if (!show) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-derviche" />
            </div>
        );
    }

    // === HANDLERS ===

    // Création simple
    const handleCreate = () => {
        setEditingRepresentation(null);
        setEditingReservationsCount(0);
        setIsFormDialogOpen(true);
    };

    // Édition - vérifier les réservations avant d'ouvrir le formulaire
    // Utilise useRef pour éviter les race conditions si l'utilisateur clique rapidement
    const handleEdit = async (representation: MockRepresentation) => {
        // Capturer l'ID au début pour vérifier dans le finally
        const representationId = representation.id;

        // Stocker l'ID de la représentation pour vérifier après l'appel async
        pendingEditRef.current = representationId;
        setIsEditing(true);

        try {
            const result = await checkReservations(representationId);

            // Vérifier que c'est toujours la même représentation qu'on veut éditer
            // (l'utilisateur n'a pas cliqué sur une autre entre-temps)
            if (pendingEditRef.current !== representationId) {
                return; // Ignorer ce résultat, un autre clic a eu lieu
            }

            // En cas d'erreur, on log et on continue avec count=0
            if (result.error) {
                console.error('Erreur vérification réservations (handleEdit):', result.error);
            }

            setEditingReservationsCount(result.count);
            setEditingRepresentation(representation);
            setIsFormDialogOpen(true);
        } finally {
            // Réinitialiser le flag seulement si c'est toujours la même opération
            // Si le ref correspond toujours à cette opération, on peut réinitialiser en toute sécurité
            // Si le ref a changé vers un autre ID, cela signifie qu'une nouvelle opération a commencé,
            // donc on ne réinitialise pas (la nouvelle opération en a besoin)
            // Si le ref est null, cela signifie qu'une nouvelle opération s'est terminée,
            // donc on peut réinitialiser le flag pour éviter qu'il reste bloqué
            const currentRef = pendingEditRef.current;
            if (currentRef === representationId || currentRef === null) {
                setIsEditing(false);
                // Réinitialiser le ref seulement si c'est toujours cette opération
                if (currentRef === representationId) {
                    pendingEditRef.current = null;
                }
            }
        }
    };

    // Suppression - vérifier les réservations d'abord
    // Utilise useRef pour éviter les race conditions si l'utilisateur clique rapidement
    const handleDeleteClick = async (representation: MockRepresentation) => {
        // Capturer l'ID au début pour vérifier dans le finally
        const representationId = representation.id;

        // Stocker l'ID de la représentation pour vérifier après l'appel async
        pendingDeleteRef.current = representationId;
        setIsDeleting(true);

        try {
            const result = await checkReservations(representationId);

            // Vérifier que c'est toujours la même représentation qu'on veut supprimer
            // (l'utilisateur n'a pas cliqué sur une autre entre-temps)
            if (pendingDeleteRef.current !== representationId) {
                return; // Ignorer ce résultat, un autre clic a eu lieu
            }

            // En cas d'erreur, on affiche quand même le dialog avec count=0
            // L'erreur est déjà loggée dans le hook
            if (result.error) {
                console.error('Erreur vérification réservations:', result.error);
            }

            setDeleteReservationsCount(result.count);
            setRepresentationToDelete(representation);
            setDeleteError(null); // Réinitialiser l'erreur à l'ouverture
        } finally {
            // Réinitialiser le flag seulement si c'est toujours la même opération
            // Si le ref correspond toujours à cette opération, on peut réinitialiser en toute sécurité
            // Si le ref a changé vers un autre ID, cela signifie qu'une nouvelle opération a commencé,
            // donc on ne réinitialise pas (la nouvelle opération en a besoin)
            // Si le ref est null, cela signifie qu'une nouvelle opération s'est terminée,
            // donc on peut réinitialiser le flag pour éviter qu'il reste bloqué
            const currentRef = pendingDeleteRef.current;
            if (currentRef === representationId || currentRef === null) {
                setIsDeleting(false);
                // Réinitialiser le ref seulement si c'est toujours cette opération
                if (currentRef === representationId) {
                    pendingDeleteRef.current = null;
                }
            }
        }
    };

    const handleConfirmDelete = async () => {
        if (representationToDelete) {
            setIsDeleting(true);
            setDeleteError(null);

            try {
                const result = await removeSlot(representationToDelete.id);

                if (result.success) {
                    // Fermer le dialog seulement si la suppression a réussi
                    setRepresentationToDelete(null);
                    setDeleteReservationsCount(0);
                    setDeleteError(null);
                } else {
                    // En cas d'erreur, garder le dialog ouvert et afficher l'erreur
                    const errorMessage = result.error || 'Une erreur est survenue lors de la suppression';
                    setDeleteError(errorMessage);
                    console.error('Erreur suppression:', result.error);
                }
            } catch (error) {
                // En cas d'exception, garder le dialog ouvert et afficher l'erreur
                const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
                setDeleteError(errorMessage);
                console.error('Erreur suppression:', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // Soumission du formulaire
    const handleFormSubmit = async (formData: RepresentationFormData, isEditing: boolean) => {
        // Note: pas de try/catch ici - les erreurs remontent au dialog qui gère le retry

        // Convertir capacity null (illimité) en grande valeur pour Supabase
        // Note: La contrainte SQL est capacity > 0, donc on utilise 999999 pour "illimité"
        const capacity = formData.capacity === null ? 999999 : formData.capacity;

        // Vérifier si hosted_by_id est un UUID valide (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const hostedById = formData.hostedById && uuidRegex.test(formData.hostedById)
            ? formData.hostedById
            : null;

        if (isEditing && editingRepresentation) {
            // Trouver la représentation originale pour calculer remaining_capacity
            let originalSlot = slotsData.find(s => s.id === editingRepresentation.id);

            // Si le slot n'est pas trouvé dans slotsData (race condition ou problème de sync),
            // le récupérer directement depuis la base de données
            if (!originalSlot) {
                const slotResult = await getRepresentationById(editingRepresentation.id);
                if (slotResult.error || !slotResult.data) {
                    throw new Error(
                        slotResult.error ||
                        'Impossible de récupérer les données de la représentation. Veuillez réessayer.'
                    );
                }
                originalSlot = slotResult.data;
            }

            // Obtenir le nombre réel de places réservées depuis la base de données
            // Cela fonctionne même si la capacité était illimitée (999999)
            const reservationsResult = await checkReservations(editingRepresentation.id);
            if (reservationsResult.error) {
                throw new Error(
                    reservationsResult.error ||
                    'Impossible de vérifier le nombre de réservations. Veuillez réessayer.'
                );
            }
            const booked = reservationsResult.count;

            // Vérifier que la nouvelle capacité n'est pas inférieure au nombre de places réservées
            // (sauf si capacité illimitée)
            if (capacity < 999999 && capacity < booked) {
                throw new Error(`Impossible de réduire la capacité en dessous de ${booked} (places déjà réservées)`);
            }

            // Calculer le nouveau remaining
            // Pour maintenir l'invariant remaining_capacity + booked = capacity :
            // - Si capacité >= 999999 (illimité), remaining = 999999 - booked
            //   (cela garantit que booked = capacity - remaining = 999999 - (999999 - booked) = booked)
            // - Sinon, remaining = nouvelle_capacité - booked
            const newRemaining = capacity >= 999999 ? 999999 - booked : capacity - booked;

            const result = await updateSlot(editingRepresentation.id, {
                date: formData.date,
                time: formData.time + ':00', // Ajouter les secondes
                venue_id: formData.venueId,
                capacity,
                remaining_capacity: newRemaining,
                hosted_by: formData.hostedBy,
                hosted_by_id: hostedById,
            });

            if (!result.success) {
                throw new Error(result.error || 'Erreur lors de la mise à jour');
            }
        } else {
            const result = await createSlot({
                show_id: showId,
                date: formData.date,
                time: formData.time + ':00', // Ajouter les secondes
                venue_id: formData.venueId,
                capacity,
                remaining_capacity: capacity,
                hosted_by: formData.hostedBy,
                hosted_by_id: hostedById,
            });

            if (!result.success) {
                throw new Error(result.error || 'Erreur lors de la création');
            }
        }

        setEditingRepresentation(null);
    };

    // Génération de série
    const handleGenerateSeriesSubmit = async (data: GenerateSeriesData, repsToCreate: GeneratedRepresentation[]) => {
        if (repsToCreate.length === 0) return;

        // Note: pas de try/catch ici - les erreurs remontent au dialog qui gère le retry

        // Convertir capacity null (illimité) en grande valeur pour Supabase
        // Note: La contrainte SQL est capacity > 0, donc on utilise 999999 pour "illimité"
        const capacity = data.isUnlimited ? 999999 : (data.capacity || 1);

        // Vérifier si hosted_by_id est un UUID valide
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const hostedById = data.hostedById && uuidRegex.test(data.hostedById)
            ? data.hostedById
            : null;

        const slotsToInsert = repsToCreate.map((rep) => ({
            show_id: showId,
            date: rep.date,
            time: rep.time + ':00', // Ajouter les secondes
            venue_id: rep.venueId,
            capacity,
            remaining_capacity: capacity,
            hosted_by: data.hostedBy,
            hosted_by_id: hostedById,
        }));

        const result = await createSlotBatch(slotsToInsert);

        if (!result.success) {
            throw new Error(result.error || 'Erreur lors de la génération de la série');
        }
    };

    // Création de lieu
    const handleOpenNewVenueDialog = (source: 'simple' | 'series') => {
        setNewVenueSource(source);
        setIsNewVenueDialogOpen(true);
    };

    const handleCreateVenue = async (data: { name: string; city: string }): Promise<string> => {
        const result = await createVenue({
            name: data.name,
            city: data.city,
        });

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Erreur lors de la création du lieu');
        }

        setNewlyCreatedVenueId(result.data.id);
        return result.data.id;
    };

    // Auto-sélection du nouveau lieu créé
    const handleVenueCreated = (venueId: string) => {
        // Cette fonction n'est plus nécessaire car on utilise newlyCreatedVenueId directement
        // mais on la garde pour compatibilité
        if (venueId) {
            setNewlyCreatedVenueId(venueId);
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
                    <p className="text-sm text-muted-foreground">{show.company?.name || 'Compagnie inconnue'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => setIsGenerateSeriesOpen(true)}
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                    >
                        <Copy className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Générer une série</span>
                    </Button>
                    <Button
                        onClick={handleCreate}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                        disabled={isSubmitting}
                    >
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => void handleEdit(rep)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    <span className="sr-only">Modifier</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => void handleDeleteClick(rep)}
                                                    disabled={isSubmitting}
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => void handleEdit(rep)}
                                            disabled={isSubmitting}
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => void handleDeleteClick(rep)}
                                            disabled={isSubmitting}
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
                onOpenChange={(open) => {
                    setIsFormDialogOpen(open);
                    // Réinitialiser le compteur de réservations quand on ferme le dialog
                    // pour éviter qu'il persiste lors de la prochaine ouverture
                    if (!open) {
                        setEditingReservationsCount(0);
                    }
                }}
                editingRepresentation={editingRepresentation}
                onSubmit={handleFormSubmit}
                venues={venues}
                dervisheUsers={mockDervisheUsers}
                onOpenNewVenueDialog={() => handleOpenNewVenueDialog('simple')}
                newlyCreatedVenueId={newVenueSource === 'simple' ? newlyCreatedVenueId : null}
                onClearNewlyCreatedVenueId={() => setNewlyCreatedVenueId(null)}
                hasReservations={editingReservationsCount > 0}
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
                newlyCreatedVenueId={newVenueSource === 'series' ? newlyCreatedVenueId : null}
                onClearNewlyCreatedVenueId={() => setNewlyCreatedVenueId(null)}
            />

            {/* Création de lieu */}
            <VenueQuickCreateDialog
                open={isNewVenueDialogOpen}
                onOpenChange={setIsNewVenueDialogOpen}
                onCreateVenue={handleCreateVenue}
                onVenueCreated={handleVenueCreated}
            />

            {/* Confirmation de suppression */}
            <DeleteConfirmDialog
                open={!!representationToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setRepresentationToDelete(null);
                        setDeleteReservationsCount(0);
                        setDeleteError(null);
                        pendingDeleteRef.current = null; // Réinitialiser la ref pour éviter les réouvertures intempestives
                    }
                }}
                onConfirm={() => void handleConfirmDelete()}
                isSubmitting={isSubmitting}
                confirmDisabled={deleteReservationsCount > 0} // Bloquer si réservations existantes
                error={deleteError}
                title={deleteReservationsCount > 0 ? "Suppression impossible" : "Supprimer cette représentation ?"}
                description={
                    representationToDelete && deleteReservationsCount > 0 ? (
                        <div className="space-y-2 mt-2">
                            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-destructive">
                                        {deleteReservationsCount} réservation{deleteReservationsCount > 1 ? 's' : ''} existante{deleteReservationsCount > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-muted-foreground mt-1">
                                        Impossible de supprimer une représentation avec des réservations. Annulez d&apos;abord les réservations concernées.
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Représentation du{' '}
                                <strong>{formatDate(representationToDelete.date)}</strong> à{' '}
                                <strong>{representationToDelete.time}</strong>
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
