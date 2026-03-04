/**
 * Types - TransferSlotDrawer
 * Derviche Diffusion
 */

import type { ReservationRowData } from '../ReservationRow';
import type { TransferTargetSlot } from '@/lib/services/checkin';
import type { NotificationOptions } from '@/components/admin/reservations/notification-switches';

// ============================================
// PROPS DU DRAWER PRINCIPAL
// ============================================

export interface TransferSlotDrawerProps {
  /** Réservation à transférer */
  reservation: ReservationRowData | null;
  /** ID du créneau actuel (avant transfert) — utilisé pour l'email de modification */
  currentSlotId: string;
  /** État d'ouverture */
  open: boolean;
  /** Handler de changement d'état */
  onOpenChange: (open: boolean) => void;
  /** Callback après transfert réussi */
  onSuccess: (updatedReservation: ReservationRowData) => void;
}

// ============================================
// PROPS DES COMPOSANTS INTERNES
// ============================================

export interface SlotItemProps {
  slot: TransferTargetSlot;
  isSelected: boolean;
  onSelect: () => void;
  numPlaces: number;
  disabled: boolean;
}

export interface DrawerHeaderProps {
  displayName: string;
  numPlaces: number;
}

export interface PlacesSelectorProps {
  numPlaces: number;
  originalNumPlaces: number;
  isSubmitting: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface SlotsListProps {
  slots: TransferTargetSlot[];
  selectedSlotId: string | null;
  numPlaces: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSelectSlot: (slotId: string | null) => void;
}

export interface TransferFooterProps {
  selectedSlot: TransferTargetSlot | undefined;
  numPlaces: number;
  canTransfer: boolean;
  wouldOverbook: boolean;
  isSubmitting: boolean;
  onTransfer: () => Promise<void>;
  /** Options de notification pour le transfert */
  notifOptions: NotificationOptions;
  onNotifChange: (options: NotificationOptions) => void;
  /** Un événement Google Calendar existe-t-il pour cette réservation ? */
  hasCalendarEvent?: boolean;
}

// ============================================
// RETURN TYPE DU HOOK
// ============================================

export interface UseTransferSlotReturn {
  // États
  slots: TransferTargetSlot[];
  selectedSlotId: string | null;
  numPlaces: number;
  isLoadingSlots: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Computed
  displayName: string;
  selectedSlot: TransferTargetSlot | undefined;
  wouldOverbook: boolean;
  canTransfer: boolean;
  
  // Setters
  setSelectedSlotId: (slotId: string | null) => void;
  
  // Handlers
  handleDecrease: () => void;
  handleIncrease: () => void;
  handleNumPlacesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTransfer: () => Promise<void>;

  // Notification
  notifOptions: NotificationOptions;
  setNotifOptions: (options: NotificationOptions) => void;
  hasCalendarEvent: boolean;
}
