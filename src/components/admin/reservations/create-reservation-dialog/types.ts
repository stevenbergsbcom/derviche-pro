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
  /**
   * True si la date/heure du slot est déjà passée. Sert à afficher un
   * badge "passée" dans le sélecteur quand l'option "inclure les
   * représentations passées" est cochée.
   */
  isPast: boolean;
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
 * Options du chargement des créneaux
 */
export interface GetSlotsOptions {
  /**
   * Inclut les représentations passées (dates < aujourd'hui).
   * Réservé aux rôles super-admin/admin — vérifié côté service.
   */
  includePast?: boolean;
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
  /**
   * Avertissement non-bloquant (Session B + retour audit Cursor) :
   * la résa a été créée mais un side-effet a échoué (typiquement l'écriture
   * de `reservations.crm_id` / `reservations.crm_structure_id`). À surfacer
   * via un toast warning pour que l'admin sache que tout n'a pas été persisté.
   */
  warning?: string;
}

/**
 * Props du composant principal
 */
export interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shows: ShowOption[];
  onGetSlots: (showId: string, options?: GetSlotsOptions) => Promise<SlotsResult>;
  /** _notifOptions est une propriété UI pass-through pour le contrôle des notifications */
  onCreate: (data: CreateAdminReservationData & { _notifOptions?: NotificationOptions }) => Promise<CreateResult>;
  /**
   * Rôle courant de l'utilisateur — sert à décider si la case
   * "Inclure représentations passées" est proposée.
   */
  currentUserRole?: string | null;
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
  /**
   * True si l'option "Inclure représentations passées" est disponible
   * (rôle super-admin ou admin). Contrôle l'affichage de la case à cocher.
   */
  canIncludePast?: boolean;
  /**
   * Valeur courante de la case à cocher "Inclure représentations passées".
   */
  includePast?: boolean;
  /**
   * Handler de bascule pour la case à cocher.
   */
  onIncludePastChange?: (value: boolean) => void;
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
  /** Migration 119 — ID CRM Zoho contact (S174). */
  crmId: string | null;
  /** Migration 122 — ID CRM Zoho structure (Session B). */
  crmStructureId: string | null;
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
