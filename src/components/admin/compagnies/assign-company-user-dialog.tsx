'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search, User, Loader2, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { searchMatch } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** Traduit le rôle en français (inclut 'company') */
function translateRoleLocal(role: string): string {
    const translations: Record<string, string> = {
        'super-admin': 'Super Admin',
        'admin': 'Admin',
        'externe': 'Externe DD',
        'company': 'Compagnie (dissocié)',
    };
    return translations[role] || role;
}

// ============================================
// TYPES
// ============================================

interface AssignableUser {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
}

export interface AssignCompanyUserDialogProps {
    /** Contrôle l'ouverture de la modale */
    open: boolean;
    /** Callback quand la modale se ferme */
    onOpenChange: (open: boolean) => void;
    /** ID de la compagnie à associer */
    companyId: string;
    /** Nom de la compagnie (pour l'affichage) */
    companyName: string;
    /** Callback après assignation réussie */
    onSuccess: () => void;
}

// ============================================
// COMPOSANT
// ============================================

/**
 * Modale pour assigner un utilisateur existant à une compagnie
 * 
 * Affiche la liste des utilisateurs qui peuvent être assignés :
 * - Utilisateurs avec rôle interne (super-admin, admin, externe)
 * - Utilisateurs 'company' dissociés (sans company_id)
 */
export function AssignCompanyUserDialog({
    open,
    onOpenChange,
    companyId,
    companyName,
    onSuccess,
}: AssignCompanyUserDialogProps) {
    // État
    const [users, setUsers] = useState<AssignableUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Charger les utilisateurs assignables
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // 1. Récupérer les utilisateurs internes (super-admin, admin, externe)
            const { data: internalUsers, error: internalError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    email,
                    first_name,
                    last_name,
                    company_id,
                    user_roles!inner (role)
                `)
                .is('deleted_at', null)
                .in('user_roles.role', ['super-admin', 'admin', 'externe'])
                .order('email');

            if (internalError) {
                logger.error('[AssignCompanyUserDialog] Erreur chargement internes', internalError);
                setError('Erreur lors du chargement des utilisateurs');
                return;
            }

            // 2. Récupérer les utilisateurs 'company' SANS company_id (dissociés)
            const { data: unlinkedCompanyUsers, error: companyError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    email,
                    first_name,
                    last_name,
                    company_id,
                    user_roles!inner (role)
                `)
                .is('deleted_at', null)
                .is('company_id', null)
                .eq('user_roles.role', 'company')
                .order('email');

            if (companyError) {
                logger.error('[AssignCompanyUserDialog] Erreur chargement company dissociés', companyError);
                // On continue avec les utilisateurs internes quand même
            }

            // Combiner les deux listes
            const allProfiles = [
                ...(internalUsers || []),
                ...(unlinkedCompanyUsers || []),
            ];

            // Transformer les données
            const assignableUsers: AssignableUser[] = allProfiles.map(profile => {
                // Extraire le rôle
                let role = 'externe';
                const userRoles = profile.user_roles;
                if (Array.isArray(userRoles) && userRoles.length > 0) {
                    role = (userRoles[0] as { role?: string })?.role || 'externe';
                } else if (userRoles && typeof userRoles === 'object' && !Array.isArray(userRoles)) {
                    role = (userRoles as { role?: string }).role || 'externe';
                }

                return {
                    id: profile.id,
                    email: profile.email,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    role,
                };
            });

            // Trier par email
            assignableUsers.sort((a, b) => a.email.localeCompare(b.email));

            setUsers(assignableUsers);
        } catch (err) {
            logger.error('[AssignCompanyUserDialog] Exception', err as Error);
            setError('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger les utilisateurs à l'ouverture
    useEffect(() => {
        if (open) {
            setSelectedUserId(null);
            setSearchTerm('');
            setError(null);
            void loadUsers();
        }
    }, [open, loadUsers]);

    // Filtrer les utilisateurs par recherche
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return searchMatch(user.email, searchTerm) || searchMatch(fullName, searchTerm);
    });

    // Assigner l'utilisateur sélectionné
    const handleAssign = async () => {
        if (!selectedUserId) return;

        setIsAssigning(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/users/${selectedUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'company',
                    company_id: companyId,
                }),
            });

            const result = await response.json() as { success: boolean; error?: string };

            if (!result.success) {
                setError(result.error || 'Erreur lors de l\'assignation');
                return;
            }

            // Succès
            onSuccess();
            onOpenChange(false);
        } catch (err) {
            logger.error('[AssignCompanyUserDialog] Erreur assignation', err as Error);
            setError('Une erreur est survenue');
        } finally {
            setIsAssigning(false);
        }
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Assigner un utilisateur existant</DialogTitle>
                    <DialogDescription>
                        Sélectionnez un utilisateur pour lui donner accès à la compagnie <strong>{companyName}</strong>.
                        Son rôle sera changé en &quot;Compagnie&quot;.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
                    {/* Message d'erreur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par email ou nom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Liste des utilisateurs */}
                    <div className="flex-1 overflow-auto border rounded-md">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <User className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">
                                    {searchTerm 
                                        ? 'Aucun utilisateur trouvé' 
                                        : 'Aucun utilisateur disponible'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Rôle actuel</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const isSelected = selectedUserId === user.id;
                                        return (
                                            <TableRow 
                                                key={user.id}
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    isSelected 
                                                        ? "bg-derviche/10 hover:bg-derviche/15" 
                                                        : "hover:bg-muted/50"
                                                )}
                                                onClick={() => setSelectedUserId(user.id)}
                                            >
                                                <TableCell>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                        isSelected 
                                                            ? "border-derviche bg-derviche" 
                                                            : "border-muted-foreground/30"
                                                    )}>
                                                        {isSelected && (
                                                            <Check className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    {user.first_name || user.last_name
                                                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                                        : <span className="text-muted-foreground">Non renseigné</span>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "text-xs px-2 py-1 rounded-full",
                                                        user.role === 'company' 
                                                            ? "bg-orange-100 text-orange-700" 
                                                            : "bg-muted"
                                                    )}>
                                                        {translateRoleLocal(user.role)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Info sur la sélection */}
                    {selectedUser && (
                        <Alert>
                            <AlertDescription>
                                <strong>{selectedUser.email}</strong> deviendra utilisateur de la compagnie <strong>{companyName}</strong>.
                                {selectedUser.role === 'company' ? (
                                    <> Il sera ré-associé à cette compagnie.</>
                                ) : (
                                    <> Son rôle passera de &quot;{translateRoleLocal(selectedUser.role)}&quot; à &quot;Compagnie&quot;.</>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isAssigning}
                        className="w-full sm:w-auto"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={() => void handleAssign()}
                        disabled={!selectedUserId || isAssigning}
                        className="w-full sm:w-auto bg-derviche hover:bg-derviche-light"
                    >
                        {isAssigning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Assignation...
                            </>
                        ) : (
                            'Assigner'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
