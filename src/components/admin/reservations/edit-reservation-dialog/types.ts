/**
 * Types pour EditReservationDialog
 * Derviche Diffusion - Session 111
 */

import type { 
  AdminReservation, 
  UpdateReservationData,
  AvailableSlot 
} from '@/lib/services/admin-reservations';
import type { CheckinStatus } from '@/types/database';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// Réexport des types du service
export type { AdminReservation, UpdateReservationData, AvailableSlot };

// ============================================
// TYPES RÉSULTATS
// ============================================

/**
 * Résultat du chargement des créneaux
 */
export interface SlotsResult {
  success: boolean;
  data?: AvailableSlot[];
  error?: string;
}

// ============================================
// TYPES PROPS COMPOSANTS
// ============================================

/**
 * Props du composant principal EditReservationDialog
 */
export interface EditReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: AdminReservation | null;
  /** _notifOptions est une propriété UI pass-through pour le contrôle des notifications */
  onSave: (data: UpdateReservationData & { _notifOptions?: NotificationOptions }) => Promise<void>;
  onCancel: (reservation: AdminReservation) => void;
  onGetSlots: (showId: string) => Promise<SlotsResult>;
  isSaving: boolean;
  /** Appelé après mise à jour checkin réussie — permet au parent de rafraîchir ses données */
  onCheckinUpdated?: (reservationId: string, status: CheckinStatus | null) => void;
}

export type { NotificationOptions };

/**
 * Props pour le banner d'annulation
 */
export interface CancelledBannerProps {
  cancelledAt: string | null;
  cancellationReason: string | null;
}

/**
 * Props pour le banner d'anomalie
 */
export interface AnomalyBannerProps {
  hasAnomaly: boolean;
}

/**
 * Props pour la section créneau/places
 */
export interface SlotPlacesSectionProps {
  slotId: string;
  numPlaces: number;
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  slotsError: string | null;
  onSlotChange: (slotId: string) => void;
  onNumPlacesChange: (numPlaces: number) => void;
  disabled?: boolean;
}

/**
 * Props communes pour les sections de formulaire
 */
export interface FormSectionProps {
  disabled?: boolean;
}

/**
 * Handler de changement de champ générique
 */
export type FieldChangeHandler = <K extends keyof UpdateReservationData>(
  field: K,
  value: UpdateReservationData[K]
) => void;

/**
 * Props pour PersonalInfoSection (mode édition)
 */
export interface PersonalInfoSectionProps extends FormSectionProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  emailSecondary: string | null;
  phoneSecondary: string | null;
  onChange: FieldChangeHandler;
}

/**
 * Props pour ProfessionalInfoSection (mode édition)
 */
export interface ProfessionalInfoSectionProps extends FormSectionProps {
  organization: string | null;
  function: string | null;
  afcNumber: string | null;
  /**
   * ID CRM Zoho (S174). Affiché et éditable uniquement pour les résas guest
   * (`isGuest === true`). Pour une résa avec compte, l'ID est porté par
   * `profiles.crm_id` et hors scope S174.
   */
  crmId: string | null;
  /** Indique que la réservation est en mode guest (user_id IS NULL). */
  isGuest: boolean;
  onChange: FieldChangeHandler;
}

/**
 * Props pour AddressSection (mode édition)
 */
export interface AddressSectionProps extends FormSectionProps {
  address: string | null;
  postalCode: string | null;
  city: string | null;
  onChange: FieldChangeHandler;
}

/**
 * Props pour NotesSection (mode édition)
 */
export interface NotesSectionProps extends FormSectionProps {
  specialRequests: string | null;
  checkinComment: string | null;
  checkinVenueNotes: string | null;
  checkinInternalNotes: string | null;
  onChange: FieldChangeHandler;
}

/**
 * Props pour ValidationErrors
 */
export interface ValidationErrorsProps {
  errors: string[];
}

// ============================================
// TYPES HOOK
// ============================================

/**
 * État retourné par useEditReservation
 */
export interface UseEditReservationState {
  formData: UpdateReservationData | null;
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  slotsError: string | null;
  validationErrors: string[];
  isFormReady: boolean;
  notifOptions: NotificationOptions;
  setNotifOptions: (options: NotificationOptions) => void;
}

/**
 * Actions retournées par useEditReservation
 */
export interface UseEditReservationActions {
  handleChange: FieldChangeHandler;
  handleSubmit: () => Promise<void>;
  handleCancelReservation: () => void;
  handleOpenChange: (open: boolean) => void;
}

/**
 * Retour complet du hook useEditReservation
 */
export interface UseEditReservationReturn extends UseEditReservationState, UseEditReservationActions {}
