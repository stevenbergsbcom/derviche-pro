'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import Image from 'next/image';
import { Settings, Upload, X, Maximize2, Minimize2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import type { ShowWithRelations } from '@/lib/services/shows';
import type { ShowStatus, ShowPriceType } from '@/types/database';

// Type pour les données du formulaire (adapté pour Supabase)
export interface SpectacleFormData {
    slug: string;
    title: string;
    companyId: string;
    categoryIds: string[];
    targetAudienceIds: string[];
    description: string;
    shortDescription: string | null;
    imageUrl: string | null;
    duration: number | null;
    status: ShowStatus;
    priceType: ShowPriceType;
    period: string;
    dervisheManagerId: string;
    invitationPolicy: string;
    maxParticipantsPerBooking: number | undefined;
    closureDates: string;
    folderUrl: string;
    teaserUrl: string;
    captationAvailable: boolean;
    captationUrl: string;
}

// Type pour les catégories (id + name)
export interface CategoryOption {
    id: string;
    name: string;
}

// Type pour les publics cibles
export interface TargetAudienceOption {
    id: string;
    name: string;
}

// Type pour les compagnies
export interface CompanyOption {
    id: string;
    name: string;
    contactEmail: string;
    contactPhone: string | null;
}

// Type pour les utilisateurs Derviche
export interface DervisheUserOption {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface SpectacleFormDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** Spectacle en cours d'édition (null = mode création) */
    editingShow: ShowWithRelations | null;
    /** Callback à la soumission du formulaire */
    onSubmit: (data: SpectacleFormData, isEditing: boolean) => void | Promise<void>;
    /** Liste des compagnies disponibles */
    companies: CompanyOption[];
    /** Liste des catégories disponibles (id + name) */
    categories: CategoryOption[];
    /** Liste des publics cibles disponibles */
    targetAudiences: TargetAudienceOption[];
    /** Liste des utilisateurs Derviche (pour le responsable) */
    dervisheUsers: DervisheUserOption[];
    /** Callback pour ouvrir la modale de gestion des catégories */
    onOpenCategoriesManager: () => void;
    /** Callback pour ouvrir la modale de gestion des publics cibles */
    onOpenTargetAudiencesManager: () => void;
    /** Callback pour ouvrir la modale de création de compagnie */
    onOpenNewCompanyDialog: () => void;
    /** ID de la compagnie nouvellement créée (pour auto-sélection) */
    newlyCreatedCompanyId?: string | null;
    /** Callback pour reset l'ID de la compagnie nouvellement créée */
    onClearNewlyCreatedCompanyId?: () => void;
}

// Fonction slugify
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Valeurs par défaut du formulaire
const defaultFormData: SpectacleFormData = {
    slug: '',
    title: '',
    companyId: '',
    categoryIds: [],
    targetAudienceIds: [],
    description: '',
    shortDescription: null,
    imageUrl: null,
    duration: null,
    status: 'published',
    priceType: 'free',
    period: '',
    dervisheManagerId: '',
    invitationPolicy: '',
    maxParticipantsPerBooking: undefined,
    closureDates: '',
    folderUrl: '',
    teaserUrl: '',
    captationAvailable: false,
    captationUrl: '',
};

/**
 * Modale de création/édition d'un spectacle
 */
export function SpectacleFormDialog({
    open,
    onOpenChange,
    editingShow,
    onSubmit,
    companies,
    categories,
    targetAudiences,
    dervisheUsers,
    onOpenCategoriesManager,
    onOpenTargetAudiencesManager,
    onOpenNewCompanyDialog,
    newlyCreatedCompanyId,
    onClearNewlyCreatedCompanyId,
}: SpectacleFormDialogProps) {
    const [formData, setFormData] = useState<SpectacleFormData>(defaultFormData);
    const [isDialogExpanded, setIsDialogExpanded] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-sélection de la nouvelle compagnie créée
    useEffect(() => {
        if (newlyCreatedCompanyId && open) {
            setFormData((prev) => ({ ...prev, companyId: newlyCreatedCompanyId }));
            if (onClearNewlyCreatedCompanyId) {
                onClearNewlyCreatedCompanyId();
            }
        }
    }, [newlyCreatedCompanyId, open, onClearNewlyCreatedCompanyId]);

    // Initialiser le formulaire quand on ouvre la modale
    useEffect(() => {
        if (open) {
            if (editingShow) {
                // Mode édition - convertir ShowWithRelations vers SpectacleFormData
                setFormData({
                    slug: editingShow.slug,
                    title: editingShow.title,
                    companyId: editingShow.company_id,
                    categoryIds: editingShow.category_ids || [],
                    targetAudienceIds: editingShow.target_audience_ids || [],
                    description: editingShow.long_description || '',
                    shortDescription: editingShow.short_description,
                    imageUrl: editingShow.image_url,
                    duration: editingShow.duration_minutes,
                    status: editingShow.status,
                    priceType: editingShow.price_type,
                    period: editingShow.period || '',
                    dervisheManagerId: editingShow.derviche_manager_id || '',
                    invitationPolicy: editingShow.invitation_policy || '',
                    maxParticipantsPerBooking: editingShow.max_reservations_per_booking,
                    closureDates: editingShow.closure_dates || '',
                    folderUrl: editingShow.folder_url || '',
                    teaserUrl: editingShow.teaser_url || '',
                    captationAvailable: editingShow.captation_available,
                    captationUrl: editingShow.captation_url || '',
                });
            } else {
                // Mode création
                setFormData(defaultFormData);
            }
        }
    }, [open, editingShow]);

    // Auto-générer le slug depuis le titre (seulement en mode création)
    useEffect(() => {
        if (!editingShow && formData.title) {
            setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }));
        }
    }, [formData.title, editingShow]);

    const handleClose = () => {
        onOpenChange(false);
        setFormData(defaultFormData);
        setIsDialogExpanded(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData, editingShow !== null);
            handleClose();
        } catch {
            // L'erreur est gérée par le parent (page.tsx) via setOperationError
            // On ne ferme pas le dialog pour permettre à l'utilisateur de corriger
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gérer l'upload d'image
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
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

                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col flex-1 overflow-hidden">
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
                                            onOpenNewCompanyDialog();
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
                                            onClick={onOpenCategoriesManager}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Gérer
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((category) => (
                                            <div key={category.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`category-${category.id}`}
                                                    checked={formData.categoryIds.includes(category.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFormData({
                                                                ...formData,
                                                                categoryIds: [...formData.categoryIds, category.id],
                                                            });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                categoryIds: formData.categoryIds.filter((id) => id !== category.id),
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`category-${category.id}`} className="font-normal cursor-pointer">
                                                    {category.name}
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
                                            onClick={onOpenTargetAudiencesManager}
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
                                    value={formData.dervisheManagerId || 'none'}
                                    onValueChange={(value) => {
                                        const actualValue = value === 'none' ? '' : value;
                                        setFormData({
                                            ...formData,
                                            dervisheManagerId: actualValue,
                                        });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un responsable" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Aucun responsable</SelectItem>
                                        {dervisheUsers
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
                            onClick={handleClose}
                            className="w-full sm:w-auto"
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            className="bg-derviche hover:bg-derviche-light text-white w-full sm:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
