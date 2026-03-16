/**
 * Types partagés pour CompanyDialog
 * Extraits de company-dialog.tsx — S160
 */

import type { CompanyWithShowsCount } from '@/lib/services/companies';
import type { ManagedUser } from '@/lib/services/internal-users';
import type { CompanyFormData } from '../company-form-dialog';

export type { CompanyFormData };

export type ActiveTab = 'informations' | 'acces';

export interface CompanyDialogProps {
  /** Contrôle l'ouverture */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Compagnie en édition — null = mode création */
  company: CompanyWithShowsCount | null;
  /** Callback soumission formulaire */
  onSubmit: (data: CompanyFormData, isEditing: boolean) => Promise<void>;
  isSubmitting?: boolean;
  /** Erreur serveur à afficher dans le formulaire */
  error?: string | null;
  /** Callback suppression (footer gauche, mode édition uniquement) */
  onDelete?: () => void;
  /** Nombre de spectacles de la compagnie */
  showsCount?: number;
  /** Callback voir les spectacles */
  onViewShows?: () => void;
  /** Utilisateur lié */
  companyUser?: ManagedUser | null;
  isLoadingUser?: boolean;
  onCreateUser?: () => void;
  onAssignUser?: () => void;
  onChangeUser?: () => Promise<void>;
  onUnlinkUser?: () => void;
  isProcessing?: boolean;
}

export interface InformationsFormProps {
  formData: CompanyFormData;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  error: string | null;
  onFieldChange: (field: keyof CompanyFormData, value: string | null) => void;
}

export interface AccesPlateformeSectionProps {
  company: CompanyWithShowsCount;
  showsCount: number;
  onViewShows?: () => void;
  companyUser?: ManagedUser | null;
  isLoadingUser: boolean;
  onCreateUser?: () => void;
  onAssignUser?: () => void;
  onChangeUser?: () => Promise<void>;
  onUnlinkUser?: () => void;
  isProcessing: boolean;
}
