/**
 * Hook principal pour la page admin/compagnies
 * Centralise tous les états et handlers
 * Session 107 - Refactorisation + Corrections audit
 * S158 - Ajout tri alphabétique + nb spectacles
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchMatch } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getCompanyUser } from '@/lib/services/internal-users';
import { useCompanies } from '@/hooks/useCompanies';
import { toast } from 'sonner';
import type { CompanyInsert } from '@/types/database';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from '@/components/admin/compagnies';
import type { SortDirection } from '@/components/admin';
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

  // Tri
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

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

  const editingCompanyRef = useRef(editingCompany);
  editingCompanyRef.current = editingCompany;

  const companyToDeleteRef = useRef(companyToDelete);
  companyToDeleteRef.current = companyToDelete;

  const deleteWarningRef = useRef(deleteWarning);
  deleteWarningRef.current = deleteWarning;

  // ============================================================================
  // Effets
  // ============================================================================

  const loadCompanyUser = useCallback(async (companyId: string) => {
    setIsLoadingUser(true);
    setCompanyUser(null);
    const result = await getCompanyUser(companyId);
    setCompanyUser(result.data);
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    if (viewingCompany) {
      void loadCompanyUser(viewingCompany.id);
    } else {
      setCompanyUser(null);
    }
  }, [viewingCompany, loadCompanyUser]);

  // ============================================================================
  // Données filtrées + triées
  // ============================================================================

  const filteredCompanies = useMemo(() => {
    // Filtre recherche
    const query = searchQuery.trim();
    const filtered = query
      ? companies.filter(
          (company) =>
            searchMatch(company.name, query) ||
            searchMatch(company.city || '', query) ||
            searchMatch(company.contact_name || '', query)
        )
      : companies;

    // Tri par nom
    return [...filtered].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searchQuery, companies, sortDir]);

  // Toggle direction
  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

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

  const handleConfirmDelete = useCallback(async () => {
    const current = companyToDeleteRef.current;
    const warning = deleteWarningRef.current;

    if (current && !warning) {
      setIsSubmitting(true);
      const result = await remove(current.id);
      setIsSubmitting(false);

      if (result.success) {
        setCompanyToDelete(null);
        toast.success('Compagnie supprimée');
      } else {
        logger.error('Compagnies - Erreur suppression', { error: result.error });
        toast.error('Erreur lors de la suppression');
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
          toast.success('Compagnie modifiée avec succès');
        } else {
          setFormError(result.error || 'Erreur lors de la mise à jour');
          toast.error('Erreur lors de la modification');
        }
      } else {
        const result = await create(formData as CompanyInsert);
        if (result.success) {
          setIsFormDialogOpen(false);
          toast.success('Compagnie créée avec succès');
        } else {
          setFormError(result.error || 'Erreur lors de la création');
          toast.error('Erreur lors de la création');
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

  const unlinkCompanyUser = useCallback(
    async (userId: string, companyId: string, openAssignDialog: boolean): Promise<boolean> => {
      setIsProcessingUser(true);

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: null }),
        });

        if (!response.ok) {
          logger.error('Compagnies - HTTP Error dissociation', { status: response.status });
          return false;
        }

        const result = (await response.json()) as ApiResponse;

        if (!result.success) {
          logger.error('Compagnies - Erreur dissociation utilisateur', { error: result.error });
          return false;
        }

        setCompanyUser(null);
        setCompanyHasUser(companyId, false);

        if (openAssignDialog) {
          setIsAssignUserDialogOpen(true);
        }

        return true;
      } catch (error) {
        logger.error('Compagnies - Exception dissociation utilisateur', { error });
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

    // Tri
    sortDir,
    toggleSortDir,

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
