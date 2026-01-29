/**
 * Types pour RepresentationFormDialog
 * Derviche Diffusion - Session 103
 */

import type { SlotHostedBy, UserRole } from '@/types/database';

// ============================================
// RÉEXPORTS
// ============================================

export type { SlotHostedBy };

// ============================================
// TYPES LOCAUX (compatibilité composants)
// ============================================

/**
 * Représentation pour les composants
 * @note Type Mock pour compatibilité avec les données transformées
 */
export interface MockRepresentation {
  id: string;
  showId: string;
  showTitle: string;
  companyName: string;
  date: string;
  time: string;
  venueId: string;
  venueName: string;
  capacity: number | null;
  booked: number;
  hostedBy: SlotHostedBy;
  hostedById: string | null;
}

/**
 * Lieu pour les composants
 * @note Type Mock pour compatibilité avec les données transformées
 */
export interface MockVenue {
  id: string;
  name: string;
  city: string;
}

/**
 * Utilisateur pour les composants
 * @note Type Mock pour compatibilité avec les données transformées
 */
export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

// ============================================
// TYPES FORMULAIRE
// ============================================

/**
 * Données du formulaire de représentation
 */
export interface RepresentationFormData {
  date: string;
  time: string;
  venueId: string;
  capacity: number | null;
  hostedBy: SlotHostedBy;
  hostedById: string | null;
}

// ============================================
// PROPS DU DIALOG PRINCIPAL
// ============================================

/**
 * Props du composant RepresentationFormDialog
 */
export interface RepresentationFormDialogProps {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Callback quand la modale se ferme */
  onOpenChange: (open: boolean) => void;
  /** Représentation en cours d'édition (null = mode création) */
  editingRepresentation: MockRepresentation | null;
  /** Callback à la soumission du formulaire (peut être async) */
  onSubmit: (data: RepresentationFormData, isEditing: boolean) => void | Promise<void>;
  /** Liste des lieux disponibles */
  venues: MockVenue[];
  /** Liste des utilisateurs Derviche */
  dervisheUsers: MockUser[];
  /** Callback pour ouvrir la modale de création de lieu */
  onOpenNewVenueDialog: () => void;
  /** ID du lieu nouvellement créé (pour auto-sélection) */
  newlyCreatedVenueId?: string | null;
  /** Callback pour reset l'ID du lieu nouvellement créé */
  onClearNewlyCreatedVenueId?: () => void;
  /** Indique si la représentation a des réservations (bloque modification date/heure) */
  hasReservations?: boolean;
}

// ============================================
// PROPS DES SOUS-COMPOSANTS
// ============================================

/**
 * Props pour les champs date/heure
 */
export interface DateTimeFieldsProps {
  /** Date sélectionnée */
  date: string;
  /** Heure sélectionnée */
  time: string;
  /** Callback de changement de date */
  onDateChange: (date: string) => void;
  /** Callback de changement d'heure */
  onTimeChange: (time: string) => void;
  /** Date minimum (mode création) */
  minDate?: string;
  /** Désactiver les champs (si réservations existantes) */
  disabled: boolean;
  /** Mode édition */
  isEditing: boolean;
}

/**
 * Props pour le sélecteur de lieu
 */
export interface VenueSelectorProps {
  /** ID du lieu sélectionné */
  venueId: string;
  /** Liste des lieux disponibles */
  venues: MockVenue[];
  /** Callback de changement */
  onChange: (venueId: string) => void;
  /** Callback pour créer un nouveau lieu */
  onCreateNew: () => void;
}

/**
 * Props pour le champ capacité
 */
export interface CapacityFieldProps {
  /** Capacité (null = illimité) */
  capacity: number | null;
  /** Indique si la capacité est illimitée */
  isUnlimited: boolean;
  /** Callback de changement de capacité */
  onCapacityChange: (capacity: number) => void;
  /** Callback de changement du mode illimité */
  onUnlimitedChange: (isUnlimited: boolean) => void;
}

/**
 * Props pour les champs d'accueil
 */
export interface HostingFieldsProps {
  /** Type d'accueil */
  hostedBy: SlotHostedBy;
  /** ID de l'utilisateur accueillant */
  hostedById: string | null;
  /** Liste des utilisateurs Derviche */
  dervisheUsers: MockUser[];
  /** Callback de changement du type d'accueil */
  onHostedByChange: (hostedBy: SlotHostedBy) => void;
  /** Callback de changement de l'utilisateur */
  onHostedByIdChange: (hostedById: string | null) => void;
}

/**
 * Props pour la bannière d'avertissement réservations
 */
export interface ReservationsWarningProps {
  /** Afficher l'avertissement */
  show: boolean;
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
 * Retour du hook useRepresentationForm
 */
export interface UseRepresentationFormReturn {
  // Mode
  isEditing: boolean;

  // États du formulaire
  formData: RepresentationFormData;
  isUnlimited: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Calculs dérivés
  isValid: boolean;
  minDate: string;
  isDateTimeDisabled: boolean;

  // Handlers
  handleDateChange: (date: string) => void;
  handleTimeChange: (time: string) => void;
  handleVenueChange: (venueId: string) => void;
  handleCapacityChange: (capacity: number) => void;
  handleUnlimitedChange: (isUnlimited: boolean) => void;
  handleHostedByChange: (hostedBy: SlotHostedBy) => void;
  handleHostedByIdChange: (hostedById: string | null) => void;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
}
