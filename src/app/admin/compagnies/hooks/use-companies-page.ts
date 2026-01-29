/**
 * Hook principal pour la page admin/compagnies
 * Centralise tous les états et handlers
 * Session 107 - Refactorisation + Corrections audit
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchMatch } from '@/lib/utils';
import { getCompanyUser } from '@/lib/services/internal-users';
import { useCompanies } from '@/hooks/useCompanies';
import type { CompanyInsert } from '@/types/database';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from '@/components/admin/compagnies';
import type { UseCompaniesPageReturn, CompanyHandlers, CompanyUserHandlers, ApiResponse } from '../types';

export function useCompaniesPage(): UseCompaniesPageReturn {
  const router = useRouter();

  // Hook Supabase pour les données
  const {
    companies,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    checkUsage,
    setCompanyHasUser,
  } = useCompanies();

  // ============================================================================
  // États locaux
  // ============================================================================

  // Recherche
  const [searchQuery, setSearchQuery] = useState('');

  // États de chargement
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Ref pour éviter les race conditions lors de la vérification d'usage
  const pendingDeleteCheckRef = useRef<string | null>(null);

  // États des dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithShowsCount | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyWithShowsCount | null>(null);
  const [viewingCompany, setViewingCompany] = useState<CompanyWithShowsCount | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // États utilisateur compagnie
  const [companyUser, setCompanyUser] = useState<ManagedUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isProcessingUser, setIsProcessingUser] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);

  // ============================================================================
  // Refs pour stabilité des callbacks
  // ============================================================================

  const viewingCompanyRef = useRef(viewingCompany);
  viewingCompanyRef.current = viewingCompany;

  const companyUserRef = useRef(companyUser);
  companyUserRef.current = companyUser;

  // Refs pour editingCompany et companyToDelete (correction audit #3)
  const editingCompanyRef = useRef(editingCompany);
  editingCompanyRef.current = editingCompany;

  const companyToDeleteRef = useRef(companyToDelete);
  companyToDeleteRef.current = companyToDelete;

  const deleteWarningRef = useRef(deleteWarning);
  deleteWarningRef.current = deleteWarning;

  // ============================================================================
  // Effets
  // ============================================================================

  // Charger l'utilisateur lié quand on visualise une compagnie
  const loadCompanyUser = useCallback(async (companyId: string) => {
    setIsLoadingUser(true);
    setCompanyUser(null);

    const result = await getCompanyUser(companyId);

    setCompanyUser(result.data);
    setIsLoadingUser(false);
  }, []);

  // Effet pour charger l'utilisateur quand viewingCompany change
  useEffect(() => {
    if (viewingCompany) {
      void loadCompanyUser(viewingCompany.id);
    } else {
      setCompanyUser(null);
    }
  }, [viewingCompany, loadCompanyUser]);

  // ============================================================================
  // Données filtrées
  // ============================================================================

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) {
      return companies;
    }
    const query = searchQuery.trim();
    return companies.filter(
      (company) =>
        searchMatch(company.name, query) ||
        searchMatch(company.city || '', query) ||
        searchMatch(company.contact_name || '', query)
    );
  }, [searchQuery, companies]);

  // ============================================================================
  // Handlers CRUD
  // ============================================================================

  const handleCreate = useCallback(() => {
    setEditingCompany(null);
    setFormError(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((company: CompanyWithShowsCount) => {
    setEditingCompany(company);
    setFormError(null);
    setIsFormDialogOpen(true);
  }, []);

  const handleView = useCallback((company: CompanyWithShowsCount) => {
    setViewingCompany(company);
  }, []);

  const handleDeleteClick = useCallback(
    async (company: CompanyWithShowsCount) => {
      const companyId = company.id;
      pendingDeleteCheckRef.current = companyId;

      setIsCheckingUsage(true);
      setCompanyToDelete(company);
      setDeleteWarning(null);

      const { used, count } = await checkUsage(companyId);

      // Protection contre les race conditions
      if (pendingDeleteCheckRef.current === companyId) {
        if (used) {
          setDeleteWarning(
            `Cette compagnie est associée à ${count} spectacle(s). Supprimez d'abord les spectacles associés.`
          );
        }
        setIsCheckingUsage(false);
      }
    },
    [checkUsage]
  );

  const handleViewShows = useCallback(
    (companyName: string) => {
      router.push(`/admin/spectacles?search=${encodeURIComponent(companyName)}`);
    },
    [router]
  );

  // Utilise ref pour stabilité (correction audit #3)
  const handleConfirmDelete = useCallback(async () => {
    const current = companyToDeleteRef.current;
    const warning = deleteWarningRef.current;

    if (current && !warning) {
      setIsSubmitting(true);
      const result = await remove(current.id);
      setIsSubmitting(false);

      if (result.success) {
        setCompanyToDelete(null);
      } else {
        console.error('Erreur suppression:', result.error);
      }
    }
  }, [remove]);

  // ============================================================================
  // Handlers formulaire
  // ============================================================================

  const handleFormDialogChange = useCallback((open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setFormError(null);
      setEditingCompany(null);
    }
  }, []);

  // Utilise ref pour stabilité (correction audit #3)
  const handleFormSubmit = useCallback(
    async (formData: CompanyFormData, isEditing: boolean) => {
      setIsSubmitting(true);
      setFormError(null);

      const currentEditing = editingCompanyRef.current;

      if (isEditing && currentEditing) {
        const result = await update(currentEditing.id, formData);
        if (result.success) {
          setIsFormDialogOpen(false);
          setEditingCompany(null);
        } else {
          setFormError(result.error || 'Erreur lors de la mise à jour');
        }
      } else {
        const result = await create(formData as CompanyInsert);
        if (result.success) {
          setIsFormDialogOpen(false);
        } else {
          setFormError(result.error || 'Erreur lors de la création');
        }
      }

      setIsSubmitting(false);
    },
    [update, create]
  );

  // ============================================================================
  // Handlers view dialog
  // ============================================================================

  const handleViewToEdit = useCallback(() => {
    const current = viewingCompanyRef.current;
    if (current) {
      setViewingCompany(null);
      // Petit délai pour éviter les conflits de dialog
      setTimeout(() => {
        setEditingCompany(current);
        setFormError(null);
        setIsFormDialogOpen(true);
      }, 100);
    }
  }, []);

  const handleViewToDelete = useCallback(async () => {
    const current = viewingCompanyRef.current;
    if (current) {
      setViewingCompany(null);
      await handleDeleteClick(current);
    }
  }, [handleDeleteClick]);

  const closeViewDialog = useCallback(() => {
    setViewingCompany(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setCompanyToDelete(null);
    setDeleteWarning(null);
  }, []);

  // ============================================================================
  // Handlers utilisateur compagnie
  // ============================================================================

  const handleCreateUser = useCallback(() => {
    setIsCreateUserDialogOpen(true);
  }, []);

  const handleAssignUser = useCallback(() => {
    setIsAssignUserDialogOpen(true);
  }, []);

  const handleUserCreated = useCallback(() => {
    const current = viewingCompanyRef.current;
    if (current) {
      void loadCompanyUser(current.id);
      setCompanyHasUser(current.id, true);
    }
  }, [loadCompanyUser, setCompanyHasUser]);

  /**
   * Fonction utilitaire factorisée pour dissocier un utilisateur d'une compagnie
   * (correction audit #1 - factorisation handleChangeUser/handleUnlinkUser)
   */
  const unlinkCompanyUser = useCallback(
    async (userId: string, companyId: string, openAssignDialog: boolean): Promise<boolean> => {
      setIsProcessingUser(true);

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: null }),
        });

        // Validation HTTP (correction audit #4)
        if (!response.ok) {
          console.error('HTTP Error:', response.status);
          return false;
        }

        const result = (await response.json()) as ApiResponse;

        if (!result.success) {
          console.error('Erreur lors de la dissociation:', result.error);
          return false;
        }

        setCompanyUser(null);
        setCompanyHasUser(companyId, false);

        if (openAssignDialog) {
          setIsAssignUserDialogOpen(true);
        }

        return true;
      } catch (error) {
        console.error('Erreur lors de la dissociation:', error);
        return false;
      } finally {
        setIsProcessingUser(false);
      }
    },
    [setCompanyHasUser]
  );

  const handleChangeUser = useCallback(async () => {
    const currentUser = companyUserRef.current;
    const currentCompany = viewingCompanyRef.current;

    if (!currentUser || !currentCompany) return;

    await unlinkCompanyUser(currentUser.id, currentCompany.id, true);
  }, [unlinkCompanyUser]);

  const handleUnlinkUser = useCallback(async () => {
    const currentUser = companyUserRef.current;
    const currentCompany = viewingCompanyRef.current;

    if (!currentUser || !currentCompany) return;

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir retirer l'accès de ${currentUser.email} à cette compagnie ?`
      )
    ) {
      return;
    }

    await unlinkCompanyUser(currentUser.id, currentCompany.id, false);
  }, [unlinkCompanyUser]);

  // ============================================================================
  // Objets de retour groupés
  // ============================================================================

  const handlers: CompanyHandlers = useMemo(
    () => ({
      onCreate: handleCreate,
      onEdit: handleEdit,
      onView: handleView,
      onDelete: handleDeleteClick,
      onViewShows: handleViewShows,
    }),
    [handleCreate, handleEdit, handleView, handleDeleteClick, handleViewShows]
  );

  const userHandlers: CompanyUserHandlers = useMemo(
    () => ({
      onCreateUser: handleCreateUser,
      onAssignUser: handleAssignUser,
      onChangeUser: handleChangeUser,
      onUnlinkUser: handleUnlinkUser,
    }),
    [handleCreateUser, handleAssignUser, handleChangeUser, handleUnlinkUser]
  );

  // ============================================================================
  // Retour
  // ============================================================================

  return {
    // Données
    filteredCompanies,
    totalCount: companies.length,
    companyUser,

    // États de chargement
    isLoading,
    error,
    formError,
    loadingStates: {
      isSubmitting,
      isCheckingUsage,
      isLoadingUser,
      isProcessingUser,
    },

    // États des dialogs
    dialogStates: {
      isFormDialogOpen,
      editingCompany,
      companyToDelete,
      viewingCompany,
      deleteWarning,
      isCreateUserDialogOpen,
      isAssignUserDialogOpen,
    },

    // Recherche
    searchQuery,
    setSearchQuery,

    // Handlers
    handlers,
    userHandlers,

    // Handlers formulaire
    handleFormDialogChange,
    handleFormSubmit,
    handleConfirmDelete,

    // Handlers view dialog
    handleViewToEdit,
    handleViewToDelete,
    closeViewDialog,

    // Handlers dialog setters
    closeDeleteDialog,
    setIsCreateUserDialogOpen,
    setIsAssignUserDialogOpen,

    // Callback après création/assignation utilisateur
    handleUserCreated,

    // Refresh
    refresh,
  };
}
