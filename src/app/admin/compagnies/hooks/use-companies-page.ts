/**
 * Hook principal pour la page admin/compagnies
 * Orchestrateur mince composant les sub-hooks
 * Session 107 - Refactorisation + Corrections audit
 * S158 - Ajout tri alphabétique + nb spectacles
 * S160 - Fusion viewingCompany + editingCompany → selectedCompany (dialog unifié)
 */

import { useCompanies } from '@/hooks/useCompanies';
import { useCompaniesFilters } from './use-companies-filters';
import { useCompaniesCrud } from './use-companies-crud';
import type { UseCompaniesPageReturn } from '../types';

export function useCompaniesPage(): UseCompaniesPageReturn {
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

  const {
    filteredCompanies,
    searchQuery,
    setSearchQuery,
    sortDir,
    toggleSortDir,
  } = useCompaniesFilters({ companies });

  const {
    companyUser,
    formError,
    loadingStates,
    dialogStates,
    handlers,
    userHandlers,
    handleDialogChange,
    handleFormSubmit,
    handleDeleteFromDialog,
    handleConfirmDelete,
    closeDeleteDialog,
    handleConfirmUnlink,
    setIsUnlinkConfirmOpen,
    setIsCreateUserDialogOpen,
    setIsAssignUserDialogOpen,
    handleUserCreated,
  } = useCompaniesCrud({ create, update, remove, checkUsage, setCompanyHasUser });

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
    loadingStates,

    // États des dialogs
    dialogStates,

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
