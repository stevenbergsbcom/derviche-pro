'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import {
    FolderOpen,
    Video,
    Film,
    Clock,
    Calendar,
    Users,
    User,
    Copy,
    Check,
    ArrowRight,
} from 'lucide-react';
import { SafeHtml } from '@/components/ui/safe-html';
import { StatusBadge } from '@/components/admin';
import type { ShowWithRelations } from '@/lib/services/shows';
import type { ShowCategoryRow, TargetAudienceRow } from '@/types/database';

// Type pour les utilisateurs Derviche
interface DervisheUser {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface SpectacleViewDialogProps {
    /** Le spectacle à afficher (null = modale fermée) */
    show: ShowWithRelations | null;
    /** Liste des catégories pour afficher les noms */
    categories: ShowCategoryRow[];
    /** Liste des publics cibles pour afficher les noms */
    targetAudiences: TargetAudienceRow[];
    /** Callback quand la modale se ferme */
    onClose: () => void;
    /** Callback pour passer en mode édition */
    onEdit: () => void;
    /** Callback pour supprimer */
    onDelete: () => void | Promise<void>;
    /** Callback pour copier le lien */
    onCopyLink: (show: ShowWithRelations) => void | Promise<void>;
    /** ID du spectacle dont le lien vient d'être copié */
    copiedShowId: string | null;
    /** Callback pour naviguer vers les représentations */
    onNavigateToRepresentations: (showId: string) => void;
    /** Liste des utilisateurs Derviche pour afficher le responsable */
    dervisheUsers: DervisheUser[];
}

/**
 * Modale de visualisation détaillée d'un spectacle
 */
export function SpectacleViewDialog({
    show,
    categories,
    targetAudiences,
    onClose,
    onEdit,
    onDelete,
    onCopyLink,
    copiedShowId,
    onNavigateToRepresentations,
    dervisheUsers,
}: SpectacleViewDialogProps) {
    if (!show) return null;

    // Helper pour obtenir les noms de catégories
    const getCategoryNames = (categoryIds: string[]): string[] => {
        return categoryIds
            .map(id => categories.find(c => c.id === id)?.name)
            .filter((name): name is string => name !== undefined);
    };

    // Helper pour obtenir les noms des publics cibles
    const getTargetAudienceNames = (audienceIds: string[]): string[] => {
        return audienceIds
            .map(id => targetAudiences.find(ta => ta.id === id)?.name)
            .filter((name): name is string => name !== undefined);
    };

    const categoryNames = getCategoryNames(show.category_ids);
    const audienceNames = getTargetAudienceNames(show.target_audience_ids);

    return (
        <Dialog open={show !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col">
                {/* Titre caché pour l'accessibilité (lecteurs d'écran) */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{show.title}</DialogTitle>
                    <DialogDescription>
                        Détails du spectacle {show.title} de {show.company_name}
                    </DialogDescription>
                </DialogHeader>

                {/* Image en haut sans espace */}
                {show.image_url && (
                    <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-t-lg">
                        <Image
                            src={show.image_url}
                            alt={show.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 672px"
                            className="object-cover"
                            unoptimized={show.image_url.startsWith('data:')}
                        />
                    </div>
                )}

                {/* Header avec titre et compagnie */}
                <div className="px-4 sm:px-6 pt-4 pb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{show.title}</h2>
                    <p className="text-base text-muted-foreground mt-1">{show.company_name}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                    {/* Catégories et Statut en ligne */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {categoryNames.map((cat) => (
                            <Badge key={cat} className="bg-gold/10 text-gold border-gold/20">
                                {cat}
                            </Badge>
                        ))}
                        <StatusBadge status={show.status} />
                    </div>

                    {/* Publics cibles */}
                    {audienceNames.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">Publics :</span>
                            {audienceNames.map((name) => (
                                <Badge key={name} variant="outline" className="text-xs">
                                    {name}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Slug avec bouton copier */}
                    <div className="flex items-center gap-2 mb-4">
                        <p className="text-xs text-muted-foreground font-mono">
                            /{show.slug}
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => void onCopyLink(show)}
                        >
                            {copiedShowId === show.id ? (
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
                    {show.long_description && (
                        <div className="mb-6">
                            <SafeHtml
                                html={show.long_description}
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
                            {show.duration_minutes && (
                                <div className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Durée</p>
                                        <p className="text-sm text-foreground">{show.duration_minutes} min</p>
                                    </div>
                                </div>
                            )}

                            {/* Tarif */}
                            <div className="flex items-start gap-2">
                                <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Tarif</p>
                                    <p className="text-sm text-foreground">
                                        {show.price_type === 'free' ? 'Gratuit' : `Payant sur place${show.price_amount ? ` (${show.price_amount}€)` : ''}`}
                                    </p>
                                </div>
                            </div>

                            {/* Période */}
                            {show.period && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Période</p>
                                    <p className="text-sm text-foreground">{show.period}</p>
                                </div>
                            )}

                            {/* Dates de relâche */}
                            {show.closure_dates && (
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-muted-foreground">Relâche</p>
                                    <p className="text-sm text-foreground">{show.closure_dates}</p>
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
                            {show.representations_count > 0 ? (
                                <>
                                    <p className="text-sm text-foreground">
                                        {show.representations_count} représentation{show.representations_count > 1 ? 's' : ''} programmée{show.representations_count > 1 ? 's' : ''}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => onNavigateToRepresentations(show.id)}
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
                                        onClick={() => onNavigateToRepresentations(show.id)}
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
                            <div>
                                <p className="text-xs text-muted-foreground">Nombre max de participants par réservation</p>
                                <p className="text-sm text-foreground font-medium">{show.max_reservations_per_booking} personne(s)</p>
                            </div>

                            {/* Politique invitation/détaxe */}
                            {show.invitation_policy && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Politique invitation/détaxe</p>
                                    <SafeHtml
                                        html={show.invitation_policy}
                                        className="text-sm text-foreground"
                                    />
                                </div>
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
                                    {show.folder_url ? (
                                        <a
                                            href={show.folder_url}
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
                                    {show.teaser_url ? (
                                        <a
                                            href={show.teaser_url}
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
                                    {show.captation_available ? (
                                        show.captation_url ? (
                                            <a
                                                href={show.captation_url}
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
                                {show.derviche_manager_id ? (() => {
                                    const manager = dervisheUsers.find(u => u.id === show.derviche_manager_id);
                                    return (
                                        <p className="text-sm text-foreground">
                                            {manager ? `${manager.firstName} ${manager.lastName}` : 'Non assigné'}
                                        </p>
                                    );
                                })() : (
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
                        onClick={onEdit}
                        className="w-full sm:w-auto"
                    >
                        Modifier
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void onDelete()}
                        className="w-full sm:w-auto"
                    >
                        Supprimer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
