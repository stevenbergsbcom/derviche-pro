/**
 * Hook principal pour la page admin/compagnies
 * Centralise tous les états et handlers
 * Session 107 - Refactorisation + Corrections audit
 * S158 - Ajout tri alphabétique + nb spectacles
 * S160 - Fusion viewingCompany + editingCompany → selectedCompany (dialog unifié)
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchMatch } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { getCompanyUser } from '@/lib/services/internal-users';
import { useCompanies } from '@/hooks/useCompanies';
import type { CompanyInsert } from '@/types/database';
import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from '@/components/admin/compagnies';
import type { SortDirection } from '@/components/admin';
import type { UseCompaniesPageReturn, CompanyHandlers, CompanyUserHandlers, ApiResponse } from '../types';

export function useCompaniesPage(): UseCompaniesPageReturn {
  const router = useRouter();

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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pendingDeleteCheckRef = useRef<string | null>(null);

  // Dialog unifié — selectedCompany null = création, non-null = édition
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithShowsCount | null>(null);

  // Suppression
  const [companyToDelete, setCompanyToDelete] = useState<CompanyWithShowsCount | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Utilisateur compagnie
  const [companyUser, setCompanyUser] = useState<ManagedUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isProcessingUser, setIsProcessingUser] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false);
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);

  // ============================================================================
  // Refs pour stabilité des callbacks
  // ============================================================================

  const selectedCompanyRef = useRef(selectedCompany);
  selectedCompanyRef.current = selectedCompany;

  const companyUserRef = useRef(companyUser);
  companyUserRef.current = companyUser;

  const companyToDeleteRef = useRef(companyToDelete);
  companyToDeleteRef.current = companyToDelete;

  const deleteWarningRef = useRef(deleteWarning);
  deleteWarningRef.current = deleteWarning;

  // ============================================================================
  // Chargement utilisateur compagnie
  // ============================================================================

  const loadCompanyUser = useCallback(async (companyId: string) => {
    setIsLoadingUser(true);
    setCompanyUser(null);
    const result = await getCompanyUser(companyId);
    setCompanyUser(result.data);
    setIsLoadingUser(false);
  }, []);

  // Charger l'utilisateur quand le dialog s'ouvre sur une compagnie existante
  useEffect(() => {
    if (isDialogOpen && selectedCompany) {
      void loadCompanyUser(selectedCompany.id);
    } else {
      setCompanyUser(null);
    }
  }, [isDialogOpen, selectedCompany, loadCompanyUser]);

  // ============================================================================
  // Données filtrées + triées
  // ============================================================================

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim();
    const filtered = query
      ? companies.filter(
          (company) =>
            searchMatch(company.name, query) ||
            searchMatch(company.city || '', query) ||
            searchMatch(company.contact_name || '', query)
        )
      : companies;

    return [...filtered].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [searchQuery, companies, sortDir]);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  // ============================================================================
  // Handlers CRUD
  // ============================================================================

  const handleCreate = useCallback(() => {
    setSelectedCompany(null);
    setFormError(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((company: CompanyWithShowsCount) => {
    setSelectedCompany(company);
    setFormError(null);
    setIsDialogOpen(true);
  }, []);

  // onView ouvre le même dialog que onEdit
  const handleView = useCallback((company: CompanyWithShowsCount) => {
    setSelectedCompany(company);
    setFormError(null);
    setIsDialogOpen(true);
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

  // Suppression depuis le footer du dialog unifié
  const handleDeleteFromDialog = useCallback(async () => {
    const current = selectedCompanyRef.current;
    if (!current) return;
    // Fermer le dialog avant d'ouvrir la confirmation
    setIsDialogOpen(false);
    await handleDeleteClick(current);
  }, [handleDeleteClick]);

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

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormError(null);
      setSelectedCompany(null);
    }
  }, []);

  const handleFormSubmit = useCallback(
    async (formData: CompanyFormData, isEditing: boolean) => {
      setIsSubmitting(true);
      setFormError(null);

      const currentSelected = selectedCompanyRef.current;

      if (isEditing && currentSelected) {
        const result = await update(currentSelected.id, formData);
        if (result.success) {
          setIsDialogOpen(false);
          setSelectedCompany(null);
          toast.success('Compagnie modifiée avec succès');
        } else {
          setFormError(result.error || 'Erreur lors de la mise à jour');
          toast.error('Erreur lors de la modification');
        }
      } else {
        const result = await create(formData as CompanyInsert);
        if (result.success) {
          setIsDialogOpen(false);
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
  // Handlers suppression
  // ============================================================================

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
    const current = selectedCompanyRef.current;
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
    const currentCompany = selectedCompanyRef.current;
    if (!currentUser || !currentCompany) return;
    await unlinkCompanyUser(currentUser.id, currentCompany.id, true);
  }, [unlinkCompanyUser]);

  const handleUnlinkUser = useCallback(() => {
    setIsUnlinkConfirmOpen(true);
  }, []);

  const handleConfirmUnlink = useCallback(async () => {
    const currentUser = companyUserRef.current;
    const currentCompany = selectedCompanyRef.current;
    if (!currentUser || !currentCompany) return;
    setIsUnlinkConfirmOpen(false);
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
      isDialogOpen,
      selectedCompany,
      companyToDelete,
      deleteWarning,
      isCreateUserDialogOpen,
      isAssignUserDialogOpen,
      isUnlinkConfirmOpen,
    },

    // Recherche
    searchQuery,
    setSearchQuery,

    // Handlers
    handlers,
    userHandlers,

    // Handlers dialog
    handleDialogChange,
    handleFormSubmit,
    handleDeleteFromDialog,
    handleConfirmDelete,
    closeDeleteDialog,
    handleConfirmUnlink,
    setIsUnlinkConfirmOpen,

    // Handlers dialog setters
    setIsCreateUserDialogOpen,
    setIsAssignUserDialogOpen,

    // Callback après création/assignation utilisateur
    handleUserCreated,

    // Refresh
    refresh,
  };
}
