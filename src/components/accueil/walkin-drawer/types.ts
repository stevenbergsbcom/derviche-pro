/**
 * Types locaux - WalkInDrawer
 * Derviche Diffusion
 *
 * Formulaire de création de réservation on-the-spot depuis la PWA d'accueil.
 */

import type { CheckinStatus } from '@/types/database';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// ============================================
// ÉTAPES DU DRAWER
// ============================================

/** Les deux étapes du formulaire walk-in */
export type WalkInStep = 'email-search' | 'form';

// ============================================
// PROFIL TROUVÉ
// ============================================

/** Profil professionnel retourné par GET /api/pwa/search-professional */
export interface FoundProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organization: string | null;
  phone: string | null;
  phone2: string | null;
  email2: string | null;
  afcNumber: string | null;
  function: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
}

// ============================================
// DONNÉES DU FORMULAIRE
// ============================================

/** Toutes les données saisies dans le formulaire walk-in */
export interface WalkInFormData {
  // Créneau (pré-rempli selon contexte URL, modifiable)
  showId: string;
  slotId: string;

  // Identité du professionnel
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailSecondary: string;
  phoneSecondary: string;
  organization: string;
  function: string;
  afcNumber: string;
  address: string;
  postalCode: string;
  city: string;

  // Réservation
  numPlaces: number;
  specialRequests: string;
  checkinVenueNotes: string;
  checkinInternalNotes: string;

  // Check-in optionnel à la création
  checkinStatus: CheckinStatus | null;

  // Notifications
  sendEmail: boolean;
  syncCalendar: boolean;

  // Override capacité (si créneau plein)
  overrideCapacity: boolean;
}

// ============================================
// AVERTISSEMENT CAPACITÉ
// ============================================

/** Retourné par l'API quand le créneau est plein */
export interface CapacityWarning {
  remaining: number;
  requested: number;
}

// ============================================
// CRÉNEAU DISPONIBLE (pour le select)
// ============================================

export interface SlotOption {
  id: string;
  date: string;
  time: string;
  remainingCapacity: number;
  venueName: string;
}

// ============================================
// SPECTACLE DISPONIBLE (pour le select)
// ============================================

export interface ShowOption {
  id: string;
  title: string;
  slug: string;
}

// ============================================
// PROPS DU COMPOSANT PRINCIPAL
// ============================================

export interface WalkInDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** showId pré-rempli selon l'URL courante (optionnel) */
  defaultShowId?: string;
  /** showSlug depuis l'URL — résolu en showId dès que les spectacles sont chargés */
  defaultShowSlug?: string;
  /** slotId pré-rempli selon l'URL courante (optionnel) */
  defaultSlotId?: string;
  /** Callback après création réussie */
  onSuccess?: (reservationId: string) => void;
}

// ============================================
// RETOUR DU HOOK useWalkInReservation
// ============================================

export interface UseWalkInReservationReturn {
  // Étape courante
  step: WalkInStep;

  // Recherche email
  searchEmail: string;
  setSearchEmail: (email: string) => void;
  isSearching: boolean;
  foundProfile: FoundProfile | null;
  searchDone: boolean;
  handleEmailSearch: () => Promise<void>;

  // Formulaire
  formData: WalkInFormData;
  setFormField: <K extends keyof WalkInFormData>(field: K, value: WalkInFormData[K]) => void;

  // Spectacles + créneaux
  shows: ShowOption[];
  loadingShows: boolean;
  slots: SlotOption[];
  loadingSlots: boolean;
  handleShowChange: (showId: string) => Promise<void>;

  // Capacité
  capacityWarning: CapacityWarning | null;
  clearCapacityWarning: () => void;

  // Soumission
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: () => Promise<void>;

  // Notifications
  notifOptions: NotificationOptions;
  setNotifOptions: (options: NotificationOptions) => void;

  // Navigation
  goToForm: () => void;
  goBack: () => void;
  reset: () => void;
}
