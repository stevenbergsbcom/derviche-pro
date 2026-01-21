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
import { Pencil, Trash2, Eye, Shield, AlertCircle, RefreshCw, Users, Power, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { searchMatch } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { InternalRole } from '@/types/database';

// Hook Supabase pour les utilisateurs gérés (internes + company)
import { 
    useManagedUsers, 
    type ManagedUser, 
    type ManagedRole,
    type CreateManagedUserData,
    type UpdateManagedUserData,
} from '@/hooks/useManagedUsers';

// Tooltip pour les boutons désactivés
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
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

/** Tous les rôles gérés pour le filtre */
const ALL_ROLES: Array<ManagedRole | 'all'> = ['all', 'super-admin', 'admin', 'externe', 'company'];

/** Labels des rôles pour le filtre */
const ROLE_LABELS: Record<ManagedRole | 'all', string> = {
    'all': 'Tous les rôles',
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'externe': 'Externe',
    'company': 'Compagnie',
};

// ============================================
// HELPERS
// ============================================

/**
 * Retourne la couleur du badge selon le rôle
 */
function getRoleBadgeClass(role: ManagedRole): string {
    switch (role) {
        case 'super-admin':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'admin':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'externe':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'company':
            return 'bg-teal-100 text-teal-800 border-teal-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

/**
 * Formate le nom complet ou retourne l'email
 */
function formatDisplayName(user: ManagedUser): string {
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
function translateRoleLabel(role: ManagedRole): string {
    return ROLE_LABELS[role] || role;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AdminUtilisateursPage() {
    // Hook Supabase pour les données (internes + company)
    const { users, isLoading, error, refresh, create, update, remove, toggleStatus } = useManagedUsers();

    // ID et rôle de l'utilisateur connecté
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<InternalRole | null>(null);

    // États locaux
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<ManagedRole | 'all'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // États des modales
    const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
    const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);

    // Récupérer l'utilisateur connecté et son rôle au montage
    useEffect(() => {
        const fetchCurrentUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                
                // Récupérer tous les rôles de l'utilisateur (peut en avoir plusieurs)
                const { data: rolesData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id);
                
                if (rolesData && rolesData.length > 0) {
                    // Priorité des rôles internes (du plus privilégié au moins privilégié)
                    const rolePriority: InternalRole[] = ['super-admin', 'admin', 'externe'];
                    const userRoles = rolesData.map(r => r.role);
                    
                    // Trouver le rôle interne avec la plus haute priorité
                    for (const role of rolePriority) {
                        if (userRoles.includes(role)) {
                            setCurrentUserRole(role);
                            break;
                        }
                    }
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

        // Filtre par recherche (nom, prénom, email, nom compagnie)
        if (searchQuery.trim()) {
            const query = searchQuery.trim();
            result = result.filter(
                (user) =>
                    searchMatch(user.email, query) ||
                    searchMatch(user.first_name || '', query) ||
                    searchMatch(user.last_name || '', query) ||
                    searchMatch(user.company_name || '', query)
            );
        }

        return result;
    }, [searchQuery, roleFilter, users]);

    // Compteurs par rôle
    const roleCounts = useMemo(() => {
        return {
            'super-admin': users.filter((u) => u.role === 'super-admin').length,
            'admin': users.filter((u) => u.role === 'admin').length,
            'externe': users.filter((u) => u.role === 'externe').length,
            'company': users.filter((u) => u.role === 'company').length,
        };
    }, [users]);

    // === HANDLERS ===

    const handleCreate = () => {
        setEditingUser(null);
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (user: ManagedUser) => {
        setEditingUser(user);
        setFormError(null);
        setIsFormDialogOpen(true);
    };

    const handleView = (user: ManagedUser) => {
        setViewingUser(user);
    };

    const handleDeleteClick = (user: ManagedUser) => {
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

        const createData: CreateManagedUserData = {
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name || undefined,
            last_name: formData.last_name || undefined,
            phone: formData.phone || undefined,
            role: formData.role,
            must_change_password: formData.must_change_password,
            company_id: formData.company_id,
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
        // Guard clause - ne devrait jamais arriver en conditions normales
        if (!isEditing || !editingUser) {
            // Reset par sécurité en cas de race condition
            setIsSubmitting(false);
            setFormError('Erreur: utilisateur introuvable. Veuillez réessayer.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        // Préparer les données pour l'update
        const updateData: UpdateManagedUserData = {
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            phone: formData.phone || null,
        };

        // Ajouter le rôle seulement s'il a changé (et pas pour les utilisateurs company)
        if (formData.role !== editingUser.role && editingUser.role !== 'company') {
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
    const canDeleteUser = (user: ManagedUser): boolean => {
        return currentUserId !== user.id;
    };

    /**
     * Vérifie si l'utilisateur courant peut activer/désactiver un compte
     * Seuls les Super Admins peuvent faire ça
     * On ne peut pas désactiver un Super Admin (mais on peut le réactiver s'il était désactivé)
     */
    const canToggleStatus = (user: ManagedUser): boolean => {
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
    const handleToggleStatus = async (user: ManagedUser) => {
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
        <TooltipProvider>
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
                    {roleCounts['externe']} Externe
                </Badge>
                <Badge variant="outline" className="bg-teal-50">
                    <Building2 className="w-3 h-3 mr-1" />
                    {roleCounts['company']} Compagnie
                </Badge>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Rechercher par nom, email ou compagnie..."
                    />
                </div>
                <Select
                    value={roleFilter}
                    onValueChange={(value) => setRoleFilter(value as ManagedRole | 'all')}
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
            <div className="hidden lg:block rounded-md border bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Compagnie</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                                                {user.role === 'company' ? (
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <Shield className="w-3 h-3 mr-1" />
                                                )}
                                                {translateRoleLabel(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.company_name ? (
                                                <span className="text-sm">{user.company_name}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
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
                                            {user.company_name && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    <Building2 className="w-3 h-3 inline mr-1" />
                                                    {user.company_name}
                                                </p>
                                            )}
                                        </div>
                                        <Badge className={getRoleBadgeClass(user.role)}>
                                            {user.role === 'company' ? (
                                                <Building2 className="w-3 h-3 mr-1" />
                                            ) : (
                                                <Shield className="w-3 h-3 mr-1" />
                                            )}
                                            {translateRoleLabel(user.role)}
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
                                        {currentUserRole === 'super-admin' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="flex-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`w-full ${isDisabled ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`}
                                                            onClick={() => void handleToggleStatus(user)}
                                                            disabled={!canToggleStatus(user) || isSubmitting}
                                                        >
                                                            <Power className="w-4 h-4 mr-2" />
                                                            {isDisabled ? 'Activer' : 'Désactiver'}
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
        </TooltipProvider>
    );
}
