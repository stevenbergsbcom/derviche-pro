/**
 * Types locaux - CheckinDrawer
 * Derviche Diffusion
 */

import type { CheckinStatus } from '@/types/database';
import type { ReservationRowData } from '../ReservationRow';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// ============================================
// PROPS DU COMPOSANT PRINCIPAL
// ============================================

export interface CheckinDrawerProps {
  /** Réservation à pointer */
  reservation: ReservationRowData | null;
  /** État d'ouverture */
  open: boolean;
  /** Handler de changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Callback après sauvegarde réussie */
  onSuccess: (updatedReservation: ReservationRowData) => void;
  /** Callback pour ouvrir le drawer de transfert (optionnel) */
  onTransferClick?: () => void;
}

// ============================================
// CONFIGURATION DES BOUTONS DE STATUT
// ============================================

export interface StatusButtonConfig {
  status: CheckinStatus;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  activeColor: string;
}

// ============================================
// ÉTAT DU FORMULAIRE GUEST
// ============================================

export interface GuestFormState {
  firstName: string;
  lastName: string;
  email: string;
  emailSecondary: string;
  phone: string;
  phoneSecondary: string;
  structure: string;
  function: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  afcNumber: string;
  specialRequests: string;
}

// ============================================
// ÉTAT DU CHECK-IN
// ============================================

export interface CheckinFormState {
  selectedStatus: CheckinStatus | null;
  comment: string;
  venueNotes: string;
  internalNotes: string;
}

// ============================================
// ÉTAT UI
// ============================================

export interface DrawerUIState {
  isSubmitting: boolean;
  detailsOpen: boolean;
  justReactivated: boolean;
  localStatus: 'confirmed' | 'cancelled' | 'no_show';
}

// ============================================
// RETOUR DU HOOK useCheckinDrawer
// ============================================

export interface UseCheckinDrawerReturn {
  // États
  guestForm: GuestFormState;
  checkinForm: CheckinFormState;
  uiState: DrawerUIState;
  
  // Setters guest
  setGuestFirstName: (value: string) => void;
  setGuestLastName: (value: string) => void;
  setGuestEmail: (value: string) => void;
  setGuestEmailSecondary: (value: string) => void;
  setGuestPhone: (value: string) => void;
  setGuestPhoneSecondary: (value: string) => void;
  setGuestStructure: (value: string) => void;
  setGuestFunction: (value: string) => void;
  setGuestAddress: (value: string) => void;
  setGuestPostalCode: (value: string) => void;
  setGuestCity: (value: string) => void;
  setGuestCountry: (value: string) => void;
  setGuestAfcNumber: (value: string) => void;
  setSpecialRequests: (value: string) => void;
  
  // Setters check-in
  setSelectedStatus: (status: CheckinStatus | null) => void;
  setComment: (value: string) => void;
  setVenueNotes: (value: string) => void;
  setInternalNotes: (value: string) => void;
  
  // Setters UI
  setDetailsOpen: (open: boolean) => void;
  
  // Handlers
  handleSave: () => Promise<void>;
  handleReactivate: () => Promise<void>;
  handleCancel: (notifOptions: NotificationOptions) => Promise<boolean>;

  // Modale de confirmation d'annulation
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  handleCancelClick: () => void;
  
  // Computed
  displayName: string;
  hasChanges: boolean;
  canSave: boolean;
  isCancelled: boolean;
  isAdmin: boolean;
  accessLoading: boolean;

  // Options de notification (réactivation uniquement — annulation gérée par la modale)
  reactivateNotifOptions: NotificationOptions;
  setReactivateNotifOptions: (options: NotificationOptions) => void;
  /** Un événement Google Calendar existe-t-il pour cette réservation ? */
  hasCalendarEvent: boolean;
}
