/**
 * Types pour la page admin/spectacles
 * S158 - Ajout type de tri
 */

import type { ShowStatus, ShowPriceType, ShowCategoryRow, TargetAudienceRow } from '@/types/database';

// ============================================================================
// Types de données
// ============================================================================

/**
 * Type pour l'affichage d'un spectacle (transformé depuis ShowWithRelations)
 */
export interface ShowForDisplay {
  id: string;
  slug: string;
  title: string;
  companyId: string;
  companyName: string;
  categories: string[];
  targetAudienceIds: string[];
  description?: string;
  shortDescription: string | null;
  imageUrl: string | null;
  duration: number | null;
  status: ShowStatus;
  priceType: ShowPriceType;
  period?: string;
  dervisheManagerId?: string;
  dervisheManager?: string;
  invitationPolicy?: string;
  maxParticipantsPerBooking?: number;
  closureDates?: string;
  representationsCount: number;
  folderUrl?: string;
  teaserUrl?: string;
  captationAvailable: boolean;
  captationUrl?: string;
  /** URL du dossier photo — S170 */
  photoFolderUrl?: string;
  /** URL de la page marketing dervichediffusion.com */
  dervisheSiteUrl?: string;
}

/**
 * Mode d'affichage de la liste
 */
export type ViewMode = 'list' | 'grid';

/**
 * Valeurs du select de tri spectacles : "champ_direction"
 */
export type SpectacleSortValue =
  | 'title_asc'
  | 'title_desc'
  | 'companyName_asc'
  | 'companyName_desc'
  | 'representationsCount_desc'
  | 'representationsCount_asc';

/**
 * Option de compagnie pour les selects
 * Note: contactEmail est string (pas null) pour compatibilité avec SpectacleFormDialog
 */
export interface CompanyOption {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

/**
 * Option d'utilisateur Derviche pour les selects
 */
export interface DervisheUserOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Option de catégorie pour les selects
 */
export interface CategoryOption {
  id: string;
  name: string;
}

/**
 * Option de public cible pour les selects
 */
export interface TargetAudienceOption {
  id: string;
  name: string;
}

// ============================================================================
// Props des composants
// ============================================================================

/**
 * Props pour la barre de filtres
 */
export interface SpectacleFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  /** Valeur courante du tri (ex: 'title_asc') */
  sortValue: SpectacleSortValue;
  /** Callback quand le tri change */
  onSortChange: (value: SpectacleSortValue) => void;
}

/**
 * Props communes pour les vues (table, grid, mobile)
 */
export interface SpectacleViewProps {
  shows: ShowForDisplay[];
  onView: (show: ShowForDisplay) => void;
  onEdit: (show: ShowForDisplay) => void;
  onDelete: (show: ShowForDisplay) => void;
  onCopyLink: (show: ShowForDisplay) => void;
  onNavigateToRepresentations: (showId: string) => void;
  copiedShowId: string | null;
  hasFullAccess: boolean;
}

/**
 * Props pour le contenu de carte (partagé grid/mobile)
 */
export interface SpectacleCardContentProps {
  show: ShowForDisplay;
  onView: (show: ShowForDisplay) => void;
  onEdit: (show: ShowForDisplay) => void;
  onDelete: (show: ShowForDisplay) => void;
  onCopyLink: (show: ShowForDisplay) => void;
  onNavigateToRepresentations: (showId: string) => void;
  copiedShowId: string | null;
  hasFullAccess: boolean;
  variant: 'grid' | 'mobile';
}

/**
 * Props pour le wrapper de modales
 */
export interface SpectacleModalsProps {
  // Form dialog
  isFormDialogOpen: boolean;
  onFormDialogOpenChange: (open: boolean) => void;
  editingShowRaw: import('@/lib/services/shows').ShowWithRelations | null;
  onFormSubmit: (data: import('@/components/admin/spectacles/spectacle-form-dialog').SpectacleFormData, isEditing: boolean) => Promise<void>;
  companies: CompanyOption[];
  categories: CategoryOption[];
  targetAudiences: TargetAudienceOption[];
  dervisheUsers: DervisheUserOption[];
  newlyCreatedCompanyId: string | null;
  onClearNewlyCreatedCompanyId: () => void;
  onOpenCategoriesManager: () => void;
  onOpenTargetAudiencesManager: () => void;
  onOpenNewCompanyDialog: () => void;
  onDeleteFromForm?: () => void;

  // View dialog
  viewingShowRaw: import('@/lib/services/shows').ShowWithRelations | null;
  rawCategories: ShowCategoryRow[];
  rawTargetAudiences: TargetAudienceRow[];
  onCloseView: () => void;
  onViewToEdit: () => void;
  onViewToDelete: () => void;
  onCopyLinkFromView: (show: { id: string; slug: string }) => void;
  copiedShowId: string | null;
  onNavigateToRepresentations: (showId: string) => void;

  // Category manager
  isCategoriesDialogOpen: boolean;
  onCategoriesDialogOpenChange: (open: boolean) => void;
  onAddCategory: (name: string) => Promise<void>;
  onRenameCategory: (id: string, name: string) => Promise<void>;
  onRemoveCategory: (id: string) => Promise<void>;

  // Target audience manager
  isAudiencesDialogOpen: boolean;
  onAudiencesDialogOpenChange: (open: boolean) => void;
  onAddTargetAudience: (name: string) => Promise<void>;
  onRenameTargetAudience: (id: string, name: string) => Promise<void>;
  onRemoveTargetAudience: (id: string) => Promise<void>;

  // Company quick create
  isNewCompanyDialogOpen: boolean;
  onNewCompanyDialogOpenChange: (open: boolean) => void;
  onCreateCompany: (data: { name: string; email: string }) => Promise<string>;
  onCompanyCreated: (companyId: string) => void;

  // Delete confirm
  showToDelete: ShowForDisplay | null;
  deleteWarning: string | null;
  isDeleting: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}
