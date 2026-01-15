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
import { Mail, Phone, User, Shield, Calendar, Clock } from 'lucide-react';
import type { InternalUser, InternalRole } from '@/types/database';
import { translateRole } from '@/lib/services/internal-users';

// ============================================
// TYPES
// ============================================

export interface UserViewDialogProps {
    /** Utilisateur à afficher (null = modale fermée) */
    user: InternalUser | null;
    /** Callback pour fermer la modale */
    onClose: () => void;
    /** Callback pour passer en mode édition */
    onEdit: () => void;
    /** Callback pour supprimer l'utilisateur */
    onDelete: () => void | Promise<void>;
    /** Si true, autorise la suppression (false = utilisateur connecté) */
    canDelete?: boolean;
}

// ============================================
// HELPERS
// ============================================

/**
 * Retourne la couleur du badge selon le rôle
 */
function getRoleBadgeClass(role: InternalRole): string {
    switch (role) {
        case 'super-admin':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'admin':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'externe-dd':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

/**
 * Formate une date en français
 */
function formatDate(dateString: string | null): string {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Formate le nom complet
 */
function formatFullName(user: InternalUser): string {
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return 'Non renseigné';
}

// ============================================
// COMPOSANT
// ============================================

/**
 * Modale de visualisation d'un utilisateur interne
 */
export function UserViewDialog({
    user,
    onClose,
    onEdit,
    onDelete,
    canDelete = true,
}: UserViewDialogProps) {
    if (!user) return null;

    const fullName = formatFullName(user);
    const hasName = user.first_name || user.last_name;

    return (
        <Dialog open={!!user} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {hasName ? fullName : user.email}
                        {!canDelete && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Vous
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        <Badge className={getRoleBadgeClass(user.role)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {translateRole(user.role)}
                        </Badge>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {/* Informations personnelles */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Informations personnelles
                        </h4>
                        <div className="space-y-2">
                            {hasName && (
                                <p className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    {fullName}
                                </p>
                            )}
                            <p className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <a 
                                    href={`mailto:${user.email}`} 
                                    className="text-derviche hover:underline"
                                >
                                    {user.email}
                                </a>
                            </p>
                            {user.phone ? (
                                <p className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <a 
                                        href={`tel:${user.phone}`} 
                                        className="text-derviche hover:underline"
                                    >
                                        {user.phone}
                                    </a>
                                </p>
                            ) : (
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    <span className="italic">Téléphone non renseigné</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Activité
                        </h4>
                        <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Créé le :</span>
                                {formatDate(user.created_at)}
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Dernière connexion :</span>
                                {formatDate(user.last_login_at)}
                            </p>
                        </div>
                    </div>

                    {/* TODO: Assignations spectacles pour externe-dd */}
                    {user.role === 'externe-dd' && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                Spectacles assignés
                            </h4>
                            <p className="text-sm text-muted-foreground italic">
                                Fonctionnalité à venir
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4 mt-4 flex flex-col sm:flex-row gap-2">
                    {canDelete ? (
                        <Button
                            variant="outline"
                            onClick={() => void onDelete()}
                            className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            Supprimer
                        </Button>
                    ) : (
                        <span title="Vous ne pouvez pas supprimer votre propre compte" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                disabled
                                className="w-full opacity-50 cursor-not-allowed"
                            >
                                Supprimer
                            </Button>
                        </span>
                    )}
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
