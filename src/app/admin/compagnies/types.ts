/**
 * Types locaux pour la page admin/compagnies
 * Session 107 - Refactorisation
 */

import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from '@/components/admin/compagnies';

// ============================================================================
// Types pour les réponses API
// ============================================================================

/** Type pour les réponses API standardisées */
export interface ApiResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// Types pour les handlers
// ============================================================================

/** Handlers pour les actions CRUD sur les compagnies */
export interface CompanyHandlers {
  /** Ouvrir le dialog de création */
  onCreate: () => void;
  /** Ouvrir le dialog d'édition */
  onEdit: (company: CompanyWithShowsCount) => void;
  /** Ouvrir le dialog de visualisation */
  onView: (company: CompanyWithShowsCount) => void;
  /** Ouvrir le dialog de suppression avec vérification d'usage */
  onDelete: (company: CompanyWithShowsCount) => Promise<void>;
  /** Naviguer vers les spectacles filtrés par compagnie */
  onViewShows: (companyName: string) => void;
}

/** Handlers pour la gestion utilisateur compagnie */
export interface CompanyUserHandlers {
  /** Ouvrir le dialog de création d'utilisateur */
  onCreateUser: () => void;
  /** Ouvrir le dialog d'assignation d'utilisateur existant */
  onAssignUser: () => void;
  /** Changer l'utilisateur associé */
  onChangeUser: () => Promise<void>;
  /** Dissocier l'utilisateur sans en assigner un nouveau */
  onUnlinkUser: () => Promise<void>;
}

// ============================================================================
// Types pour les composants
// ============================================================================

/** Props communes pour Table et Cards */
export interface CompaniesListProps {
  /** Liste des compagnies à afficher */
  companies: CompanyWithShowsCount[];
  /** Handler pour voir une compagnie */
  onView: (company: CompanyWithShowsCount) => void;
  /** Handler pour éditer une compagnie */
  onEdit: (company: CompanyWithShowsCount) => void;
  /** Handler pour supprimer une compagnie */
  onDelete: (company: CompanyWithShowsCount) => Promise<void>;
  /** Handler pour voir les spectacles d'une compagnie */
  onViewShows: (companyName: string) => void;
}

/** Props pour le composant CompaniesContent */
export interface CompaniesContentProps extends CompaniesListProps {
  /** État de chargement initial */
  isLoading: boolean;
  /** Message d'erreur éventuel */
  error: string | null;
  /** Requête de recherche actuelle */
  searchQuery: string;
  /** Nombre total de compagnies (avant filtre) */
  totalCount: number;
  /** Handler pour rafraîchir les données */
  onRefresh: () => void;
  /** Handler pour créer une compagnie */
  onCreate: () => void;
}

// ============================================================================
// Types pour le hook useCompaniesPage
// ============================================================================

/** États des dialogs */
export interface DialogStates {
  /** Dialog de formulaire (création/édition) ouvert */
  isFormDialogOpen: boolean;
  /** Compagnie en cours d'édition (null = création) */
  editingCompany: CompanyWithShowsCount | null;
  /** Compagnie à supprimer */
  companyToDelete: CompanyWithShowsCount | null;
  /** Compagnie en cours de visualisation */
  viewingCompany: CompanyWithShowsCount | null;
  /** Avertissement de suppression (compagnie utilisée) */
  deleteWarning: string | null;
  /** Dialog de création d'utilisateur ouvert */
  isCreateUserDialogOpen: boolean;
  /** Dialog d'assignation d'utilisateur ouvert */
  isAssignUserDialogOpen: boolean;
}

/** États de chargement */
export interface LoadingStates {
  /** Soumission en cours */
  isSubmitting: boolean;
  /** Vérification d'usage en cours */
  isCheckingUsage: boolean;
  /** Chargement de l'utilisateur compagnie */
  isLoadingUser: boolean;
  /** Traitement utilisateur en cours (link/unlink) */
  isProcessingUser: boolean;
}

/** Retour du hook useCompaniesPage */
export interface UseCompaniesPageReturn {
  // Données
  /** Compagnies filtrées selon la recherche */
  filteredCompanies: CompanyWithShowsCount[];
  /** Nombre total de compagnies */
  totalCount: number;
  /** Utilisateur lié à la compagnie visualisée */
  companyUser: ManagedUser | null;

  // États de chargement
  /** Chargement initial des données */
  isLoading: boolean;
  /** Erreur de chargement */
  error: string | null;
  /** Erreur du formulaire */
  formError: string | null;
  /** États de chargement détaillés */
  loadingStates: LoadingStates;

  // États des dialogs
  dialogStates: DialogStates;

  // Recherche
  /** Requête de recherche */
  searchQuery: string;
  /** Modifier la requête de recherche */
  setSearchQuery: (query: string) => void;

  // Handlers CRUD
  handlers: CompanyHandlers;

  // Handlers utilisateur
  userHandlers: CompanyUserHandlers;

  // Handlers formulaire
  /** Gérer le changement d'état du dialog formulaire */
  handleFormDialogChange: (open: boolean) => void;
  /** Soumettre le formulaire */
  handleFormSubmit: (formData: CompanyFormData, isEditing: boolean) => Promise<void>;
  /** Confirmer la suppression */
  handleConfirmDelete: () => Promise<void>;

  // Handlers view dialog
  /** Passer de la vue à l'édition */
  handleViewToEdit: () => void;
  /** Passer de la vue à la suppression */
  handleViewToDelete: () => Promise<void>;
  /** Fermer le dialog de visualisation */
  closeViewDialog: () => void;

  // Handlers dialog setters
  /** Fermer le dialog de suppression */
  closeDeleteDialog: () => void;
  /** Setter pour le dialog création utilisateur */
  setIsCreateUserDialogOpen: (open: boolean) => void;
  /** Setter pour le dialog assignation utilisateur */
  setIsAssignUserDialogOpen: (open: boolean) => void;

  // Callback utilisateur
  /** Callback après création/assignation d'un utilisateur */
  handleUserCreated: () => void;

  // Refresh
  /** Rafraîchir les données */
  refresh: () => void;
}
