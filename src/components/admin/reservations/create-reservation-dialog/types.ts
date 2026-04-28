/**
 * Types pour CreateReservationDialog
 * Derviche Diffusion - Session 104
 */

import type { CreateAdminReservationData } from '@/lib/services/admin-reservations';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// Réexport du type principal
export type { CreateAdminReservationData, NotificationOptions };

// ============================================
// TYPES LOCAUX
// ============================================

/**
 * Créneau disponible pour une réservation
 */
export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  venue: {
    id: string;
    name: string;
    city: string;
  } | null;
}

/**
 * Option de spectacle pour le select
 */
export interface ShowOption {
  id: string;
  title: string;
  status: string;
  max_reservations_per_booking: number;
}

/**
 * Résultat du chargement des créneaux
 */
export interface SlotsResult {
  success: boolean;
  data?: AvailableSlot[];
  error?: string;
}

/**
 * Résultat de la création d'une réservation
 */
export interface CreateResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

/**
 * Props du composant principal
 */
export interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shows: ShowOption[];
  onGetSlots: (showId: string) => Promise<SlotsResult>;
  /** _notifOptions est une propriété UI pass-through pour le contrôle des notifications */
  onCreate: (data: CreateAdminReservationData & { _notifOptions?: NotificationOptions }) => Promise<CreateResult>;
}

// ============================================
// TYPES POUR LES COMPOSANTS ENFANTS
// ============================================

/**
 * Props communes pour les sections de formulaire
 */
export interface FormSectionProps {
  disabled?: boolean;
}

/**
 * Handler de changement de champ
 */
export type FieldChangeHandler = <K extends keyof CreateAdminReservationData>(
  field: K,
  value: CreateAdminReservationData[K]
) => void;

/**
 * Props pour ValidationErrors
 */
export interface ValidationErrorsProps {
  errors: string[];
}

/**
 * Props pour ShowSlotSection
 */
export interface ShowSlotSectionProps extends FormSectionProps {
  selectedShowId: string;
  onShowChange: (showId: string) => void;
  publishedShows: ShowOption[];
  slotId: string;
  onSlotChange: (slotId: string) => void;
  loadingSlots: boolean;
  slotsError: string | null;
  availableSlots: AvailableSlot[];
  numPlaces: number;
  onNumPlacesChange: (num: number) => void;
  maxPlaces: number;
  /**
   * True si le slot sélectionné a une heure antérieure à maintenant.
   * Utilisé pour afficher un bandeau d'avertissement.
   */
  slotIsPast?: boolean;
}

/**
 * Props pour PersonalInfoSection
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
 * Props pour ProfessionalInfoSection
 */
export interface ProfessionalInfoSectionProps extends FormSectionProps {
  organization: string | null;
  function: string | null;
  afcNumber: string | null;
  onChange: FieldChangeHandler;
}

/**
 * Props pour AddressSection
 */
export interface AddressSectionProps extends FormSectionProps {
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  onChange: FieldChangeHandler;
}

/**
 * Props pour NotesSection
 */
export interface NotesSectionProps extends FormSectionProps {
  comment: string | null;
  checkinComment: string | null;
  checkinVenueNotes: string | null;
  checkinInternalNotes: string | null;
  onChange: FieldChangeHandler;
}
