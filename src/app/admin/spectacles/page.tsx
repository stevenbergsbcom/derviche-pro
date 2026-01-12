'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { Pencil, Trash2, Eye, Copy, Check, LayoutGrid, LayoutList, Calendar, RotateCcw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { searchMatch } from '@/lib/utils';

// Hooks Supabase
import { useShows } from '@/hooks/useShows';
import { useCategories } from '@/hooks/useCategories';
import { useTargetAudiences } from '@/hooks/useTargetAudiences';
import { useCompanies } from '@/hooks/useCompanies';
import type { ShowWithRelations } from '@/lib/services/shows';
import type { ShowStatus, ShowPriceType } from '@/types/database';

// Mock pour les users Derviche (à connecter plus tard)
import { mockDervisheUsers } from '@/lib/mock-data';

// Composants admin réutilisables
import {
    AdminPageHeader,
    SearchInput,
    StatusBadge,
    DeleteConfirmDialog,
} from '@/components/admin';

// Composants spécifiques aux spectacles
import {
    SpectacleFormDialog,
    SpectacleViewDialog,
    CategoryManagerDialog,
    TargetAudienceManagerDialog,
    CompanyQuickCreateDialog,
} from '@/components/admin/spectacles';
import type { SpectacleFormData } from '@/components/admin/spectacles/spectacle-form-dialog';

// Type pour l'affichage (compatible avec MockShow)
interface ShowForDisplay {
    id: string;
    slug: string;
    title: string;
    companyId: string;
    companyName: string;
    categories: string[];
    targetAudienceIds: string[];
    description?: string;
    shortDescription: string | null;
    imageUrl: string | null;
    duration: number | null;
    status: ShowStatus;
    priceType: ShowPriceType;
    period?: string;
    dervisheManagerId?: string;
    dervisheManager?: string;
    invitationPolicy?: string;
    maxParticipantsPerBooking?: number;
    closureDates?: string;
    representationsCount: number;
    folderUrl?: string;
    teaserUrl?: string;
    captationAvailable: boolean;
    captationUrl?: string;
}

// Composant wrapper avec Suspense pour useSearchParams
export default function AdminSpectaclesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        }>
            <AdminSpectaclesContent />
        </Suspense>
    );
}

function AdminSpectaclesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // État pour éviter les erreurs d'hydratation SSR/Client
    const [isMounted, setIsMounted] = useState(false);

    // Hooks Supabase
    const {
        shows: rawShows,
        isLoading: isLoadingShows,
        error: showsError,
        create: createShow,
        update: updateShow,
        remove: removeShow,
        checkUsage: checkShowUsage,
        generateSlug,
    } = useShows();

    const {
        categories: rawCategories,
        isLoading: isLoadingCategories,
        create: createCategory,
        remove: removeCategory,
        checkUsage: checkCategoryUsage,
    } = useCategories();

    const {
        targetAudiences: rawTargetAudiences,
        isLoading: isLoadingTargetAudiences,
        create: createTargetAudience,
        remove: removeTargetAudience,
        checkUsage: checkTargetAudienceUsage,
    } = useTargetAudiences();

    const {
        companies: rawCompanies,
        isLoading: isLoadingCompanies,
        create: createCompany,
    } = useCompanies();

    // Convertir les données Supabase vers le format d'affichage
    const shows: ShowForDisplay[] = useMemo(() => {
        return rawShows.map((show: ShowWithRelations) => {
            // Mapper les category_ids vers les noms de catégories
            const categoryNames = show.category_ids
                .map(id => rawCategories.find(c => c.id === id)?.name)
                .filter((name): name is string => name !== undefined);

            return {
                id: show.id,
                slug: show.slug,
                title: show.title,
                companyId: show.company_id,
                companyName: show.company_name,
                categories: categoryNames,
                targetAudienceIds: show.target_audience_ids,
                description: show.long_description || undefined,
                shortDescription: show.short_description,
                imageUrl: show.image_url,
                duration: show.duration_minutes,
                status: show.status as ShowStatus,
                priceType: show.price_type as ShowPriceType,
                period: show.period || undefined,
                dervisheManagerId: show.derviche_manager_id || undefined,
                invitationPolicy: show.invitation_policy || undefined,
                maxParticipantsPerBooking: show.max_reservations_per_booking,
                closureDates: show.closure_dates || undefined,
                representationsCount: show.representations_count,
                folderUrl: show.folder_url || undefined,
                teaserUrl: show.teaser_url || undefined,
                captationAvailable: show.captation_available,
                captationUrl: show.captation_url || undefined,
            };
        });
    }, [rawShows, rawCategories]);

    // Convertir les catégories pour SpectacleFormDialog (id + name)
    const categoryOptions = useMemo(() =>
        rawCategories.map(c => ({ id: c.id, name: c.name })),
        [rawCategories]
    );

    // Convertir les target audiences pour l'UI
    const targetAudiences = useMemo(() =>
        rawTargetAudiences.map(ta => ({ id: ta.id, name: ta.name })),
        [rawTargetAudiences]
    );

    // Convertir les compagnies pour l'UI
    const companies = useMemo(() =>
        rawCompanies.map(c => ({
            id: c.id,
            name: c.name,
            contactEmail: c.contact_email,
            contactPhone: c.contact_phone,
        })),
        [rawCompanies]
    );

    // État de recherche
    const [searchQuery, setSearchQuery] = useState<string>('');
    const urlSearchParam = searchParams.get('search') || '';

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingShow, setEditingShow] = useState<ShowForDisplay | null>(null);
    const [editingShowRaw, setEditingShowRaw] = useState<ShowWithRelations | null>(null); // Pour SpectacleFormDialog
    const [viewingShow, setViewingShow] = useState<ShowForDisplay | null>(null);
    const [viewingShowRaw, setViewingShowRaw] = useState<ShowWithRelations | null>(null); // Pour SpectacleViewDialog
    const [showToDelete, setShowToDelete] = useState<ShowForDisplay | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
    const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState<boolean>(false);
    const [isAudiencesDialogOpen, setIsAudiencesDialogOpen] = useState<boolean>(false);
    const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState<boolean>(false);
    const [newlyCreatedCompanyId, setNewlyCreatedCompanyId] = useState<string | null>(null);
    
    // État d'erreur pour les opérations
    const [operationError, setOperationError] = useState<string | null>(null);

    // État pour le feedback de copie
    const [copiedShowId, setCopiedShowId] = useState<string | null>(null);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ref pour éviter les race conditions lors de la suppression
    const pendingDeleteCheckRef = useRef<string | null>(null);

    // État d'affichage
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Fix d'hydratation
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Synchroniser la recherche avec le paramètre URL
    useEffect(() => {
        setSearchQuery(urlSearchParam);
    }, [urlSearchParam]);

    // Cleanup du timeout lors du démontage
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    // Vérifier si des filtres sont actifs
    const hasActiveFilters = searchQuery.trim() !== '';

    // Réinitialiser les filtres
    const resetFilters = () => {
        setSearchQuery('');
        router.push('/admin/spectacles');
    };

    // Filtrer les spectacles selon la recherche
    const filteredShows = useMemo(() => {
        if (!searchQuery.trim()) {
            return shows;
        }
        const query = searchQuery.trim();
        return shows.filter(
            (show) =>
                searchMatch(show.title, query) ||
                searchMatch(show.companyName, query) ||
                show.categories.some((cat) => searchMatch(cat, query))
        );
    }, [searchQuery, shows]);

    // Loading global
    const isLoading = isLoadingShows || isLoadingCategories || isLoadingTargetAudiences || isLoadingCompanies;

    // Attendre que le composant soit monté
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // Affichage du chargement
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement des spectacles...</div>
            </div>
        );
    }

    // Affichage des erreurs
    if (showsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-destructive">Erreur: {showsError}</p>
                <Button onClick={() => window.location.reload()}>Réessayer</Button>
            </div>
        );
    }

    // === HANDLERS ===

    // Ouvrir la modale en mode création
    const handleCreate = () => {
        setEditingShow(null);
        setEditingShowRaw(null);
        setOperationError(null);
        setIsFormDialogOpen(true);
    };

    // Ouvrir la modale en mode édition
    const handleEdit = (show: ShowForDisplay) => {
        setEditingShow(show);
        // Trouver le show brut correspondant dans rawShows
        const rawShow = rawShows.find(s => s.id === show.id) || null;
        setEditingShowRaw(rawShow);
        setOperationError(null);
        setIsFormDialogOpen(true);
    };

    // Gérer la suppression - vérifier l'utilisation
    const handleDeleteClick = async (show: ShowForDisplay) => {
        pendingDeleteCheckRef.current = show.id;
        setDeleteWarning(null);
        setShowToDelete(show);

        const usage = await checkShowUsage(show.id);
        
        // Vérifier que c'est toujours le même spectacle qu'on veut supprimer
        if (pendingDeleteCheckRef.current !== show.id) {
            return;
        }

        if (usage.used) {
            setDeleteWarning(
                `Ce spectacle a ${usage.count} représentation(s) associée(s). La suppression masquera le spectacle mais conservera les données.`
            );
        }
    };

    // Confirmer la suppression
    const handleConfirmDelete = async () => {
        if (!showToDelete) return;

        const result = await removeShow(showToDelete.id);
        if (result.error) {
            setOperationError(result.error);
        }
        setShowToDelete(null);
        setDeleteWarning(null);
        pendingDeleteCheckRef.current = null;
    };

    // Ouvrir la modale de visualisation
    const handleView = (show: ShowForDisplay) => {
        setViewingShow(show);
        // Trouver le show brut correspondant dans rawShows
        const rawShow = rawShows.find(s => s.id === show.id) || null;
        setViewingShowRaw(rawShow);
    };

    // Fermer la modale de visualisation et ouvrir l'édition
    const handleViewToEdit = () => {
        if (viewingShow) {
            const showToEdit = viewingShow;
            setViewingShow(null);
            handleEdit(showToEdit);
        }
    };

    // Fermer la modale de visualisation et ouvrir la suppression
    const handleViewToDelete = () => {
        if (viewingShow) {
            const showToRemove = viewingShow;
            setViewingShow(null);
            void handleDeleteClick(showToRemove);
        }
    };

    // Soumettre le formulaire de spectacle
    const handleFormSubmit = async (formData: SpectacleFormData, isEditing: boolean) => {
        setOperationError(null);

        // Préparer les données pour Supabase
        const showData = {
            slug: formData.slug || generateSlug(formData.title),
            title: formData.title.trim(),
            company_id: formData.companyId,
            short_description: formData.shortDescription?.trim() || null,
            long_description: formData.description?.trim() || null,
            duration_minutes: formData.duration,
            image_url: formData.imageUrl,
            status: formData.status,
            price_type: formData.priceType,
            period: formData.period?.trim() || null,
            derviche_manager_id: formData.dervisheManagerId || null,
            invitation_policy: formData.invitationPolicy?.trim() || null,
            max_reservations_per_booking: formData.maxParticipantsPerBooking || 5,
            closure_dates: formData.closureDates?.trim() || null,
            folder_url: formData.folderUrl?.trim() || null,
            teaser_url: formData.teaserUrl?.trim() || null,
            captation_available: formData.captationAvailable,
            captation_url: formData.captationAvailable ? (formData.captationUrl?.trim() || null) : null,
        };

        if (isEditing && editingShow) {
            const result = await updateShow(editingShow.id, {
                show: showData,
                category_ids: formData.categoryIds,
                target_audience_ids: formData.targetAudienceIds,
            });

            if (result.error) {
                setOperationError(result.error);
                return;
            }
        } else {
            const result = await createShow({
                show: showData,
                category_ids: formData.categoryIds,
                target_audience_ids: formData.targetAudienceIds,
            });

            if (result.error) {
                setOperationError(result.error);
                return;
            }
        }

        setIsFormDialogOpen(false);
        setEditingShow(null);
        setEditingShowRaw(null);
    };

    // Gérer les catégories
    const handleAddCategory = async (categoryName: string) => {
        const result = await createCategory(categoryName);
        if (result.error) {
            alert(`Erreur: ${result.error}`);
        }
    };

    // Supprimer une catégorie par ID (pour CategoryManagerDialog)
    const handleRemoveCategoryById = async (categoryId: string) => {
        const category = rawCategories.find(c => c.id === categoryId);
        const categoryName = category?.name || 'cette catégorie';

        const usage = await checkCategoryUsage(categoryId);
        if (usage.used) {
            alert(`Impossible de supprimer "${categoryName}" : cette catégorie est utilisée par ${usage.count} spectacle(s).`);
            return;
        }

        const result = await removeCategory(categoryId);
        if (result.error) {
            alert(`Erreur: ${result.error}`);
        }
    };

    // Gérer les publics cibles
    const handleAddTargetAudience = async (name: string) => {
        const result = await createTargetAudience(name);
        if (result.error) {
            alert(`Erreur: ${result.error}`);
        }
    };

    const handleRemoveTargetAudience = async (id: string) => {
        const usage = await checkTargetAudienceUsage(id);
        const audienceName = rawTargetAudiences.find(ta => ta.id === id)?.name || '';
        
        if (usage.used) {
            alert(`Impossible de supprimer "${audienceName}" : ce public cible est utilisé par ${usage.count} spectacle(s).`);
            return;
        }

        const result = await removeTargetAudience(id);
        if (result.error) {
            alert(`Erreur: ${result.error}`);
        }
    };

    // Gérer la création de compagnie
    const handleCreateCompany = async (data: { name: string; email: string }): Promise<string> => {
        const result = await createCompany({
            name: data.name.trim(),
            contact_email: data.email.trim(),
        });

        if (result.error || !result.data) {
            alert(`Erreur: ${result.error || 'Erreur inconnue'}`);
            return '';
        }

        return result.data.id;
    };

    // Auto-sélection de la compagnie nouvellement créée
    const handleCompanyCreated = (companyId: string) => {
        setNewlyCreatedCompanyId(companyId);
    };

    // Générer l'URL de la page spectacle
    const getShowUrl = (slug: string) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/spectacle/${slug}`;
    };

    // Copier le lien du spectacle (accepte tout objet avec id et slug)
    const handleCopyLink = async (show: { id: string; slug: string }) => {
        const url = getShowUrl(show.slug);
        try {
            await navigator.clipboard.writeText(url);
            setCopiedShowId(show.id);
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            copyTimeoutRef.current = setTimeout(() => {
                setCopiedShowId(null);
                copyTimeoutRef.current = null;
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    };

    // Naviguer vers les représentations
    const handleNavigateToRepresentations = (showId: string) => {
        router.push(`/admin/spectacles/${showId}/representations`);
    };

    return (
        <div className="space-y-6">
            {/* Header avec titre et bouton */}
            <AdminPageHeader
                title="Gestion des Spectacles"
                actionLabel="Ajouter un spectacle"
                onAction={handleCreate}
            />

            {/* Message d'erreur global */}
            {operationError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{operationError}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOperationError(null)}
                        className="ml-auto"
                    >
                        Fermer
                    </Button>
                </div>
            )}

            {/* Compteur de résultats et bouton réinitialiser */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {filteredShows.length} spectacle{filteredShows.length > 1 ? 's' : ''}
                    {hasActiveFilters && ` (sur ${shows.length} au total)`}
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

            {/* Barre de recherche + Toggle vue */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Rechercher un spectacle..."
                />

                {/* Toggle vue - Desktop uniquement */}
                <div className="hidden lg:flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-8 px-3 ${viewMode === 'list' ? 'bg-derviche hover:bg-derviche-light text-white' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <LayoutList className="w-4 h-4 mr-2" />
                        Liste
                    </Button>
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-derviche hover:bg-derviche-light text-white' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Grille
                    </Button>
                </div>
            </div>

            {/* Tableau des spectacles - Desktop mode Liste */}
            {viewMode === 'list' && (
                <div className="hidden lg:block rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Compagnie</TableHead>
                                <TableHead>Catégories</TableHead>
                                <TableHead>Représentations</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredShows.map((show) => (
                                <TableRow key={show.id}>
                                    <TableCell className="font-medium">
                                        <button
                                            onClick={() => handleView(show)}
                                            className="cursor-pointer hover:text-derviche hover:underline text-left"
                                        >
                                            {show.title}
                                        </button>
                                    </TableCell>
                                    <TableCell>{show.companyName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {show.categories.map((cat) => (
                                                <Badge key={cat} className="bg-gold/10 text-gold border-gold/20">
                                                    {cat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                            onClick={() => handleNavigateToRepresentations(show.id)}
                                        >
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {show.representationsCount} repr.
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={show.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => void handleCopyLink(show)}
                                                title="Copier le lien de réservation"
                                            >
                                                {copiedShowId === show.id ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                                <span className="sr-only">Copier le lien</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleView(show)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="sr-only">Voir</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEdit(show)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => void handleDeleteClick(show)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="sr-only">Supprimer</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Grille des spectacles - Desktop mode Grille */}
            {viewMode === 'grid' && (
                <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredShows.map((show) => (
                        <Card key={show.id} className="overflow-hidden group hover:shadow-lg transition-shadow bg-white rounded-xl p-0 gap-0 h-full flex flex-col">
                            <div className="aspect-4/3 overflow-hidden relative">
                                {show.imageUrl ? (
                                    <Image
                                        src={show.imageUrl}
                                        alt={show.title}
                                        fill
                                        sizes="(max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        unoptimized={show.imageUrl.startsWith('data:')}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <span className="text-muted-foreground text-sm">Pas d&apos;image</span>
                                    </div>
                                )}
                                {show.categories[0] && (
                                    <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
                                        {show.categories[0]}
                                    </span>
                                )}
                                <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${show.status === 'published' ? 'bg-green-500 text-white' : show.status === 'draft' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {show.status === 'published' ? 'Disponible' : show.status === 'draft' ? 'Bientôt' : 'Terminé'}
                                </span>
                            </div>
                            <CardContent className="px-4 pb-4 pt-3 flex flex-col grow">
                                <p className="text-xs font-medium text-gold mb-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {show.period || 'Période non définie'}
                                </p>
                                <h3 className="font-bold text-lg mb-2 line-clamp-2 min-h-12 text-derviche-dark leading-tight cursor-pointer hover:text-derviche hover:underline" onClick={() => handleView(show)}>
                                    {show.title}
                                </h3>
                                <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{show.companyName}</p>
                                <div className="mb-4">
                                    <Badge className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20" onClick={() => handleNavigateToRepresentations(show.id)}>
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {show.representationsCount} représentations
                                    </Badge>
                                </div>
                                <div className="mt-auto flex items-center gap-1 pt-3 border-t">
                                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => void handleCopyLink(show)} title="Copier le lien">
                                        {copiedShowId === show.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleView(show)} title="Voir">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleEdit(show)} title="Modifier">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => void handleDeleteClick(show)} title="Supprimer">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Cartes des spectacles - Mobile uniquement */}
            <div className="lg:hidden space-y-4">
                {filteredShows.map((show) => (
                    <Card key={show.id} className="overflow-hidden p-0 gap-0">
                        <div className="aspect-video overflow-hidden relative">
                            {show.imageUrl ? (
                                <Image src={show.imageUrl} alt={show.title} fill sizes="100vw" className="object-cover" unoptimized={show.imageUrl.startsWith('data:')} />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground text-sm">Pas d&apos;image</span>
                                </div>
                            )}
                            {show.categories[0] && <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">{show.categories[0]}</span>}
                            <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${show.status === 'published' ? 'bg-green-500 text-white' : show.status === 'draft' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                                {show.status === 'published' ? 'Disponible' : show.status === 'draft' ? 'Bientôt' : 'Terminé'}
                            </span>
                        </div>
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-gold mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {show.period || 'Période non définie'}
                            </p>
                            <h3 className="font-bold text-lg mb-1 text-derviche-dark leading-tight cursor-pointer hover:text-derviche hover:underline" onClick={() => handleView(show)}>{show.title}</h3>
                            <p className="text-sm font-semibold text-foreground mb-1">{show.companyName}</p>
                            <div className="mb-2">
                                <Badge className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20" onClick={() => handleNavigateToRepresentations(show.id)}>
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {show.representationsCount} représentations
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1 pt-3 mt-3 border-t">
                                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => void handleCopyLink(show)}>
                                    {copiedShowId === show.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleView(show)}><Eye className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleEdit(show)}><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => void handleDeleteClick(show)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* === MODALES === */}

            {/* Modale création/édition de spectacle */}
            <SpectacleFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                editingShow={editingShowRaw}
                onSubmit={(data, isEditing) => handleFormSubmit(data, isEditing)}
                companies={companies}
                categories={categoryOptions}
                targetAudiences={targetAudiences}
                dervisheUsers={mockDervisheUsers}
                onOpenCategoriesManager={() => setIsCategoriesDialogOpen(true)}
                onOpenTargetAudiencesManager={() => setIsAudiencesDialogOpen(true)}
                onOpenNewCompanyDialog={() => setIsNewCompanyDialogOpen(true)}
                newlyCreatedCompanyId={newlyCreatedCompanyId}
                onClearNewlyCreatedCompanyId={() => setNewlyCreatedCompanyId(null)}
            />

            {/* Modale de visualisation */}
            <SpectacleViewDialog
                show={viewingShowRaw}
                categories={rawCategories}
                targetAudiences={rawTargetAudiences}
                onClose={() => {
                    setViewingShow(null);
                    setViewingShowRaw(null);
                }}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
                onCopyLink={(show) => void handleCopyLink(show)}
                copiedShowId={copiedShowId}
                onNavigateToRepresentations={handleNavigateToRepresentations}
                dervisheUsers={mockDervisheUsers}
            />

            {/* Modale de gestion des catégories */}
            <CategoryManagerDialog
                open={isCategoriesDialogOpen}
                onOpenChange={setIsCategoriesDialogOpen}
                categories={rawCategories}
                onAddCategory={(name) => handleAddCategory(name)}
                onRemoveCategory={(id) => handleRemoveCategoryById(id)}
            />

            {/* Modale de gestion des publics cibles */}
            <TargetAudienceManagerDialog
                open={isAudiencesDialogOpen}
                onOpenChange={setIsAudiencesDialogOpen}
                targetAudiences={targetAudiences}
                onAddTargetAudience={(name) => handleAddTargetAudience(name)}
                onRemoveTargetAudience={(id) => handleRemoveTargetAudience(id)}
            />

            {/* Modale création de compagnie */}
            <CompanyQuickCreateDialog
                open={isNewCompanyDialogOpen}
                onOpenChange={setIsNewCompanyDialogOpen}
                onCreateCompany={(data) => handleCreateCompany(data)}
                onCompanyCreated={handleCompanyCreated}
            />

            {/* Modale de confirmation de suppression */}
            <DeleteConfirmDialog
                open={showToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowToDelete(null);
                        setDeleteWarning(null);
                        pendingDeleteCheckRef.current = null;
                    }
                }}
                onConfirm={() => void handleConfirmDelete()}
                title="Supprimer ce spectacle ?"
                description={
                    deleteWarning
                        ? `${deleteWarning} Êtes-vous sûr de vouloir supprimer le spectacle « ${showToDelete?.title} » ?`
                        : `Êtes-vous sûr de vouloir supprimer le spectacle « ${showToDelete?.title} » ? Cette action est irréversible.`
                }
            />
        </div>
    );
}
