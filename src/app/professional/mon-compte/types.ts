/**
 * Types — Mon Compte professionnel
 * Derviche Diffusion
 */

// ============================================
// DOMAIN TYPES
// ============================================

export interface ProProfile {
  id: string;
  email: string;
  email2: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string;
  organization: string;
  function: string;
  afcNumber: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string;
  email2: string;
  organization: string;
  function: string;
  afcNumber: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type EditingSection = 'personal' | 'professional' | 'address' | null;

/** Etapes du dialog de suppression de compte */
export type DeleteStep = 'confirm' | 'deleting';

// ============================================
// COMPONENT PROPS
// ============================================

/** Props partagees par les 3 cartes editables (personal, professional, address) */
export interface SectionCardProps {
  profile: ProProfile;
  formData: ProfileFormData;
  editingSection: EditingSection;
  isSaving: boolean;
  onFormChange: (updates: Partial<ProfileFormData>) => void;
  onEdit: (section: NonNullable<EditingSection>) => void;
  onSave: (section: NonNullable<EditingSection>) => void;
  onCancelEdit: (section: NonNullable<EditingSection>) => void;
}
