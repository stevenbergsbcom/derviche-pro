'use client';

import { useState, useEffect } from 'react';
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
    Mail,
    Phone,
    User,
    Shield,
    Calendar,
    Clock,
    Building2,
    Clapperboard,
    AlertCircle,
} from 'lucide-react';
import { translateRole, type ManagedUser, type ManagedRole } from '@/lib/services/internal-users';
import { logger } from '@/lib/logger';
import type { ShowStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface UserViewDialogProps {
    /** Utilisateur à afficher (null = modale fermée) */
    user: ManagedUser | null;
    /** Callback pour fermer la modale */
    onClose: () => void;
    /** Callback pour passer en mode édition */
    onEdit: () => void;
    /** Callback pour supprimer l'utilisateur */
    onDelete: () => void | Promise<void>;
    /** Si true, autorise la suppression (false = utilisateur connecté) */
    canDelete?: boolean;
}

/** Spectacle assigné à un externe (via hosted_by_id sur les slots) */
interface AssignedShow {
    show_id: string;
    show_title: string;
    show_status: ShowStatus;
    slot_count: number;
    next_slot_date: string | null;
}

// ============================================
// HELPERS
// ============================================

function getRoleBadgeClass(role: ManagedRole): string {
    switch (role) {
        case 'super-admin': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'admin':       return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'externe':     return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'company':     return 'bg-teal-100 text-teal-800 border-teal-200';
        default:            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

function getShowStatusBadgeClass(status: ShowStatus): string {
    switch (status) {
        case 'published': return 'bg-green-100 text-green-800 border-green-200';
        case 'draft':     return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'archived':  return 'bg-orange-100 text-orange-700 border-orange-200';
    }
}

function translateShowStatus(status: ShowStatus): string {
    switch (status) {
        case 'published': return 'Publié';
        case 'draft':     return 'Brouillon';
        case 'archived':  return 'Archivé';
    }
}

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

/** Formate une date YYYY-MM-DD en français court (ex : "12 avr. 2026") */
function formatSlotDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function formatFullName(user: ManagedUser): string {
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.last_name)  return user.last_name;
    return 'Non renseigné';
}

// ============================================
// SOUS-COMPOSANT : Section spectacles assignés
// ============================================

interface AssignedShowsSectionProps {
    userId: string;
    /**
     * Clé de reset : quand elle change, le composant recharge depuis l'API.
     * On passe `user.id` pour relancer le fetch à chaque changement d'externe.
     */
    resetKey: string;
}

function AssignedShowsSection({ userId, resetKey }: AssignedShowsSectionProps) {
    const [shows, setShows]         = useState<AssignedShow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError]         = useState<string | null>(null);

    useEffect(() => {
        setShows([]);
        setError(null);
        setIsLoading(true);

        const controller = new AbortController();

        async function fetchAssignments() {
            try {
                const res = await fetch(
                    `/api/admin/users/${userId}/assignments`,
                    { signal: controller.signal }
                );

                if (!res.ok) {
                    const body = await res.json() as { error?: string };
                    throw new Error(body.error ?? `Erreur ${res.status}`);
                }

                const body = await res.json() as { success: boolean; data?: AssignedShow[] };
                setShows(body.data ?? []);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                const message = err instanceof Error ? err.message : 'Erreur inconnue';
                logger.error('AssignedShowsSection - Erreur fetch', { userId, error: message });
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }

        void fetchAssignments();
        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    if (isLoading) {
        return (
            <div className="space-y-2" aria-label="Chargement des spectacles…">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-10 w-full rounded-md bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Impossible de charger les spectacles : {error}
            </p>
        );
    }

    if (shows.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">
                Aucun spectacle assigné — cet externe n&apos;est responsable d&apos;accueil
                sur aucun créneau.
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {shows.map((show) => (
                <li
                    key={show.show_id}
                    className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                    <div className="flex items-start gap-2 min-w-0">
                        <Clapperboard className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">
                                {show.show_title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {show.slot_count} créneau{show.slot_count > 1 ? 'x' : ''}
                                {show.next_slot_date && (
                                    <> · prochain : {formatSlotDate(show.next_slot_date)}</>
                                )}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${getShowStatusBadgeClass(show.show_status)}`}
                    >
                        {translateShowStatus(show.show_status)}
                    </Badge>
                </li>
            ))}
        </ul>
    );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

/**
 * Modale de visualisation d'un utilisateur (interne ou company)
 */
export function UserViewDialog({
    user,
    onClose,
    onEdit,
    onDelete,
    canDelete = true,
}: UserViewDialogProps) {
    if (!user) return null;

    const fullName      = formatFullName(user);
    const hasName       = user.first_name || user.last_name;
    const isCompanyUser = user.role === 'company';
    const isExterne     = user.role === 'externe';
    const isDisabled    = user.disabled_at !== null;

    return (
        <Dialog open={!!user} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                        <User className="w-5 h-5" />
                        {hasName ? fullName : user.email}
                        {!canDelete && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Vous
                            </Badge>
                        )}
                        {isDisabled && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Inactif
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        <Badge className={getRoleBadgeClass(user.role)}>
                            {isCompanyUser ? (
                                <Building2 className="w-3 h-3 mr-1" />
                            ) : (
                                <Shield className="w-3 h-3 mr-1" />
                            )}
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
                                <a href={`mailto:${user.email}`} className="text-derviche hover:underline">
                                    {user.email}
                                </a>
                            </p>
                            {user.phone ? (
                                <p className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <a href={`tel:${user.phone}`} className="text-derviche hover:underline">
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

                    {/* Compagnie associée (utilisateurs company uniquement) */}
                    {isCompanyUser && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                Compagnie associée
                            </h4>
                            <div className="space-y-2">
                                {user.company_name ? (
                                    <p className="flex items-center gap-2 text-sm">
                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{user.company_name}</span>
                                    </p>
                                ) : (
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Building2 className="w-4 h-4" />
                                        <span className="italic">Aucune compagnie associée</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activité */}
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
                            {isDisabled && user.disabled_at && (
                                <p className="flex items-center gap-2 text-sm text-red-600">
                                    <Clock className="w-4 h-4" />
                                    <span>Désactivé le :</span>
                                    {formatDate(user.disabled_at)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Spectacles assignés — externes uniquement, chargement lazy */}
                    {isExterne && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                Spectacles assignés
                            </h4>
                            <AssignedShowsSection userId={user.id} resetKey={user.id} />
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
