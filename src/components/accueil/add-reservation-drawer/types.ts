/**
 * Types pour AddReservationDrawer
 * Derviche Diffusion - Session 82
 */

import type { UseFormReturn } from 'react-hook-form';
import type { CheckinStatus } from '@/types/database';
import type { DuplicateCheckResult } from '@/lib/services/checkin';

// ============================================
// PROPS DU COMPOSANT PRINCIPAL
// ============================================

export interface AddReservationDrawerProps {
  /** ID du slot pour lequel créer la réservation */
  slotId: string;
  /** État d'ouverture */
  open: boolean;
  /** Handler de changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Callback après création réussie */
  onSuccess: () => void;
}

// ============================================
// DONNÉES DU FORMULAIRE
// ============================================

export interface AddReservationFormData {
  // Champs obligatoires
  firstName: string;
  lastName: string;
  email: string;
  numPlaces: number;
  // Champs optionnels
  phone?: string;
  emailSecondary?: string;
  phoneSecondary?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  organization?: string;
  function?: string;
  afcNumber?: string;
  specialRequests?: string;
  // Champs check-in
  checkinStatus?: CheckinStatus;
  checkinComment?: string;
  checkinVenueNotes?: string;
  checkinInternalNotes?: string;
}

// ============================================
// OPTIONS DE STATUT CHECK-IN
// ============================================

export interface StatusOption {
  value: CheckinStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// ============================================
// INFO CAPACITÉ SLOT
// ============================================

export interface CapacityInfo {
  remaining: number;
  isUnlimited: boolean;
}

// ============================================
// ÉTAT DU HOOK
// ============================================

export interface AddReservationState {
  isSubmitting: boolean;
  optionalFieldsOpen: boolean;
  checkinFieldsOpen: boolean;
  capacityInfo: CapacityInfo | null;
  duplicateInfo: DuplicateCheckResult | null;
  showDuplicateDialog: boolean;
}

// ============================================
// RETOUR DU HOOK
// ============================================

export interface UseAddReservationReturn {
  // Form react-hook-form
  form: UseFormReturn<AddReservationFormData>;
  // États
  state: AddReservationState;
  // Setters pour les collapsibles
  setOptionalFieldsOpen: (open: boolean) => void;
  setCheckinFieldsOpen: (open: boolean) => void;
  // Handlers
  onFormSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleConfirmDuplicate: () => void;
  handleCancelDuplicate: () => void;
  // Contexte utilisateur
  isAdmin: boolean;
}

// ============================================
// PROPS DES SECTIONS
// ============================================

export interface SectionProps {
  form: UseFormReturn<AddReservationFormData>;
  isSubmitting: boolean;
}

export interface CollapsibleSectionProps extends SectionProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface CheckinSectionProps extends CollapsibleSectionProps {
  isAdmin: boolean;
}

export interface FormFooterProps {
  isSubmitting: boolean;
}

export interface DuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateInfo: DuplicateCheckResult | null;
  pendingEmail: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface DrawerHeaderProps {
  capacityInfo: CapacityInfo | null;
}
