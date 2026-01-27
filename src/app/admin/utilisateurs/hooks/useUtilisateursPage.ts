/**
 * Hook useUtilisateursPage - Logique de la page Admin Utilisateurs
 * Derviche Diffusion
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { searchMatch } from '@/lib/utils';
import { toast } from 'sonner';

import { 
  useManagedUsers,
  type CreateManagedUserData,
  type UpdateManagedUserData,
} from '@/hooks/useManagedUsers';

import type { 
  ManagedUser, 
  InternalRole,
  RoleFilter,
  RoleCounts,
  UserFormData,
  CreateUserFormData,
  UseUtilisateursPageReturn,
} from '../types';

import { canDeleteUser, canToggleUserStatus } from '../helpers';
import { MESSAGES } from '../constants';

// ============================================
// HOOK
// ============================================

export function useUtilisateursPage(): UseUtilisateursPageReturn {
  // Hook Supabase pour les données (internes + company)
  const { 
    users, 
    isLoading, 
    error, 
    refresh, 
    create, 
    update, 
    remove, 
    toggleStatus,
    formatName,
  } = useManagedUsers();

  // ID et rôle de l'utilisateur connecté
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<InternalRole | null>(null);

  // États locaux - Filtres
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // États locaux - Soumission et erreurs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // États des modales
  const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);

  // ============================================
  // EFFETS
  // ============================================

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

  // ============================================
  // DONNÉES CALCULÉES
  // ============================================

  // Indique si des filtres sont actifs
  const hasFilters = useMemo(() => {
    return searchQuery.trim() !== '' || roleFilter !== 'all';
  }, [searchQuery, roleFilter]);

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
  const roleCounts = useMemo<RoleCounts>(() => {
    return {
      'super-admin': users.filter((u) => u.role === 'super-admin').length,
      'admin': users.filter((u) => u.role === 'admin').length,
      'externe': users.filter((u) => u.role === 'externe').length,
      'company': users.filter((u) => u.role === 'company').length,
    };
  }, [users]);

  // ============================================
  // PERMISSIONS (callbacks mémorisés)
  // ============================================

  const checkCanDeleteUser = useCallback((user: ManagedUser): boolean => {
    return canDeleteUser(user, currentUserId);
  }, [currentUserId]);

  const checkCanToggleStatus = useCallback((user: ManagedUser): boolean => {
    return canToggleUserStatus(user, currentUserId, currentUserRole);
  }, [currentUserId, currentUserRole]);

  // ============================================
  // HANDLERS - MODALES
  // ============================================

  const handleCreate = useCallback(() => {
    setEditingUser(null);
    setFormError(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((user: ManagedUser) => {
    setEditingUser(user);
    setFormError(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleView = useCallback((user: ManagedUser) => {
    setViewingUser(user);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewingUser(null);
  }, []);

  const handleDeleteClick = useCallback((user: ManagedUser) => {
    // Empêcher l'auto-suppression
    if (currentUserId && user.id === currentUserId) {
      setDeleteError(MESSAGES.SELF_DELETE_ERROR);
      setUserToDelete(user);
      return;
    }
    setDeleteError(null);
    setUserToDelete(user);
  }, [currentUserId]);

  const handleViewToEdit = useCallback(() => {
    if (viewingUser) {
      const userToEdit = viewingUser;
      setViewingUser(null);
      handleEdit(userToEdit);
    }
  }, [viewingUser, handleEdit]);

  const handleViewToDelete = useCallback(() => {
    if (viewingUser) {
      const userToRemove = viewingUser;
      setViewingUser(null);
      handleDeleteClick(userToRemove);
    }
  }, [viewingUser, handleDeleteClick]);

  const handleFormDialogChange = useCallback((open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setFormError(null);
      setEditingUser(null);
    }
  }, []);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setUserToDelete(null);
      setDeleteError(null);
    }
  }, []);

  // ============================================
  // HANDLERS - CRUD
  // ============================================

  /** Handler pour la création d'un utilisateur */
  const handleCreateUser = useCallback(async (formData: CreateUserFormData) => {
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
      toast.success('Utilisateur créé avec succès');
    } else {
      setFormError(result.error || 'Erreur lors de la création');
      toast.error(result.error || 'Erreur lors de la création');
    }

    setIsSubmitting(false);
  }, [create]);

  /** Handler pour la mise à jour d'un utilisateur */
  const handleFormSubmit = useCallback(async (formData: UserFormData, isEditing: boolean) => {
    // Guard clause - ne devrait jamais arriver en conditions normales
    if (!isEditing || !editingUser) {
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
      toast.success('Utilisateur mis à jour avec succès');
    } else {
      setFormError(result.error || 'Erreur lors de la mise à jour');
      toast.error(result.error || 'Erreur lors de la mise à jour');
    }

    setIsSubmitting(false);
  }, [editingUser, update]);

  /** Handler pour confirmer la suppression */
  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete) return;

    // Double vérification pour empêcher l'auto-suppression
    if (currentUserId && userToDelete.id === currentUserId) {
      setDeleteError(MESSAGES.SELF_DELETE_ERROR);
      return;
    }

    setIsSubmitting(true);
    setDeleteError(null);
    
    const result = await remove(userToDelete.id);
    setIsSubmitting(false);

    if (result.success) {
      setUserToDelete(null);
      toast.success('Utilisateur supprimé avec succès');
    } else {
      setDeleteError(result.error || 'Erreur lors de la suppression');
      toast.error(result.error || 'Erreur lors de la suppression');
    }
  }, [userToDelete, currentUserId, remove]);

  /** Handler pour activer/désactiver un utilisateur */
  const handleToggleStatus = useCallback(async (user: ManagedUser) => {
    if (!checkCanToggleStatus(user)) return;
    
    setIsSubmitting(true);
    const newDisabledState = user.disabled_at === null;
    const result = await toggleStatus(user.id, newDisabledState);
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success(newDisabledState 
        ? 'Utilisateur désactivé' 
        : 'Utilisateur réactivé'
      );
    } else {
      toast.error(result.error || 'Erreur lors du changement de statut');
    }
  }, [checkCanToggleStatus, toggleStatus]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    // Données
    users,
    filteredUsers,
    roleCounts,
    isLoading,
    error,
    
    // Utilisateur courant
    currentUserId,
    currentUserRole,
    
    // Filtres
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    hasFilters,
    
    // États
    isSubmitting,
    formError,
    deleteError,
    
    // Modales
    isFormDialogOpen,
    editingUser,
    userToDelete,
    viewingUser,
    
    // Handlers
    refresh,
    handleCreate,
    handleEdit,
    handleView,
    handleCloseView,
    handleDeleteClick,
    handleConfirmDelete,
    handleViewToEdit,
    handleViewToDelete,
    handleFormDialogChange,
    handleDeleteDialogChange,
    handleCreateUser,
    handleFormSubmit,
    handleToggleStatus,
    
    // Permissions
    canDeleteUser: checkCanDeleteUser,
    canToggleStatus: checkCanToggleStatus,
    
    // Formatage (du hook)
    formatName,
  };
}
