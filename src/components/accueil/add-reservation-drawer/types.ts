/**
 * Types pour AddReservationDrawer
 * Derviche Diffusion - Session 82
 */

import type { UseFormReturn } from 'react-hook-form';
import type { CheckinStatus } from '@/types/database';
import type { DuplicateCheckResult } from '@/lib/services/checkin';
import type { FoundProfile } from '@/app/api/pwa/search-professional/route';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';
import type { ReservationRowData } from '@/components/accueil/ReservationRow';

// ============================================
// STEP
// ============================================

/** Étapes du drawer :
 *  - 'select-slot' : sélection show + créneau (si pas de slotId pré-fourni)
 *  - 'search'      : recherche email/nom (pré-remplissage)
 *  - 'form'        : formulaire complet
 *  - 'success'     : écran post-création — envoi emails post-checkin (si statut défini)
 */
export type AddReservationDrawerStep = 'select-slot' | 'search' | 'form' | 'success';

// ============================================
// PROPS DU COMPOSANT PRINCIPAL
// ============================================

export interface AddReservationDrawerProps {
  /** ID du slot pour lequel créer la réservation (optionnel si sélection via FAB) */
  slotId?: string;
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
  country?: string;
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
  step: AddReservationDrawerStep;
  activeSlotId: string;
  isSubmitting: boolean;
  optionalFieldsOpen: boolean;
  checkinFieldsOpen: boolean;
  capacityInfo: CapacityInfo | null;
  duplicateInfo: DuplicateCheckResult | null;
  showDuplicateDialog: boolean;
  /** Réservation créée — dispos après l'étape 'success' */
  createdReservation: ReservationRowData | null;
}

// ============================================
// RETOUR DU HOOK
// ============================================

export interface UseAddReservationReturn {
  // Form react-hook-form
  form: UseFormReturn<AddReservationFormData>;
  // États
  state: AddReservationState;
  // Notifications
  notifOptions: NotificationOptions;
  setNotifOptions: (options: NotificationOptions) => void;
  // Setters pour les collapsibles
  setOptionalFieldsOpen: (open: boolean) => void;
  setCheckinFieldsOpen: (open: boolean) => void;
  // Handlers de navigation entre étapes
  handleSlotSelected: (slotId: string) => void;
  handleSelectProfile: (profile: FoundProfile) => void;
  handleSkipSearch: () => void;
  // Handlers formulaire
  onFormSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleConfirmDuplicate: () => void;
  handleCancelDuplicate: () => void;
  // Contexte utilisateur
  isAdmin: boolean;
  /** Staff DD (admin + externe) : true. Compagnies : false. */
  isStaffDD: boolean;
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
  /** Staff DD (admin + externe) : true. Compagnies : false. Masque les notes internes. */
  isStaffDD: boolean;
}

export interface FormFooterProps {
  isSubmitting: boolean;
  /** ID du formulaire cible — permet de soumettre depuis un bouton hors du <form> */
  formId: string;
}

export interface DuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateInfo: DuplicateCheckResult | null;
  pendingEmail: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}
