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
import { Pencil, Trash2, Eye, Copy, Check, LayoutGrid, LayoutList, Calendar, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { searchMatch } from '@/lib/utils';
import {
    mockShows,
    mockCompanies,
    mockCategories,
    mockTargetAudiences,
    mockDervisheUsers,
    generateMockId,
    type MockShow,
    type MockCompany,
} from '@/lib/mock-data';

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
    type SpectacleFormData,
} from '@/components/admin/spectacles';

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

    // Données principales
    const [shows, setShows] = useState<MockShow[]>(mockShows);
    const [companies, setCompanies] = useState<MockCompany[]>(mockCompanies);
    const [categories, setCategories] = useState<string[]>(mockCategories);
    const [targetAudiences, setTargetAudiences] = useState<{ id: string; name: string }[]>(
        mockTargetAudiences.map(ta => ({ id: ta.id, name: ta.name }))
    );

    // État de recherche
    const [searchQuery, setSearchQuery] = useState<string>('');
    const urlSearchParam = searchParams.get('search') || '';

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingShow, setEditingShow] = useState<MockShow | null>(null);
    const [viewingShow, setViewingShow] = useState<MockShow | null>(null);
    const [showToDelete, setShowToDelete] = useState<MockShow | null>(null);
    const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState<boolean>(false);
    const [isAudiencesDialogOpen, setIsAudiencesDialogOpen] = useState<boolean>(false);
    const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState<boolean>(false);
    const [newlyCreatedCompanyId, setNewlyCreatedCompanyId] = useState<string | null>(null);

    // État pour le feedback de copie
    const [copiedShowId, setCopiedShowId] = useState<string | null>(null);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Attendre que le composant soit monté
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // === HANDLERS ===

    // Ouvrir la modale en mode création
    const handleCreate = () => {
        setEditingShow(null);
        setIsFormDialogOpen(true);
    };

    // Ouvrir la modale en mode édition
    const handleEdit = (show: MockShow) => {
        setEditingShow(show);
        setIsFormDialogOpen(true);
    };

    // Gérer la suppression
    const handleDeleteClick = (show: MockShow) => {
        setShowToDelete(show);
    };

    // Confirmer la suppression
    const handleConfirmDelete = () => {
        if (showToDelete) {
            setShows((prev) => prev.filter((s) => s.id !== showToDelete.id));
            setShowToDelete(null);
        }
    };

    // Ouvrir la modale de visualisation
    const handleView = (show: MockShow) => {
        setViewingShow(show);
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
            handleDeleteClick(showToRemove);
        }
    };

    // Soumettre le formulaire de spectacle
    const handleFormSubmit = (formData: SpectacleFormData, isEditing: boolean) => {
        if (isEditing && editingShow) {
            // Édition
            setShows((prev) =>
                prev.map((s) =>
                    s.id === editingShow.id
                        ? {
                            ...s,
                            ...formData,
                            companyName: companies.find((c) => c.id === formData.companyId)?.name || s.companyName,
                        }
                        : s
                )
            );
        } else {
            // Création
            const newId = generateMockId('show');
            const companyName = companies.find((c) => c.id === formData.companyId)?.name || '';
            setShows((prev) => [
                ...prev,
                {
                    id: newId,
                    ...formData,
                    companyName,
                },
            ]);
        }
        setEditingShow(null);
    };

    // Gérer les catégories
    const handleAddCategory = (category: string) => {
        if (!categories.includes(category)) {
            setCategories([...categories, category]);
        }
    };

    const handleRemoveCategory = (category: string) => {
        const isUsed = shows.some(show => show.categories.includes(category));
        if (isUsed) {
            alert(`Impossible de supprimer "${category}" : cette catégorie est utilisée par un ou plusieurs spectacles.`);
            return;
        }
        setCategories(categories.filter((c) => c !== category));
    };

    // Gérer les publics cibles
    const handleAddTargetAudience = (name: string) => {
        const newId = generateMockId('audience');
        setTargetAudiences([...targetAudiences, { id: newId, name }]);
    };

    const handleRemoveTargetAudience = (id: string) => {
        const audienceName = targetAudiences.find(ta => ta.id === id)?.name || '';
        const isUsed = shows.some(show => show.targetAudienceIds?.includes(id));
        if (isUsed) {
            alert(`Impossible de supprimer "${audienceName}" : ce public cible est utilisé par un ou plusieurs spectacles.`);
            return;
        }
        setTargetAudiences(targetAudiences.filter((ta) => ta.id !== id));
    };

    // Gérer la création de compagnie
    const handleCreateCompany = (data: { name: string; email: string }): string => {
        const newId = generateMockId('company');
        const newCompany: MockCompany = {
            id: newId,
            name: data.name,
            contactEmail: data.email,
            contactPhone: null,
        };
        setCompanies((prev) => [...prev, newCompany]);
        return newId;
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

    // Copier le lien du spectacle
    const handleCopyLink = async (show: MockShow) => {
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
                                                onClick={() => handleCopyLink(show)}
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
                                                onClick={() => handleDeleteClick(show)}
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
                                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleCopyLink(show)} title="Copier le lien">
                                        {copiedShowId === show.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleView(show)} title="Voir">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleEdit(show)} title="Modifier">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(show)} title="Supprimer">
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
                                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleCopyLink(show)}>
                                    {copiedShowId === show.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleView(show)}><Eye className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => handleEdit(show)}><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(show)}><Trash2 className="w-4 h-4" /></Button>
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
                editingShow={editingShow}
                onSubmit={handleFormSubmit}
                companies={companies}
                categories={categories}
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
                show={viewingShow}
                onClose={() => setViewingShow(null)}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
                onCopyLink={handleCopyLink}
                copiedShowId={copiedShowId}
                onNavigateToRepresentations={handleNavigateToRepresentations}
                dervisheUsers={mockDervisheUsers}
            />

            {/* Modale de gestion des catégories */}
            <CategoryManagerDialog
                open={isCategoriesDialogOpen}
                onOpenChange={setIsCategoriesDialogOpen}
                categories={categories}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
            />

            {/* Modale de gestion des publics cibles */}
            <TargetAudienceManagerDialog
                open={isAudiencesDialogOpen}
                onOpenChange={setIsAudiencesDialogOpen}
                targetAudiences={targetAudiences}
                onAddTargetAudience={handleAddTargetAudience}
                onRemoveTargetAudience={handleRemoveTargetAudience}
            />

            {/* Modale création de compagnie */}
            <CompanyQuickCreateDialog
                open={isNewCompanyDialogOpen}
                onOpenChange={setIsNewCompanyDialogOpen}
                onCreateCompany={handleCreateCompany}
                onCompanyCreated={handleCompanyCreated}
            />

            {/* Modale de confirmation de suppression */}
            <DeleteConfirmDialog
                open={showToDelete !== null}
                onOpenChange={(open) => !open && setShowToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Supprimer ce spectacle ?"
                description={`Êtes-vous sûr de vouloir supprimer le spectacle « ${showToDelete?.title} » ? Cette action est irréversible.`}
            />
        </div>
    );
}
