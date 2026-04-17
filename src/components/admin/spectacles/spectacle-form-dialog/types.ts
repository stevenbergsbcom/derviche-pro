/**
 * Types pour SpectacleFormDialog
 * Derviche Diffusion - Session 101
 */

import type { ShowStatus, ShowPriceType } from '@/types/database';
import type { ShowWithRelations } from '@/lib/services/shows';
import type {
  CategoryOption,
  CompanyOption,
  DervisheUserOption,
  TargetAudienceOption,
} from '@/app/admin/spectacles/types';

// ============================================
// RÉEXPORTS - Types partagés
// ============================================

// Réexporter les types de base
export type { ShowStatus, ShowPriceType };

// Réexporter les types d'options pour usage externe
export type {
  CategoryOption,
  CompanyOption,
  DervisheUserOption,
  TargetAudienceOption,
};

// ============================================
// TYPES FORMULAIRE
// ============================================

/**
 * Données du formulaire spectacle
 * Utilisé pour création et édition
 */
export interface SpectacleFormData {
  slug: string;
  title: string;
  companyId: string;
  categoryIds: string[];
  targetAudienceIds: string[];
  description: string;
  shortDescription: string | null;
  imageUrl: string | null;
  /** Fichier image à uploader (si nouvelle image sélectionnée) */
  imageFile: File | null;
  /** Indique si l'image doit être supprimée */
  imageRemoved: boolean;
  duration: number | null;
  status: ShowStatus;
  priceType: ShowPriceType;
  period: string;
  dervisheManagerId: string;
  invitationPolicy: string;
  maxParticipantsPerBooking: number | undefined;
  closureDates: string;
  folderUrl: string;
  teaserUrl: string;
  captationAvailable: boolean;
  captationUrl: string;
  /** URL du dossier photo — S170 */
  photoFolderUrl: string;
  /** URL de la page marketing sur dervichediffusion.com */
  dervisheSiteUrl: string;
}

// ============================================
// PROPS DES COMPOSANTS
// ============================================

/**
 * Props du dialog principal
 */
export interface SpectacleFormDialogProps {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Callback quand la modale se ferme */
  onOpenChange: (open: boolean) => void;
  /** Spectacle en cours d'édition (null = mode création) */
  editingShow: ShowWithRelations | null;
  /** Callback à la soumission du formulaire */
  onSubmit: (data: SpectacleFormData, isEditing: boolean) => void | Promise<void>;
  /** Liste des compagnies disponibles */
  companies: CompanyOption[];
  /** Liste des catégories disponibles */
  categories: CategoryOption[];
  /** Liste des publics cibles disponibles */
  targetAudiences: TargetAudienceOption[];
  /** Liste des utilisateurs Derviche (pour le responsable) */
  dervisheUsers: DervisheUserOption[];
  /** Callback pour ouvrir la modale de gestion des catégories */
  onOpenCategoriesManager: () => void;
  /** Callback pour ouvrir la modale de gestion des publics cibles */
  onOpenTargetAudiencesManager: () => void;
  /** Callback pour ouvrir la modale de création de compagnie */
  onOpenNewCompanyDialog: () => void;
  /** ID de la compagnie nouvellement créée (pour auto-sélection) */
  newlyCreatedCompanyId?: string | null;
  /** Callback pour reset l'ID de la compagnie nouvellement créée */
  onClearNewlyCreatedCompanyId?: () => void;
  /** Callback pour supprimer le spectacle (mode édition uniquement) */
  onDelete?: () => void | Promise<void>;
}

/**
 * Props pour la section informations de base (titre, compagnie)
 */
export interface BasicInfoSectionProps {
  title: string;
  slug: string;
  companyId: string;
  companies: CompanyOption[];
  onTitleChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onOpenNewCompanyDialog: () => void;
}

/**
 * Props pour la section catégories
 */
export interface CategoriesSectionProps {
  categoryIds: string[];
  categories: CategoryOption[];
  onCategoryChange: (categoryId: string, checked: boolean) => void;
  onOpenCategoriesManager: () => void;
}

/**
 * Props pour la section publics cibles
 */
export interface TargetAudiencesSectionProps {
  targetAudienceIds: string[];
  targetAudiences: TargetAudienceOption[];
  onTargetAudienceChange: (audienceId: string, checked: boolean) => void;
  onOpenTargetAudiencesManager: () => void;
}

/**
 * Props pour la section paramètres (statut, durée, période, relâche)
 */
export interface SettingsSectionProps {
  status: ShowStatus;
  duration: number | null;
  period: string;
  closureDates: string;
  onStatusChange: (value: ShowStatus) => void;
  onDurationChange: (value: number | null) => void;
  onPeriodChange: (value: string) => void;
  onClosureDatesChange: (value: string) => void;
}

/**
 * Props pour la section descriptions
 */
export interface DescriptionsSectionProps {
  description: string;
  invitationPolicy: string;
  maxParticipantsPerBooking: number | undefined;
  onDescriptionChange: (value: string) => void;
  onInvitationPolicyChange: (value: string) => void;
  onMaxParticipantsChange: (value: number | undefined) => void;
}

/**
 * Props pour la section gestion (responsable Derviche)
 */
export interface ManagementSectionProps {
  dervisheManagerId: string;
  dervisheUsers: DervisheUserOption[];
  onDervisheManagerChange: (value: string) => void;
}

/**
 * Props pour la section médias (URLs, captation, image)
 */
export interface MediaSectionProps {
  folderUrl: string;
  teaserUrl: string;
  captationAvailable: boolean;
  captationUrl: string;
  imageUrl: string | null;
  isSubmitting: boolean;
  onFolderUrlChange: (value: string) => void;
  onTeaserUrlChange: (value: string) => void;
  onCaptationAvailableChange: (value: boolean) => void;
  onCaptationUrlChange: (value: string) => void;
  /** S170 — Dossier photo */
  photoFolderUrl: string;
  onPhotoFolderUrlChange: (value: string) => void;
  /** Page marketing dervichediffusion.com */
  dervisheSiteUrl: string;
  onDervisheSiteUrlChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
}

/**
 * Props pour la bannière d'erreur
 */
export interface FormErrorProps {
  error: string | null;
  onClose: () => void;
}

// ============================================
// TYPE RETOUR DU HOOK
// ============================================

/**
 * Retour du hook useSpectacleForm
 */
export interface UseSpectacleFormReturn {
  // État
  formData: SpectacleFormData;
  isExpanded: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Setters directs
  setIsExpanded: (expanded: boolean) => void;
  setError: (error: string | null) => void;

  // Handlers formulaire
  updateField: <K extends keyof SpectacleFormData>(
    field: K,
    value: SpectacleFormData[K]
  ) => void;

  // Handlers spécifiques
  handleCategoryChange: (categoryId: string, checked: boolean) => void;
  handleTargetAudienceChange: (audienceId: string, checked: boolean) => void;
  handleImageChange: (file: File | null) => void;

  // Actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleClose: () => void;
  resetForm: () => void;
}
