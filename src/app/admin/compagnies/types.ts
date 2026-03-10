/**
 * Types locaux pour la page admin/compagnies
 * Session 107 - Refactorisation
 * S158 - Ajout types de tri
 * S160 - Fusion viewingCompany + editingCompany → selectedCompany
 */

import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from '@/components/admin/compagnies';
import type { SortDirection } from '@/components/admin';

// ============================================================================
// Types pour les réponses API
// ============================================================================

export interface ApiResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// Types pour les handlers
// ============================================================================

export interface CompanyHandlers {
  onCreate: () => void;
  onEdit: (company: CompanyWithShowsCount) => void;
  onView: (company: CompanyWithShowsCount) => void;
  onDelete: (company: CompanyWithShowsCount) => Promise<void>;
  onViewShows: (companyName: string) => void;
}

export interface CompanyUserHandlers {
  onCreateUser: () => void;
  onAssignUser: () => void;
  onChangeUser: () => Promise<void>;
  onUnlinkUser: () => void; // sync — ouvre juste la modale de confirmation
}

// ============================================================================
// Types pour les composants
// ============================================================================

export interface CompaniesListProps {
  companies: CompanyWithShowsCount[];
  /** Nom cliquable + bouton crayon appellent onEdit */
  onEdit: (company: CompanyWithShowsCount) => void;
  onDelete: (company: CompanyWithShowsCount) => Promise<void>;
  onViewShows: (companyName: string) => void;
}

export interface CompaniesContentProps extends CompaniesListProps {
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  totalCount: number;
  onRefresh: () => void;
  onCreate: () => void;
}

// ============================================================================
// Types pour le hook useCompaniesPage
// ============================================================================

/** États des dialogs — S160 : selectedCompany remplace editingCompany + viewingCompany */
export interface DialogStates {
  /** Dialog unifié ouvert */
  isDialogOpen: boolean;
  /** Compagnie sélectionnée (null = création, non-null = édition) */
  selectedCompany: CompanyWithShowsCount | null;
  /** Compagnie à supprimer */
  companyToDelete: CompanyWithShowsCount | null;
  /** Avertissement de suppression */
  deleteWarning: string | null;
  /** Dialog de création d'utilisateur ouvert */
  isCreateUserDialogOpen: boolean;
  /** Dialog d'assignation d'utilisateur ouvert */
  isAssignUserDialogOpen: boolean;
  /** Dialog de confirmation de dissociation ouvert */
  isUnlinkConfirmOpen: boolean;
}

export interface LoadingStates {
  isSubmitting: boolean;
  isCheckingUsage: boolean;
  isLoadingUser: boolean;
  isProcessingUser: boolean;
}

export interface UseCompaniesPageReturn {
  // Données
  filteredCompanies: CompanyWithShowsCount[];
  totalCount: number;
  companyUser: ManagedUser | null;

  // Tri
  sortDir: SortDirection;
  toggleSortDir: () => void;

  // États de chargement
  isLoading: boolean;
  error: string | null;
  formError: string | null;
  loadingStates: LoadingStates;

  // États des dialogs
  dialogStates: DialogStates;

  // Recherche
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Handlers
  handlers: CompanyHandlers;
  userHandlers: CompanyUserHandlers;

  // Handlers dialog
  handleDialogChange: (open: boolean) => void;
  handleFormSubmit: (formData: CompanyFormData, isEditing: boolean) => Promise<void>;
  handleDeleteFromDialog: () => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  closeDeleteDialog: () => void;
  handleConfirmUnlink: () => Promise<void>;
  setIsUnlinkConfirmOpen: (open: boolean) => void;

  // Setters dialogs secondaires
  setIsCreateUserDialogOpen: (open: boolean) => void;
  setIsAssignUserDialogOpen: (open: boolean) => void;

  // Callback utilisateur
  handleUserCreated: () => void;

  // Refresh
  refresh: () => void;
}
