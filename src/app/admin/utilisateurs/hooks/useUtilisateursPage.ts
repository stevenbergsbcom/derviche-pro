/**
 * Hook useUtilisateursPage - Logique de la page Admin Utilisateurs
 * Derviche Diffusion
 * S158 - Ajout tri alphabétique par nom
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { searchMatch } from '@/lib/utils';
import { toast } from 'sonner';
import type { SortDirection } from '@/components/admin';

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

export function useUtilisateursPage(): UseUtilisateursPageReturn {
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<InternalRole | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // Tri
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // États
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modales
  const [isFormDialogOpen, setIsFormDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);

  // ============================================
  // EFFETS
  // ============================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (rolesData && rolesData.length > 0) {
          const rolePriority: InternalRole[] = ['super-admin', 'admin', 'externe'];
          const userRoles = rolesData.map(r => r.role);
          
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

  const hasFilters = useMemo(() => {
    return searchQuery.trim() !== '' || roleFilter !== 'all';
  }, [searchQuery, roleFilter]);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

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

    // Tri alphabétique par nom de famille, puis prénom
    return [...result].sort((a, b) => {
      const lastA = (a.last_name ?? '').toLowerCase();
      const lastB = (b.last_name ?? '').toLowerCase();
      const firstA = (a.first_name ?? '').toLowerCase();
      const firstB = (b.first_name ?? '').toLowerCase();
      const cmp = lastA.localeCompare(lastB, 'fr') || firstA.localeCompare(firstB, 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searchQuery, roleFilter, users, sortDir]);

  const roleCounts = useMemo<RoleCounts>(() => ({
    'super-admin': users.filter((u) => u.role === 'super-admin').length,
    'admin': users.filter((u) => u.role === 'admin').length,
    'externe': users.filter((u) => u.role === 'externe').length,
    'company': users.filter((u) => u.role === 'company').length,
  }), [users]);

  // ============================================
  // PERMISSIONS
  // ============================================

  const checkCanDeleteUser = useCallback((user: ManagedUser): boolean => {
    return canDeleteUser(user, currentUserId);
  }, [currentUserId]);

  const checkCanToggleStatus = useCallback((user: ManagedUser): boolean => {
    return canToggleUserStatus(user, currentUserId, currentUserRole);
  }, [currentUserId, currentUserRole]);

  // ============================================
  // HANDLERS
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

  const handleView = useCallback((user: ManagedUser) => { setViewingUser(user); }, []);
  const handleCloseView = useCallback(() => { setViewingUser(null); }, []);

  const handleDeleteClick = useCallback((user: ManagedUser) => {
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
    if (!open) { setFormError(null); setEditingUser(null); }
  }, []);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) { setUserToDelete(null); setDeleteError(null); }
  }, []);

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

  const handleFormSubmit = useCallback(async (formData: UserFormData, isEditing: boolean) => {
    if (!isEditing || !editingUser) {
      setIsSubmitting(false);
      setFormError('Erreur: utilisateur introuvable. Veuillez réessayer.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const updateData: UpdateManagedUserData = {
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      phone: formData.phone || null,
    };

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

  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete) return;

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

  const handleToggleStatus = useCallback(async (user: ManagedUser) => {
    if (!checkCanToggleStatus(user)) return;
    
    setIsSubmitting(true);
    const newDisabledState = user.disabled_at === null;
    const result = await toggleStatus(user.id, newDisabledState);
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success(newDisabledState ? 'Utilisateur désactivé' : 'Utilisateur réactivé');
    } else {
      toast.error(result.error || 'Erreur lors du changement de statut');
    }
  }, [checkCanToggleStatus, toggleStatus]);

  // ============================================
  // RETOUR
  // ============================================

  return {
    users,
    filteredUsers,
    roleCounts,
    isLoading,
    error,
    currentUserId,
    currentUserRole,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    hasFilters,
    // Tri
    sortDir,
    toggleSortDir,
    isSubmitting,
    formError,
    deleteError,
    isFormDialogOpen,
    editingUser,
    userToDelete,
    viewingUser,
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
    canDeleteUser: checkCanDeleteUser,
    canToggleStatus: checkCanToggleStatus,
    formatName,
  };
}
