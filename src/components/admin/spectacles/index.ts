// Composants de gestion des spectacles

export { CategoryManagerDialog } from './category-manager-dialog';
export type { CategoryManagerDialogProps } from './category-manager-dialog';

export { TargetAudienceManagerDialog } from './target-audience-manager-dialog';
export type { TargetAudienceManagerDialogProps, TargetAudience } from './target-audience-manager-dialog';

export { CompanyQuickCreateDialog } from './company-quick-create-dialog';
export type { CompanyQuickCreateDialogProps } from './company-quick-create-dialog';

export { SpectacleViewDialog } from './spectacle-view-dialog';
export type { SpectacleViewDialogProps } from './spectacle-view-dialog';

// SpectacleFormDialog - refactorisé en module (Session 101)
export { SpectacleFormDialog } from './spectacle-form-dialog';
export type { SpectacleFormDialogProps, SpectacleFormData } from './spectacle-form-dialog';

// Types réexportés depuis admin/spectacles/types.ts pour compatibilité
export type {
  CategoryOption,
  TargetAudienceOption,
  CompanyOption,
  DervisheUserOption,
} from '@/app/admin/spectacles/types';

export { ImageUploader } from './image-uploader';
export type { ImageUploaderProps } from './image-uploader';
