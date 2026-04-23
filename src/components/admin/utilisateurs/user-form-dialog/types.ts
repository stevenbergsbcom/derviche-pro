/**
 * Types pour UserFormDialog
 * Derviche Diffusion - Session 102
 */

import type { InternalUser } from '@/types/database';
import type { ManagedRole, ManagedUser } from '@/lib/services/internal-users';
import type { CompanyRow } from '@/types/database';

// ============================================
// RÉEXPORTS
// ============================================

export type { ManagedRole, ManagedUser };
export type { CompanyRow };

// ============================================
// TYPES LOCAUX
// ============================================

/**
 * Résultat de getPasswordStrength
 */
export interface PasswordStrength {
  score: number;
  label: 'faible' | 'moyen' | 'fort' | 'très fort';
}

// ============================================
// TYPES FORMULAIRE
// ============================================

/**
 * Données du formulaire utilisateur (édition)
 */
export interface UserFormData {
  first_name: string;
  last_name: string;
  phone: string;
  role: ManagedRole;
  company_id?: string;
}

/**
 * Données du formulaire utilisateur (création)
 * Étend UserFormData avec les champs spécifiques à la création
 */
export interface CreateUserFormData extends UserFormData {
  email: string;
  password: string;
  must_change_password: boolean;
}

// ============================================
// PROPS DU DIALOG PRINCIPAL
// ============================================

/**
 * Props du composant UserFormDialog
 */
export interface UserFormDialogProps {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Callback quand la modale se ferme */
  onOpenChange: (open: boolean) => void;
  /** Utilisateur en cours d'édition (null = mode création) */
  editingUser: InternalUser | ManagedUser | null;
  /** Callback à la soumission du formulaire (édition) */
  onSubmit: (data: UserFormData, isEditing: boolean) => Promise<void> | void;
  /** Callback à la création d'un utilisateur */
  onCreate?: (data: CreateUserFormData) => Promise<void> | void;
  /** État de chargement */
  isSubmitting?: boolean;
  /** Message d'erreur à afficher */
  error?: string | null;
  /**
   * Rôle du viewer courant — utilisé par le RoleSelector pour masquer
   * l'option `super-admin` quand l'acteur n'est pas super-admin.
   */
  viewerRole?: string | null;
}

// ============================================
// PROPS DES SOUS-COMPOSANTS
// ============================================

/**
 * Props pour le champ email
 */
export interface EmailFieldProps {
  /** Mode création (true) ou édition (false) */
  isCreating: boolean;
  /** Valeur de l'email */
  email: string;
  /** Email de l'utilisateur en édition */
  editingUserEmail?: string;
  /** Callback de changement */
  onChange: (value: string) => void;
  /** Erreur de validation */
  validationError?: string;
  /** État de soumission */
  isSubmitting: boolean;
}

/**
 * Props pour le champ mot de passe
 */
export interface PasswordFieldProps {
  /** Valeur du mot de passe */
  password: string;
  /** Callback de changement */
  onChange: (value: string) => void;
  /** Callback pour générer un nouveau mot de passe */
  onGenerate: () => void;
  /** Callback pour copier le mot de passe */
  onCopy: () => Promise<void>;
  /** Indique si le mot de passe est visible */
  showPassword: boolean;
  /** Callback pour toggle la visibilité */
  onToggleVisibility: () => void;
  /** Indique si le mot de passe a été copié */
  copied: boolean;
  /** Force du mot de passe */
  passwordStrength: PasswordStrength | null;
  /** Erreur de validation */
  validationError?: string;
  /** État de soumission */
  isSubmitting: boolean;
}

/**
 * Props pour la case "forcer changement mot de passe"
 */
export interface MustChangePasswordFieldProps {
  /** Valeur de la case */
  checked: boolean;
  /** Callback de changement */
  onChange: (checked: boolean) => void;
  /** État de soumission */
  isSubmitting: boolean;
}

/**
 * Props pour les champs d'informations personnelles
 */
export interface PersonalInfoFieldsProps {
  /** Prénom */
  firstName: string;
  /** Nom */
  lastName: string;
  /** Téléphone */
  phone: string;
  /** Callback pour changement de prénom */
  onFirstNameChange: (value: string) => void;
  /** Callback pour changement de nom */
  onLastNameChange: (value: string) => void;
  /** Callback pour changement de téléphone */
  onPhoneChange: (value: string) => void;
  /** État de soumission */
  isSubmitting: boolean;
}

/**
 * Props pour le sélecteur de rôle
 */
export interface RoleSelectorProps {
  /** Rôle sélectionné */
  role: ManagedRole;
  /** Callback de changement */
  onChange: (role: ManagedRole) => void;
  /** Indique si le sélecteur est désactivé */
  disabled: boolean;
  /** Message d'avertissement (ex: utilisateur company) */
  warningMessage?: string;
  /**
   * Rôle du viewer (admin/super-admin/externe…). Si absent ou ≠ super-admin,
   * l'option `super-admin` est masquée du dropdown. Seul un super-admin peut
   * attribuer le rôle super-admin (defense-in-depth côté serveur aussi).
   */
  viewerRole?: string | null;
}

/**
 * Props pour le sélecteur de compagnie
 */
export interface CompanySelectorProps {
  /** ID de la compagnie sélectionnée */
  companyId: string | undefined;
  /** Liste des compagnies disponibles */
  companies: CompanyRow[];
  /** Callback de changement */
  onChange: (companyId: string) => void;
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Indique si le sélecteur est désactivé */
  disabled: boolean;
  /** Erreur de validation */
  validationError?: string;
  /** Mode création */
  isCreating: boolean;
  /** Indique si on édite un utilisateur company */
  isEditingCompanyUser: boolean;
}

/**
 * Props pour la bannière d'erreur
 */
export interface FormErrorProps {
  /** Message d'erreur */
  error: string | null;
}

// ============================================
// TYPE RETOUR DU HOOK
// ============================================

/**
 * Retour du hook useUserFormDialog
 */
export interface UseUserFormDialogReturn {
  // Mode
  isCreating: boolean;

  // États du formulaire
  formData: CreateUserFormData;
  showPassword: boolean;
  copied: boolean;
  validationErrors: Record<string, string>;

  // Compagnies
  companies: CompanyRow[];
  isLoadingCompanies: boolean;

  // Calculs dérivés
  passwordStrength: PasswordStrength | null;
  isValid: boolean;
  isEditingCompanyUser: boolean;
  canSelectCompany: boolean;

  // Handlers
  handleFieldChange: (field: keyof CreateUserFormData, value: string | boolean | undefined) => void;
  handleRoleChange: (role: ManagedRole) => void;
  handleCompanyChange: (companyId: string) => void;
  handleGeneratePassword: () => void;
  handleCopyPassword: () => Promise<void>;
  toggleShowPassword: () => void;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
}
