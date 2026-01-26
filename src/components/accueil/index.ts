/**
 * Composants Accueil - Export centralisé
 * Derviche Diffusion
 */

// StatusBadge
export { 
  StatusBadge, 
  isPresent 
} from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';

// SlotCard
export { SlotCard, SlotCardSkeleton } from './SlotCard';
export type { SlotCardProps } from './SlotCard';

// ReservationRow
export { 
  ReservationRow, 
  ReservationRowSkeleton, 
  EmptyReservations 
} from './ReservationRow';
export type { ReservationRowData, ReservationRowProps } from './ReservationRow';

// CheckinDrawer (refactorisé en dossier)
export { CheckinDrawer } from './checkin-drawer';
export type { CheckinDrawerProps } from './checkin-drawer';

// AddReservationDrawer
export { AddReservationDrawer } from './AddReservationDrawer';
export type { AddReservationDrawerProps } from './AddReservationDrawer';

// TransferSlotDrawer
export { TransferSlotDrawer } from './TransferSlotDrawer';
export type { TransferSlotDrawerProps } from './TransferSlotDrawer';
