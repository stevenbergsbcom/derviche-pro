'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    MapPin, 
    Mail, 
    Phone, 
    User, 
    Theater, 
    ArrowRight, 
    Globe, 
    KeyRound,
    UserPlus,
    CheckCircle,
    XCircle
} from 'lucide-react';
import type { CompanyRow } from '@/types/database';
import type { ManagedUser } from '@/lib/services/internal-users';

// ============================================
// TYPES
// ============================================

// La vue accepte CompanyRow ou tout type qui l'étend (comme CompanyWithShowsCount)
export interface CompanyViewDialogProps {
    /** Compagnie à afficher (null = modale fermée) */
    company: (CompanyRow & { shows_count?: number }) | null;
    /** Callback pour fermer la modale */
    onClose: () => void;
    /** Callback pour passer en mode édition */
    onEdit: () => void;
    /** Callback pour supprimer (peut être async) */
    onDelete: () => void | Promise<void>;
    /** Nombre de spectacles de la compagnie */
    showsCount: number;
    /** Callback pour voir les spectacles */
    onViewShows: () => void;
    /** Utilisateur lié à la compagnie (null si aucun) */
    companyUser?: ManagedUser | null;
    /** Chargement de l'utilisateur en cours */
    isLoadingUser?: boolean;
    /** Callback pour créer un accès utilisateur */
    onCreateUser?: () => void;
}

// ============================================
// COMPOSANT
// ============================================

/**
 * Modale de visualisation d'une compagnie
 */
export function CompanyViewDialog({
    company,
    onClose,
    onEdit,
    onDelete,
    showsCount,
    onViewShows,
    companyUser,
    isLoadingUser = false,
    onCreateUser,
}: CompanyViewDialogProps) {
    if (!company) return null;

    return (
        <Dialog open={!!company} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">{company.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1">
                        {company.city ? (
                            <>
                                <MapPin className="w-4 h-4" />
                                {company.city}
                            </>
                        ) : (
                            <span>Détails de la compagnie</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {/* Spectacles */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Spectacles</h4>
                        <div className="flex items-center gap-2">
                            <Badge 
                                className="bg-derviche/10 text-derviche border-derviche/20 cursor-pointer hover:bg-derviche/20"
                                onClick={onViewShows}
                            >
                                <Theater className="w-3 h-3 mr-1" />
                                {showsCount} spectacle{showsCount > 1 ? 's' : ''}
                            </Badge>
                            {showsCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-derviche hover:text-derviche"
                                    onClick={onViewShows}
                                >
                                    Voir les spectacles
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Accès utilisateur plateforme */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <KeyRound className="w-4 h-4" />
                            Accès plateforme
                        </h4>
                        
                        {isLoadingUser ? (
                            <p className="text-sm text-muted-foreground animate-pulse">
                                Chargement...
                            </p>
                        ) : companyUser ? (
                            /* Utilisateur existant */
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">
                                        Compte actif
                                    </span>
                                    {companyUser.disabled_at && (
                                        <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                            Désactivé
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm">
                                    {(companyUser.first_name || companyUser.last_name) && (
                                        <p className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                                            {[companyUser.first_name, companyUser.last_name].filter(Boolean).join(' ')}
                                        </p>
                                    )}
                                    <p className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-green-700">{companyUser.email}</span>
                                    </p>
                                    {companyUser.phone && (
                                        <p className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                            {companyUser.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Pas d'utilisateur */
                            <div className="p-3 bg-muted/50 border border-dashed rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        Aucun accès configuré
                                    </span>
                                </div>
                                {onCreateUser && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCreateUser}
                                        className="w-full mt-2"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Créer un accès
                                    </Button>
                                )}
                            </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                            Cet accès permet à la compagnie de consulter ses réservations sur la plateforme.
                        </p>
                    </div>

                    {/* Description */}
                    {company.description && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                            <p className="text-sm">{company.description}</p>
                        </div>
                    )}

                    {/* Site web */}
                    {company.website && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Site web</h4>
                            <p className="flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <a 
                                    href={company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-derviche hover:underline"
                                >
                                    {company.website}
                                </a>
                            </p>
                        </div>
                    )}

                    {/* Contact métier */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Contact métier
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                            Contact pour l&apos;organisation des spectacles (différent de l&apos;accès plateforme)
                        </p>
                        <div className="space-y-2">
                            {company.contact_name && (
                                <p className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    {company.contact_name}
                                </p>
                            )}
                            {company.contact_email && (
                                <p className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <a href={`mailto:${company.contact_email}`} className="text-derviche hover:underline">
                                        {company.contact_email}
                                    </a>
                                </p>
                            )}
                            {company.contact_phone && (
                                <p className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <a href={`tel:${company.contact_phone}`} className="text-derviche hover:underline">
                                        {company.contact_phone}
                                    </a>
                                </p>
                            )}
                            {!company.contact_name && !company.contact_email && !company.contact_phone && (
                                <span className="text-sm text-muted-foreground italic">
                                    Aucun contact renseigné
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={onDelete}
                        className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        Supprimer
                    </Button>
                    <div className="flex-1" />
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Fermer
                    </Button>
                    <Button
                        onClick={onEdit}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        Modifier
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
