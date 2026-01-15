'use client';

import { useState, useMemo, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Eye, Shield, AlertCircle, RefreshCw, Users, Power } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { searchMatch } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { InternalUser, InternalRole } from '@/types/database';

// Hook Supabase
import { useInternalUsers, type UpdateUserData, type CreateUserData } from '@/hooks/useInternalUsers';

// Tooltip pour les boutons désactivés
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// Composants admin réutilisables
import {
    AdminPageHeader,
    SearchInput,
    DeleteConfirmDialog,
} from '@/components/admin';

// Composants spécifiques aux utilisateurs
import {
    UserViewDialog,
    UserFormDialog,
    type UserFormData,
    type CreateUserFormData,
} from '@/components/admin/utilisateurs';

// ============================================
// CONSTANTES
// ============================================

/** Tous les rôles internes pour le filtre */
const ALL_ROLES: Array<InternalRole | 'all'> = ['all', 'super-admin', 'admin', 'externe-dd'];

/** Labels des rôles pour le filtre */
const ROLE_LABELS: Record<InternalRole | 'all', string> = {
    'all': 'Tous les rôles',
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'externe-dd': 'Externe DD',
};

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
 * Formate le nom complet ou retourne l'email
 */
function formatDisplayName(user: InternalUser): string {
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email;
}

/**
 * Traduit un rôle en français
 */
function translateRole(role: InternalRole): string {
    return ROLE_LABELS[role] || role;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AdminUtilisateursPage() {
    // Hook Supabase pour les données
    const { users, isLoading, error, refresh, create, update, remove, toggleStatus } = useInternalUsers();

    // ID et rôle de l'utilisateur connecté
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<InternalRole | null>(null);

    // États locaux
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<InternalRole | 'all'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<InternalUser | null>(null);
    const [viewingUser, setViewingUser] = useState<InternalUser | null>(null);

    // Récupérer l'utilisateur connecté et son rôle au montage
    useEffect(() => {
        const fetchCurrentUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                
                // Récupérer le rôle de l'utilisateur
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();
                
                if (roleData && (roleData.role === 'super-admin' || roleData.role === 'admin' || roleData.role === 'externe-dd')) {
                    setCurrentUserRole(roleData.role as InternalRole);
                }
            }
        };
        void fetchCurrentUser();
    }, []);

    // Filtrer les utilisateurs selon la recherche et le rôle
    const filteredUsers = useMemo(() => {
        let result = users;

        // Filtre par rôle
        if (roleFilter !== 'all') {
            result = result.filter((user) => user.role === roleFilter);
        }

        // Filtre par recherche (nom, prénom, email)
        if (searchQuery.trim()) {
            const query = searchQuery.trim();
            result = result.filter(
                (user) =>
                    searchMatch(user.email, query) ||
                    searchMatch(user.first_name || '', query) ||
                    searchMatch(user.last_name || '', query)
            );
        }

        return result;
    }, [searchQuery, roleFilter, users]);

    // Compteurs par rôle
    const roleCounts = useMemo(() => {
        return {
            'super-admin': users.filter((u) => u.role === 'super-admin').length,
            'admin': users.filter((u) => u.role === 'admin').length,
            'externe-dd': users.filter((u) => u.role === 'externe-dd').length,
        };
    }, [users]);

    // === HANDLERS ===

    const handleCreate = () => {
        setEditingUser(null);
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (user: InternalUser) => {
        setEditingUser(user);
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleView = (user: InternalUser) => {
        setViewingUser(user);
    };

    const handleDeleteClick = (user: InternalUser) => {
        // Empêcher l'auto-suppression
        if (currentUserId && user.id === currentUserId) {
            setDeleteError('Vous ne pouvez pas supprimer votre propre compte.');
            setUserToDelete(user);
            return;
        }
        setDeleteError(null);
        setUserToDelete(user);
    };

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            // Double vérification pour empêcher l'auto-suppression
            if (currentUserId && userToDelete.id === currentUserId) {
                setDeleteError('Vous ne pouvez pas supprimer votre propre compte.');
                return;
            }

            setIsSubmitting(true);
            setDeleteError(null);
            
            const result = await remove(userToDelete.id);
            setIsSubmitting(false);

            if (result.success) {
                setUserToDelete(null);
            } else {
                setDeleteError(result.error || 'Erreur lors de la suppression');
            }
        }
    };

    const handleViewToEdit = () => {
        if (viewingUser) {
            const userToEdit = viewingUser;
            setViewingUser(null);
            handleEdit(userToEdit);
        }
    };

    const handleViewToDelete = () => {
        if (viewingUser) {
            const userToRemove = viewingUser;
            setViewingUser(null);
            handleDeleteClick(userToRemove);
        }
    };

    const handleFormDialogChange = (open: boolean) => {
        setIsFormDialogOpen(open);
        if (!open) {
            setFormError(null);
            setEditingUser(null);
        }
    };

    const handleDeleteDialogChange = (open: boolean) => {
        if (!open) {
            setUserToDelete(null);
            setDeleteError(null);
        }
    };

    /** Handler pour la création d'un utilisateur */
    const handleCreateUser = async (formData: CreateUserFormData) => {
        setIsSubmitting(true);
        setFormError(null);

        const createData: CreateUserData = {
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name || undefined,
            last_name: formData.last_name || undefined,
            phone: formData.phone || undefined,
            role: formData.role,
            must_change_password: formData.must_change_password,
        };

        const result = await create(createData);

        if (result.success) {
            setIsFormDialogOpen(false);
            setEditingUser(null);
        } else {
            setFormError(result.error || 'Erreur lors de la création');
        }

        setIsSubmitting(false);
    };

    /** Handler pour la mise à jour d'un utilisateur */
    const handleFormSubmit = async (formData: UserFormData, isEditing: boolean) => {
        if (!isEditing || !editingUser) {
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        // Préparer les données pour l'update
        const updateData: UpdateUserData = {
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            phone: formData.phone || null,
        };

        // Ajouter le rôle seulement s'il a changé
        if (formData.role !== editingUser.role) {
            updateData.role = formData.role;
        }

        const result = await update(editingUser.id, updateData);

        if (result.success) {
            setIsFormDialogOpen(false);
            setEditingUser(null);
        } else {
            setFormError(result.error || 'Erreur lors de la mise à jour');
        }

        setIsSubmitting(false);
    };

    /**
     * Vérifie si un utilisateur peut être supprimé
     */
    const canDeleteUser = (user: InternalUser): boolean => {
        return currentUserId !== user.id;
    };

    /**
     * Vérifie si l'utilisateur courant peut activer/désactiver un compte
     * Seuls les Super Admins peuvent faire ça
     * On ne peut pas désactiver un Super Admin (mais on peut le réactiver s'il était désactivé)
     */
    const canToggleStatus = (user: InternalUser): boolean => {
        // Seul un Super Admin peut toggle
        if (currentUserRole !== 'super-admin') return false;
        // On ne peut pas se toggle soi-même
        if (currentUserId === user.id) return false;
        // On ne peut pas DÉSACTIVER un Super Admin (mais on peut le réactiver)
        if (user.role === 'super-admin' && user.disabled_at === null) return false;
        return true;
    };

    /**
     * Handler pour activer/désactiver un utilisateur
     */
    const handleToggleStatus = async (user: InternalUser) => {
        if (!canToggleStatus(user)) return;
        
        setIsSubmitting(true);
        const newDisabledState = user.disabled_at === null;
        const result = await toggleStatus(user.id, newDisabledState);
        setIsSubmitting(false);
        
        if (!result.success) {
            // TODO: Afficher un toast d'erreur
            console.error('Erreur toggle status:', result.error);
        }
    };

    // État de chargement initial
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Chargement des utilisateurs...</span>
                </div>
            </div>
        );
    }

    // Erreur de chargement
    if (error) {
        return (
            <div className="space-y-6">
                <AdminPageHeader
                    title="Gestion des Utilisateurs"
                    actionLabel="Ajouter un utilisateur"
                    onAction={handleCreate}
                />
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Erreur lors du chargement des utilisateurs : {error}
                        <Button variant="link" onClick={() => void refresh()} className="ml-2">
                            Réessayer
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <AdminPageHeader
                title="Gestion des Utilisateurs"
                actionLabel="Ajouter un utilisateur"
                onAction={handleCreate}
            />

            {/* Résumé par rôle */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-purple-50">
                    <Shield className="w-3 h-3 mr-1" />
                    {roleCounts['super-admin']} Super Admin
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                    <Shield className="w-3 h-3 mr-1" />
                    {roleCounts['admin']} Admin
                </Badge>
                <Badge variant="outline" className="bg-amber-50">
                    <Users className="w-3 h-3 mr-1" />
                    {roleCounts['externe-dd']} Externe DD
                </Badge>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Rechercher par nom ou email..."
                    />
                </div>
                <Select
                    value={roleFilter}
                    onValueChange={(value) => setRoleFilter(value as InternalRole | 'all')}
                >
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrer par rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        {ALL_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                                {ROLE_LABELS[role]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Compteur */}
            <p className="text-sm text-muted-foreground">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                {(searchQuery || roleFilter !== 'all') && ` (sur ${users.length} au total)`}
            </p>

            {/* Tableau desktop */}
            <div className="hidden lg:block rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    {searchQuery || roleFilter !== 'all'
                                        ? 'Aucun utilisateur trouvé'
                                        : 'Aucun utilisateur enregistré'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => {
                                const isCurrentUser = currentUserId === user.id;
                                const isDisabled = user.disabled_at !== null;
                                return (
                                    <TableRow key={user.id} className={isDisabled ? 'opacity-60' : ''}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleView(user)}
                                                    className="cursor-pointer hover:text-derviche hover:underline text-left"
                                                >
                                                    {formatDisplayName(user)}
                                                </button>
                                                {isCurrentUser && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        Vous
                                                    </Badge>
                                                )}
                                                {isDisabled && (
                                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                        Inactif
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadgeClass(user.role)}>
                                                <Shield className="w-3 h-3 mr-1" />
                                                {translateRole(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleView(user)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="sr-only">Voir</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    <span className="sr-only">Modifier</span>
                                                </Button>
                                                {/* Bouton Toggle Status - visible uniquement pour Super Admin */}
                                                {currentUserRole === 'super-admin' && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={`h-8 w-8 ${isDisabled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`}
                                                                    onClick={() => void handleToggleStatus(user)}
                                                                    disabled={!canToggleStatus(user) || isSubmitting}
                                                                >
                                                                    <Power className="w-4 h-4" />
                                                                    <span className="sr-only">{isDisabled ? 'Activer' : 'Désactiver'}</span>
                                                                </Button>
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {!canToggleStatus(user) 
                                                                ? (user.role === 'super-admin' 
                                                                    ? 'Les Super Admins ne peuvent pas être désactivés' 
                                                                    : 'Action non autorisée')
                                                                : isDisabled 
                                                                    ? 'Activer ce compte' 
                                                                    : 'Désactiver ce compte'
                                                            }
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {canDeleteUser(user) ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteClick(user)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span className="sr-only">Supprimer</span>
                                                    </Button>
                                                ) : (
                                                    <span title="Vous ne pouvez pas supprimer votre propre compte">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive/50 cursor-not-allowed"
                                                            disabled
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="sr-only">Supprimer</span>
                                                        </Button>
                                                    </span>
                                                )}
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
                {filteredUsers.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {searchQuery || roleFilter !== 'all'
                                ? 'Aucun utilisateur trouvé'
                                : 'Aucun utilisateur enregistré'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredUsers.map((user) => {
                        const isCurrentUser = currentUserId === user.id;
                        const isDisabled = user.disabled_at !== null;
                        return (
                            <Card key={user.id} className={isDisabled ? 'opacity-60' : ''}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3
                                                    className="font-semibold cursor-pointer hover:text-derviche hover:underline"
                                                    onClick={() => handleView(user)}
                                                >
                                                    {formatDisplayName(user)}
                                                </h3>
                                                {isCurrentUser && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        Vous
                                                    </Badge>
                                                )}
                                                {isDisabled && (
                                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                        Inactif
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <Badge className={getRoleBadgeClass(user.role)}>
                                            <Shield className="w-3 h-3 mr-1" />
                                            {translateRole(user.role)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleView(user)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Voir
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleEdit(user)}
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Button>
                                        {/* Bouton Toggle Status - visible uniquement pour Super Admin */}
                                        {currentUserRole === 'super-admin' && canToggleStatus(user) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`flex-1 ${isDisabled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`}
                                                onClick={() => void handleToggleStatus(user)}
                                                disabled={isSubmitting}
                                            >
                                                <Power className="w-4 h-4 mr-2" />
                                                {isDisabled ? 'Activer' : 'Désactiver'}
                                            </Button>
                                        )}
                                        {canDeleteUser(user) ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(user)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Supprimer
                                            </Button>
                                        ) : (
                                            <span className="flex-1" title="Vous ne pouvez pas supprimer votre propre compte">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-destructive/50 cursor-not-allowed"
                                                    disabled
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Supprimer
                                                </Button>
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* === MODALES === */}

            <UserFormDialog
                open={isFormDialogOpen}
                onOpenChange={handleFormDialogChange}
                editingUser={editingUser}
                onSubmit={handleFormSubmit}
                onCreate={handleCreateUser}
                isSubmitting={isSubmitting}
                error={formError}
            />

            <UserViewDialog
                user={viewingUser}
                onClose={() => setViewingUser(null)}
                onEdit={handleViewToEdit}
                onDelete={handleViewToDelete}
                canDelete={viewingUser ? canDeleteUser(viewingUser) : true}
            />

            <DeleteConfirmDialog
                open={!!userToDelete}
                onOpenChange={handleDeleteDialogChange}
                onConfirm={() => void handleConfirmDelete()}
                title="Supprimer cet utilisateur ?"
                description={`Êtes-vous sûr de vouloir supprimer le compte de « ${userToDelete ? formatDisplayName(userToDelete) : ''} » (${userToDelete?.email}) ? Cette action est irréversible.`}
                confirmText="Supprimer"
                isSubmitting={isSubmitting}
                error={deleteError}
                confirmDisabled={userToDelete ? !canDeleteUser(userToDelete) : false}
            />
        </div>
    );
}
