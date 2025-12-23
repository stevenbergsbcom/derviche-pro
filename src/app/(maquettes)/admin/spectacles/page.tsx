'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search, Eye, Settings, Upload, X, Maximize2, Minimize2, FolderOpen, Video, Film, Clock, Calendar, Users, User, Copy, Check, LayoutGrid, LayoutList, ArrowRight, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import { SafeHtml } from '@/components/ui/safe-html';
import { searchMatch } from '@/lib/utils';
import {
    mockShows,
    mockCompanies,
    mockCategories,
    mockAudiences,
    mockTargetAudiences,
    mockDervisheUsers,
    generateMockId,
    type MockShow,
    type MockCompany,
    type MockUser,
} from '@/lib/mock-data';
import type { ShowStatus } from '@/types/database';

// Fonction slugify
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
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
    const [shows, setShows] = useState<MockShow[]>(mockShows);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Extraire la valeur du paramètre search (stable pour les dépendances)
    const urlSearchParam = searchParams.get('search') || '';

    // Fix d'hydratation : nécessaire pour éviter les différences SSR/Client avec Radix UI
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Synchroniser la recherche avec le paramètre URL
    useEffect(() => {
        setSearchQuery(urlSearchParam);
    }, [urlSearchParam]);

    // Vérifier si des filtres sont actifs
    const hasActiveFilters = searchQuery.trim() !== '';

    // Réinitialiser les filtres (et nettoyer l'URL)
    const resetFilters = () => {
        setSearchQuery('');
        // Nettoyer le paramètre search de l'URL
        router.push('/admin/spectacles');
    };
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [editingShow, setEditingShow] = useState<MockShow | null>(null);
    const [showToDelete, setShowToDelete] = useState<MockShow | null>(null);
    const [viewingShow, setViewingShow] = useState<MockShow | null>(null);
    const [formData, setFormData] = useState<Omit<MockShow, 'id' | 'companyName'>>({
        slug: '',
        title: '',
        companyId: '',
        categories: [],
        targetAudienceIds: [],
        description: '',
        shortDescription: null,
        imageUrl: null,
        duration: null,
        audience: '',
        status: 'published',
        priceType: 'free',
        period: '',
        dervisheManagerId: '',
        dervisheManager: '',
        invitationPolicy: '',
        maxParticipantsPerBooking: undefined,
        closureDates: '',
        representationsCount: 0,
        folderUrl: '',
        teaserUrl: '',
        captationAvailable: false,
        captationUrl: '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup du timeout lors du démontage du composant
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    const [categories, setCategories] = useState<string[]>(mockCategories);
    const [audiences, setAudiences] = useState<string[]>(mockAudiences);
    const [targetAudiences, setTargetAudiences] = useState<{ id: string; name: string }[]>(mockTargetAudiences.map(ta => ({ id: ta.id, name: ta.name })));
    const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState<boolean>(false);
    const [isAudiencesDialogOpen, setIsAudiencesDialogOpen] = useState<boolean>(false);
    const [newCategory, setNewCategory] = useState<string>('');
    const [newAudience, setNewAudience] = useState<string>('');
    const [newTargetAudience, setNewTargetAudience] = useState<string>('');
    const [companies, setCompanies] = useState<MockCompany[]>(mockCompanies);
    const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState<boolean>(false);
    const [newCompanyData, setNewCompanyData] = useState<{ name: string; email: string }>({
        name: '',
        email: '',
    });
    const [isDialogExpanded, setIsDialogExpanded] = useState<boolean>(false);
    const [copiedShowId, setCopiedShowId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Auto-générer le slug depuis le titre (seulement en mode création)
    useEffect(() => {
        if (!editingShow) {
            setFormData((prev) => {
                if (prev.title) {
                    return { ...prev, slug: slugify(prev.title) };
                }
                return prev;
            });
        }
    }, [formData.title, editingShow]);


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

    // Attendre que le composant soit monté côté client pour éviter les erreurs d'hydratation
    // (les composants Radix UI génèrent des IDs différents côté serveur et client)
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
        );
    }

    // Ouvrir la modale en mode création
    const handleCreate = () => {
        setEditingShow(null);
        setFormData({
            slug: '',
            title: '',
            companyId: '',
            categories: [],
            targetAudienceIds: [],
            description: '',
            shortDescription: null,
            imageUrl: null,
            duration: null,
            audience: '',
            status: 'published',
            priceType: 'free',
            period: '',
            dervisheManagerId: '',
            dervisheManager: '',
            invitationPolicy: '',
            maxParticipantsPerBooking: undefined,
            closureDates: '',
            representationsCount: 0,
            folderUrl: '',
            teaserUrl: '',
            captationAvailable: false,
            captationUrl: '',
        });
        setIsDialogOpen(true);
    };

    // Ouvrir la modale en mode édition
    const handleEdit = (show: MockShow) => {
        setEditingShow(show);
        setFormData({
            slug: show.slug,
            title: show.title,
            companyId: show.companyId,
            categories: show.categories,
            targetAudienceIds: show.targetAudienceIds || [],
            description: show.description || '',
            shortDescription: show.shortDescription,
            imageUrl: show.imageUrl,
            duration: show.duration,
            audience: show.audience || '',
            status: show.status,
            priceType: show.priceType,
            period: show.period || '',
            dervisheManagerId: show.dervisheManagerId || '',
            dervisheManager: show.dervisheManager || '',
            invitationPolicy: show.invitationPolicy || '',
            maxParticipantsPerBooking: show.maxParticipantsPerBooking,
            closureDates: show.closureDates || '',
            representationsCount: show.representationsCount,
            folderUrl: show.folderUrl || '',
            teaserUrl: show.teaserUrl || '',
            captationAvailable: show.captationAvailable,
            captationUrl: show.captationUrl || '',
        });
        setIsDialogOpen(true);
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

    // Fermer la modale
    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingShow(null);
    };

    // Soumettre le formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingShow) {
            // Édition
            setShows((prev) =>
                prev.map((s) =>
                    s.id === editingShow.id
                        ? {
                            ...s,
                            slug: formData.slug,
                            title: formData.title,
                            companyId: formData.companyId,
                            companyName: companies.find((c) => c.id === formData.companyId)?.name || s.companyName,
                            categories: formData.categories,
                            targetAudienceIds: formData.targetAudienceIds,
                            description: formData.description,
                            shortDescription: formData.shortDescription,
                            imageUrl: formData.imageUrl,
                            duration: formData.duration,
                            audience: formData.audience,
                            status: formData.status,
                            priceType: formData.priceType,
                            period: formData.period,
                            dervisheManagerId: formData.dervisheManagerId,
                            dervisheManager: formData.dervisheManager,
                            invitationPolicy: formData.invitationPolicy,
                            maxParticipantsPerBooking: formData.maxParticipantsPerBooking,
                            closureDates: formData.closureDates,
                            folderUrl: formData.folderUrl,
                            teaserUrl: formData.teaserUrl,
                            captationAvailable: formData.captationAvailable,
                            captationUrl: formData.captationUrl,
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
                    slug: formData.slug,
                    title: formData.title,
                    companyId: formData.companyId,
                    companyName,
                    categories: formData.categories,
                    targetAudienceIds: formData.targetAudienceIds,
                    description: formData.description,
                    shortDescription: formData.shortDescription,
                    imageUrl: formData.imageUrl,
                    duration: formData.duration,
                    audience: formData.audience,
                    status: formData.status,
                    priceType: formData.priceType,
                    period: formData.period,
                    dervisheManagerId: formData.dervisheManagerId,
                    dervisheManager: formData.dervisheManager,
                    invitationPolicy: formData.invitationPolicy,
                    maxParticipantsPerBooking: formData.maxParticipantsPerBooking,
                    closureDates: formData.closureDates,
                    representationsCount: 0,
                    folderUrl: formData.folderUrl,
                    teaserUrl: formData.teaserUrl,
                    captationAvailable: formData.captationAvailable,
                    captationUrl: formData.captationUrl,
                },
            ]);
        }

        handleCloseDialog();
    };

    // Gérer les catégories
    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const handleRemoveCategory = (category: string) => {
        // Vérifier si la catégorie est utilisée par un spectacle
        const isUsed = shows.some(show => show.categories.includes(category));
        if (isUsed) {
            alert(`Impossible de supprimer "${category}" : cette catégorie est utilisée par un ou plusieurs spectacles.`);
            return;
        }
        setCategories(categories.filter((c) => c !== category));
    };

    // Gérer les publics
    const handleAddAudience = () => {
        if (newAudience.trim() && !audiences.includes(newAudience.trim())) {
            setAudiences([...audiences, newAudience.trim()]);
            setNewAudience('');
        }
    };

    const handleRemoveAudience = (audience: string) => {
        setAudiences(audiences.filter((a) => a !== audience));
    };

    // Gérer les publics cibles (target audiences)
    const handleAddTargetAudience = () => {
        if (newTargetAudience.trim() && !targetAudiences.some(ta => ta.name === newTargetAudience.trim())) {
            const newId = generateMockId('audience');
            setTargetAudiences([...targetAudiences, { id: newId, name: newTargetAudience.trim() }]);
            setNewTargetAudience('');
        }
    };

    const handleRemoveTargetAudience = (audienceId: string) => {
        // Vérifier si le public cible est utilisé par un spectacle
        const audienceName = targetAudiences.find(ta => ta.id === audienceId)?.name || '';
        const isUsed = shows.some(show => show.targetAudienceIds?.includes(audienceId));
        if (isUsed) {
            alert(`Impossible de supprimer "${audienceName}" : ce public cible est utilisé par un ou plusieurs spectacles.`);
            return;
        }
        setTargetAudiences(targetAudiences.filter((ta) => ta.id !== audienceId));
    };

    // Gérer l'upload d'image
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Pour la maquette : simuler l'upload en créant une URL locale
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, imageUrl: null });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Obtenir le badge de statut
    const getStatusBadge = (status: ShowStatus) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Disponible</Badge>;
            case 'draft':
                return <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">Bientôt</Badge>;
            case 'archived':
                return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Terminé</Badge>;
            default:
                return null;
        }
    };

    // Générer l'URL de la page spectacle
    const getShowUrl = (slug: string) => {
        // En production, utiliser window.location.origin
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/spectacle/${slug}`;
    };

    // Copier le lien du spectacle
    const handleCopyLink = async (show: MockShow) => {
        const url = getShowUrl(show.slug);
        try {
            await navigator.clipboard.writeText(url);
            setCopiedShowId(show.id);

            // Nettoyer le timeout précédent s'il existe
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }

            // Réinitialiser après 2 secondes
            copyTimeoutRef.current = setTimeout(() => {
                setCopiedShowId(null);
                copyTimeoutRef.current = null;
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    };


    return (
        <div className="space-y-6">
            {/* Header avec titre et bouton */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-derviche-dark">
                    Gestion des Spectacles
                </h1>
                <Button
                    className="bg-derviche hover:bg-derviche-light text-white w-full lg:w-auto"
                    onClick={handleCreate}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un spectacle
                </Button>
            </div>

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
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Rechercher un spectacle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

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
                                            onClick={() => router.push(`/admin/spectacles/${show.id}/representations`)}
                                        >
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {show.representationsCount} repr.
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(show.status)}</TableCell>
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
                            {/* Image avec badges */}
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
                                {/* Badge catégorie */}
                                {show.categories[0] && (
                                    <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
                                        {show.categories[0]}
                                    </span>
                                )}
                                {/* Badge statut */}
                                <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${show.status === 'published' ? 'bg-green-500 text-white' :
                                    show.status === 'draft' ? 'bg-orange-500 text-white' :
                                        'bg-red-500 text-white'
                                    }`}>
                                    {show.status === 'published' ? 'Disponible' :
                                        show.status === 'draft' ? 'Bientôt' : 'Terminé'}
                                </span>
                            </div>

                            {/* Contenu de la card */}
                            <CardContent className="px-4 pb-4 pt-3 flex flex-col grow">
                                {/* Période */}
                                <p className="text-xs font-medium text-gold mb-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {show.period || 'Période non définie'}
                                </p>

                                {/* Titre - cliquable */}
                                <h3
                                    className="font-bold text-lg mb-2 line-clamp-2 min-h-12 text-derviche-dark leading-tight cursor-pointer hover:text-derviche hover:underline"
                                    onClick={() => handleView(show)}
                                >
                                    {show.title}
                                </h3>

                                {/* Compagnie */}
                                <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
                                    {show.companyName}
                                </p>

                                {/* Représentations */}
                                <div className="mb-4">
                                    <Badge
                                        className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                        onClick={() => router.push(`/admin/spectacles/${show.id}/representations`)}
                                    >
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {show.representationsCount} représentations
                                    </Badge>
                                </div>

                                {/* Actions - pousse vers le bas avec mt-auto */}
                                <div className="mt-auto flex items-center gap-1 pt-3 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() => handleCopyLink(show)}
                                        title="Copier le lien"
                                    >
                                        {copiedShowId === show.id ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() => handleView(show)}
                                        title="Voir les détails"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() => handleEdit(show)}
                                        title="Modifier"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteClick(show)}
                                        title="Supprimer"
                                    >
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
                        {/* Image avec badges */}
                        <div className="aspect-video overflow-hidden relative">
                            {show.imageUrl ? (
                                <Image
                                    src={show.imageUrl}
                                    alt={show.title}
                                    fill
                                    sizes="100vw"
                                    className="object-cover"
                                    unoptimized={show.imageUrl.startsWith('data:')}
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground text-sm">Pas d&apos;image</span>
                                </div>
                            )}
                            {/* Badge catégorie */}
                            {show.categories[0] && (
                                <span className="absolute top-2 left-2 bg-gold text-white text-xs font-semibold px-2 py-1 rounded">
                                    {show.categories[0]}
                                </span>
                            )}
                            {/* Badge statut */}
                            <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${show.status === 'published' ? 'bg-green-500 text-white' :
                                show.status === 'draft' ? 'bg-orange-500 text-white' :
                                    'bg-red-500 text-white'
                                }`}>
                                {show.status === 'published' ? 'Disponible' :
                                    show.status === 'draft' ? 'Bientôt' : 'Terminé'}
                            </span>
                        </div>

                        {/* Contenu */}
                        <CardContent className="p-4">
                            {/* Période */}
                            <p className="text-xs font-medium text-gold mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {show.period || 'Période non définie'}
                            </p>

                            {/* Titre cliquable */}
                            <h3
                                className="font-bold text-lg mb-1 text-derviche-dark leading-tight cursor-pointer hover:text-derviche hover:underline"
                                onClick={() => handleView(show)}
                            >
                                {show.title}
                            </h3>

                            {/* Compagnie */}
                            <p className="text-sm font-semibold text-foreground mb-1">
                                {show.companyName}
                            </p>

                            {/* Représentations */}
                            <div className="mb-2">
                                <Badge
                                    className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                    onClick={() => router.push(`/admin/spectacles/${show.id}/representations`)}
                                >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {show.representationsCount} représentations
                                </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 pt-3 mt-3 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-9"
                                    onClick={() => handleCopyLink(show)}
                                >
                                    {copiedShowId === show.id ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-9"
                                    onClick={() => handleView(show)}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-9"
                                    onClick={() => handleEdit(show)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(show)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modale création/édition */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className={`w-full max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col transition-all duration-200 ${isDialogExpanded ? 'sm:max-w-6xl sm:h-[90vh]' : 'sm:max-w-3xl'}`}>
                    <DialogHeader className="relative">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle>
                                    {editingShow ? 'Modifier le spectacle' : 'Ajouter un spectacle'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingShow
                                        ? 'Modifiez les informations du spectacle ci-dessous.'
                                        : 'Remplissez les informations pour créer un nouveau spectacle.'}
                                </DialogDescription>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="hidden sm:flex h-8 w-8 shrink-0"
                                onClick={() => setIsDialogExpanded(!isDialogExpanded)}
                                title={isDialogExpanded ? 'Réduire' : 'Agrandir'}
                            >
                                {isDialogExpanded ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                                <span className="sr-only">{isDialogExpanded ? 'Réduire' : 'Agrandir'}</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-1">
                            <div className="space-y-4">
                                {/* Titre + Slug affiché */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre *</Label>
                                    <Input
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                    {formData.slug && (
                                        <p className="text-xs text-muted-foreground">
                                            Slug : <span className="font-mono">{formData.slug}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Compagnie */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyId">Compagnie *</Label>
                                    <Select
                                        value={formData.companyId ? String(formData.companyId) : ''}
                                        onValueChange={(value) => {
                                            if (value === 'new') {
                                                setIsNewCompanyDialogOpen(true);
                                            } else {
                                                setFormData({ ...formData, companyId: value });
                                            }
                                        }}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une compagnie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={String(company.id)}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                            <div className="border-t my-1" />
                                            <SelectItem value="new" className="text-derviche font-medium">
                                                ➕ Créer une nouvelle compagnie...
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Encadré Catégories */}
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Catégories *</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsCategoriesDialogOpen(true)}
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                Gérer
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((category) => (
                                                <div key={category} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`category-${category}`}
                                                        checked={formData.categories.includes(category)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    categories: [...formData.categories, category],
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    categories: formData.categories.filter((c) => c !== category),
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer">
                                                        {category}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Encadré Publics cibles (multiselect) */}
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Publics cibles</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsAudiencesDialogOpen(true)}
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                Gérer
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Sélectionnez un ou plusieurs publics cibles pour ce spectacle.
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {targetAudiences.map((targetAudience) => (
                                                <div key={targetAudience.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`target-audience-${targetAudience.id}`}
                                                        checked={formData.targetAudienceIds.includes(targetAudience.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    targetAudienceIds: [...formData.targetAudienceIds, targetAudience.id],
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    targetAudienceIds: formData.targetAudienceIds.filter((id) => id !== targetAudience.id),
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`target-audience-${targetAudience.id}`} className="font-normal cursor-pointer">
                                                        {targetAudience.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>


                                {/* Statut et Durée */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Statut *</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: ShowStatus) => setFormData({ ...formData, status: value })}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="published">Disponible</SelectItem>
                                                <SelectItem value="draft">Bientôt</SelectItem>
                                                <SelectItem value="archived">Terminé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Durée (en minutes)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            min="1"
                                            value={formData.duration || ''}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value ? parseInt(e.target.value) : null })}
                                        />
                                    </div>
                                </div>

                                {/* Période */}
                                <div className="space-y-2">
                                    <Label htmlFor="period">Période</Label>
                                    <Input
                                        id="period"
                                        value={formData.period}
                                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                        placeholder="Ex: Automne 2025"
                                    />
                                </div>

                                {/* Dates de relâche */}
                                <div className="space-y-2">
                                    <Label htmlFor="closureDates">Dates de relâche</Label>
                                    <Input
                                        id="closureDates"
                                        value={formData.closureDates}
                                        onChange={(e) => setFormData({ ...formData, closureDates: e.target.value })}
                                        placeholder="Ex: Relâche le lundi"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <WysiwygEditor
                                        value={formData.description || ''}
                                        onChange={(value) => setFormData({ ...formData, description: value })}
                                        placeholder="Description du spectacle..."
                                        rows={4}
                                    />
                                </div>

                                {/* Politique invitation/détaxe */}
                                <div className="space-y-2">
                                    <Label htmlFor="invitationPolicy">Politique invitation/détaxe</Label>
                                    <WysiwygEditor
                                        value={formData.invitationPolicy || ''}
                                        onChange={(value) => setFormData({ ...formData, invitationPolicy: value })}
                                        placeholder="Conditions d'invitation et détaxe..."
                                        rows={3}
                                    />
                                </div>

                                {/* Nombre max participants */}
                                <div className="space-y-2">
                                    <Label htmlFor="maxParticipantsPerBooking">Nombre max de participants par réservation</Label>
                                    <Input
                                        id="maxParticipantsPerBooking"
                                        type="number"
                                        min="1"
                                        value={formData.maxParticipantsPerBooking || ''}
                                        onChange={(e) => setFormData({ ...formData, maxParticipantsPerBooking: e.target.value ? parseInt(e.target.value) : undefined })}
                                    />
                                </div>

                                {/* Responsable Derviche */}
                                <div className="space-y-2">
                                    <Label htmlFor="dervisheManagerId">Responsable Derviche</Label>
                                    <Select
                                        value={formData.dervisheManagerId || ''}
                                        onValueChange={(value) => {
                                            const selectedUser = mockDervisheUsers.find(u => u.id === value);
                                            setFormData({
                                                ...formData,
                                                dervisheManagerId: value || '',
                                                dervisheManager: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '',
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un responsable" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun responsable</SelectItem>
                                            {mockDervisheUsers
                                                .filter(user => user.role === 'super-admin' || user.role === 'admin')
                                                .map((user) => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.firstName} {user.lastName}
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            ({user.role === 'super-admin' ? 'Super Admin' : 'Admin'})
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Personne responsable du suivi de ce spectacle chez Derviche Diffusion
                                    </p>
                                </div>

                                {/* URL du dossier */}
                                <div className="space-y-2">
                                    <Label htmlFor="folderUrl">URL du dossier</Label>
                                    <Input
                                        id="folderUrl"
                                        type="url"
                                        value={formData.folderUrl}
                                        onChange={(e) => setFormData({ ...formData, folderUrl: e.target.value })}
                                        placeholder="https://drive.google.com/... ou https://dropbox.com/..."
                                    />
                                </div>

                                {/* URL teaser */}
                                <div className="space-y-2">
                                    <Label htmlFor="teaserUrl">URL du teaser</Label>
                                    <Input
                                        id="teaserUrl"
                                        type="url"
                                        value={formData.teaserUrl}
                                        onChange={(e) => setFormData({ ...formData, teaserUrl: e.target.value })}
                                        placeholder="https://vimeo.com/... ou https://youtube.com/..."
                                    />
                                </div>

                                {/* Captation - Encadré */}
                                <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Switch
                                            id="captationAvailable"
                                            checked={formData.captationAvailable}
                                            onCheckedChange={(checked) => {
                                                setFormData({
                                                    ...formData,
                                                    captationAvailable: checked,
                                                    captationUrl: checked ? formData.captationUrl : '',
                                                });
                                            }}
                                        />
                                        <div className="flex-1">
                                            <Label htmlFor="captationAvailable" className="font-medium cursor-pointer">
                                                Captation disponible
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Une captation vidéo du spectacle est disponible pour les professionnels
                                            </p>
                                        </div>
                                    </div>

                                    {/* URL captation - affiché seulement si captation disponible */}
                                    {formData.captationAvailable && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <Label htmlFor="captationUrl">URL de la captation</Label>
                                            <Input
                                                id="captationUrl"
                                                type="url"
                                                value={formData.captationUrl}
                                                onChange={(e) => setFormData({ ...formData, captationUrl: e.target.value })}
                                                placeholder="https://vimeo.com/... ou lien privé"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Image */}
                                <div className="space-y-2">
                                    <Label>Image</Label>
                                    {formData.imageUrl ? (
                                        <div className="relative">
                                            <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
                                                <Image
                                                    src={formData.imageUrl}
                                                    alt="Aperçu"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    className="object-cover"
                                                    unoptimized={formData.imageUrl.startsWith('data:')}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8"
                                                    onClick={handleRemoveImage}
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span className="sr-only">Supprimer l&apos;image</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={handleImageClick}
                                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <Upload className="w-8 h-8 text-muted-foreground" />
                                                <p className="text-sm font-medium text-center">
                                                    Glissez une image ou cliquez pour sélectionner
                                                </p>
                                                <p className="text-xs text-muted-foreground text-center">
                                                    Formats acceptés : JPG, PNG, WebP. Taille max : 300 Ko. Dimensions recommandées : 800x600px
                                                </p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                className="w-full sm:w-auto"
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="bg-derviche hover:bg-derviche-light text-white w-full sm:w-auto"
                            >
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modale de gestion des catégories */}
            <Dialog open={isCategoriesDialogOpen} onOpenChange={setIsCategoriesDialogOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gérer les catégories</DialogTitle>
                        <DialogDescription>
                            Ajoutez ou supprimez des catégories de spectacles.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {categories.map((category) => (
                                <div key={category} className="flex items-center justify-between p-2 border rounded">
                                    <span className="text-sm">{category}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveCategory(category)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="sr-only">Supprimer</span>
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Nouvelle catégorie"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCategory();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddCategory}>
                                Ajouter
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCategoriesDialogOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modale de gestion des publics cibles */}
            <Dialog open={isAudiencesDialogOpen} onOpenChange={setIsAudiencesDialogOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gérer les publics cibles</DialogTitle>
                        <DialogDescription>
                            Ajoutez ou supprimez des publics cibles pour vos spectacles.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {targetAudiences.map((audience) => (
                                <div key={audience.id} className="flex items-center justify-between p-2 border rounded">
                                    <span className="text-sm">{audience.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveTargetAudience(audience.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="sr-only">Supprimer</span>
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newTargetAudience}
                                onChange={(e) => setNewTargetAudience(e.target.value)}
                                placeholder="Nouveau public cible"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTargetAudience();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddTargetAudience}>
                                Ajouter
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAudiencesDialogOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modale création de compagnie */}
            <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
                <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Créer une nouvelle compagnie</DialogTitle>
                        <DialogDescription>
                            Ajoutez une nouvelle compagnie pour vos spectacles.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
                        <div className="space-y-2">
                            <Label htmlFor="newCompanyName">
                                Nom de la compagnie <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="newCompanyName"
                                type="text"
                                value={newCompanyData.name}
                                onChange={(e) =>
                                    setNewCompanyData({ ...newCompanyData, name: e.target.value })
                                }
                                placeholder="Ex: Compagnie du Soleil"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newCompanyEmail">
                                Email contact <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Cet email sera utilisé par la compagnie pour se connecter à la plateforme.
                            </p>
                            <Input
                                id="newCompanyEmail"
                                type="email"
                                value={newCompanyData.email}
                                onChange={(e) =>
                                    setNewCompanyData({ ...newCompanyData, email: e.target.value })
                                }
                                placeholder="email@compagnie.fr"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsNewCompanyDialogOpen(false);
                                setNewCompanyData({ name: '', email: '' });
                            }}
                            className="w-full sm:w-auto"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => {
                                if (!newCompanyData.name.trim() || !newCompanyData.email.trim()) {
                                    return;
                                }

                                // Générer un nouvel ID
                                const newId = generateMockId('company');

                                // Créer la nouvelle compagnie
                                const newCompany: MockCompany = {
                                    id: newId,
                                    name: newCompanyData.name.trim(),
                                    contactEmail: newCompanyData.email.trim(),
                                    contactPhone: null,
                                };

                                // Ajouter au state
                                setCompanies((prev) => [...prev, newCompany]);

                                // Sélectionner automatiquement cette nouvelle compagnie
                                setFormData((prev) => ({ ...prev, companyId: newId }));

                                // Fermer la modale et réinitialiser
                                setIsNewCompanyDialogOpen(false);
                                setNewCompanyData({ name: '', email: '' });
                            }}
                            disabled={!newCompanyData.name.trim() || !newCompanyData.email.trim()}
                            className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                        >
                            Créer et sélectionner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modale de visualisation des détails */}
            <Dialog open={viewingShow !== null} onOpenChange={(open) => !open && setViewingShow(null)}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col">
                    {/* Titre caché pour l'accessibilité (lecteurs d'écran) */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>{viewingShow?.title}</DialogTitle>
                    </DialogHeader>

                    {/* Image en haut sans espace */}
                    {viewingShow?.imageUrl && (
                        <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-t-lg">
                            <Image
                                src={viewingShow.imageUrl}
                                alt={viewingShow.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 672px"
                                className="object-cover"
                                unoptimized={viewingShow.imageUrl.startsWith('data:')}
                            />
                        </div>
                    )}

                    {/* Header avec titre et compagnie */}
                    <div className="px-4 sm:px-6 pt-4 pb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{viewingShow?.title}</h2>
                        <p className="text-base text-muted-foreground mt-1">{viewingShow?.companyName}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                        {/* Catégories et Statut en ligne */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {viewingShow?.categories?.map((cat) => (
                                <Badge key={cat} className="bg-gold/10 text-gold border-gold/20">
                                    {cat}
                                </Badge>
                            ))}
                            {getStatusBadge(viewingShow?.status || 'published')}
                        </div>

                        {/* Slug avec bouton copier */}
                        <div className="flex items-center gap-2 mb-4">
                            <p className="text-xs text-muted-foreground font-mono">
                                /{viewingShow?.slug}
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => viewingShow && handleCopyLink(viewingShow)}
                            >
                                {viewingShow && copiedShowId === viewingShow.id ? (
                                    <>
                                        <Check className="w-3 h-3 mr-1 text-green-600" />
                                        <span className="text-green-600">Copié !</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copier le lien
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Description */}
                        {viewingShow?.description && (
                            <div className="mb-6">
                                <SafeHtml
                                    html={viewingShow.description}
                                    className="text-sm text-muted-foreground"
                                />
                            </div>
                        )}

                        {/* === SECTION 1 : Infos générales === */}
                        <div className="border rounded-lg p-4 mb-4 bg-muted/10">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Informations générales
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {/* Durée */}
                                {viewingShow?.duration && (
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Durée</p>
                                            <p className="text-sm text-foreground">{viewingShow.duration} min</p>
                                        </div>
                                    </div>
                                )}

                                {/* Public */}
                                {viewingShow?.audience && (
                                    <div className="flex items-start gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Public</p>
                                            <p className="text-sm text-foreground">{viewingShow.audience}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Période */}
                                {viewingShow?.period && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Période</p>
                                        <p className="text-sm text-foreground">{viewingShow.period}</p>
                                    </div>
                                )}

                                {/* Dates de relâche */}
                                {viewingShow?.closureDates && (
                                    <div className="sm:col-span-2">
                                        <p className="text-xs text-muted-foreground">Relâche</p>
                                        <p className="text-sm text-foreground">{viewingShow.closureDates}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* === SECTION 2 : Représentations === */}
                        <div className="border rounded-lg p-4 mb-4 bg-muted/10">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Représentations
                            </h3>
                            <div className="space-y-3">
                                {viewingShow && viewingShow.representationsCount > 0 ? (
                                    <>
                                        <p className="text-sm text-foreground">
                                            {viewingShow.representationsCount} représentation{viewingShow.representationsCount > 1 ? 's' : ''} programmée{viewingShow.representationsCount > 1 ? 's' : ''}
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/admin/spectacles/${viewingShow.id}/representations`)}
                                            className="w-full sm:w-auto"
                                        >
                                            Voir les représentations
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground italic">
                                            Aucune représentation programmée
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => viewingShow && router.push(`/admin/spectacles/${viewingShow.id}/representations`)}
                                            className="w-full sm:w-auto"
                                        >
                                            Ajouter des représentations
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* === SECTION 3 : Réservations & Politique === */}
                        <div className="border rounded-lg p-4 mb-4 bg-muted/10">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Réservations & Politique
                            </h3>
                            <div className="space-y-3">
                                {/* Max participants */}
                                {viewingShow?.maxParticipantsPerBooking && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Nombre max de participants par réservation</p>
                                        <p className="text-sm text-foreground font-medium">{viewingShow.maxParticipantsPerBooking} personne(s)</p>
                                    </div>
                                )}

                                {/* Politique invitation/détaxe */}
                                {viewingShow?.invitationPolicy && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Politique invitation/détaxe</p>
                                        <SafeHtml
                                            html={viewingShow.invitationPolicy}
                                            className="text-sm text-foreground"
                                        />
                                    </div>
                                )}

                                {/* Si aucune info */}
                                {!viewingShow?.maxParticipantsPerBooking && !viewingShow?.invitationPolicy && (
                                    <p className="text-sm text-muted-foreground italic">Aucune politique définie</p>
                                )}
                            </div>
                        </div>

                        {/* === SECTION 4 : Ressources & Médias === */}
                        <div className="border rounded-lg p-4 mb-4 bg-muted/10">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Ressources & Médias
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {/* URL du dossier */}
                                <div className="flex items-start gap-2">
                                    <FolderOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Dossier</p>
                                        {viewingShow?.folderUrl ? (
                                            <a
                                                href={viewingShow.folderUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-derviche hover:underline"
                                            >
                                                Ouvrir le dossier
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Non renseigné</p>
                                        )}
                                    </div>
                                </div>

                                {/* URL teaser */}
                                <div className="flex items-start gap-2">
                                    <Film className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Teaser</p>
                                        {viewingShow?.teaserUrl ? (
                                            <a
                                                href={viewingShow.teaserUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-derviche hover:underline"
                                            >
                                                Voir le teaser
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Non renseigné</p>
                                        )}
                                    </div>
                                </div>

                                {/* Captation */}
                                <div className="flex items-start gap-2 sm:col-span-2">
                                    <Video className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Captation</p>
                                        {viewingShow?.captationAvailable ? (
                                            viewingShow?.captationUrl ? (
                                                <a
                                                    href={viewingShow.captationUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-derviche hover:underline"
                                                >
                                                    Voir la captation
                                                </a>
                                            ) : (
                                                <p className="text-sm text-foreground">Disponible (lien non renseigné)</p>
                                            )
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Non disponible</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* === SECTION 5 : Gestion Derviche === */}
                        <div className="border rounded-lg p-4 bg-muted/10">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Gestion Derviche Diffusion
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                {/* Responsable Derviche */}
                                <div>
                                    <p className="text-xs text-muted-foreground">Responsable</p>
                                    {viewingShow?.dervisheManagerId ? (
                                        <p className="text-sm text-foreground">
                                            {mockDervisheUsers.find(u => u.id === viewingShow.dervisheManagerId)
                                                ? `${mockDervisheUsers.find(u => u.id === viewingShow.dervisheManagerId)?.firstName} ${mockDervisheUsers.find(u => u.id === viewingShow.dervisheManagerId)?.lastName}`
                                                : viewingShow.dervisheManager || 'Non assigné'}
                                        </p>
                                    ) : (
                                        <p className="text-sm italic text-muted-foreground">Non assigné</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleViewToEdit}
                            className="w-full sm:w-auto"
                        >
                            Modifier
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleViewToDelete}
                            className="w-full sm:w-auto"
                        >
                            Supprimer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modale de confirmation de suppression */}
            <AlertDialog open={showToDelete !== null} onOpenChange={(open) => !open && setShowToDelete(null)}>
                <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce spectacle ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le spectacle « {showToDelete?.title} » ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="w-full sm:w-auto text-white bg-destructive hover:bg-destructive/90"
                        >
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
