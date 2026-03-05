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

// CheckinDrawer (refactorisé en dossier - Session 81)
export { CheckinDrawer } from './checkin-drawer';
export type { CheckinDrawerProps } from './checkin-drawer';

// AddReservationDrawer (refactorisé en dossier - Session 82)
export { AddReservationDrawer } from './add-reservation-drawer';
export type { AddReservationDrawerProps } from './add-reservation-drawer';

// TransferSlotDrawer (refactorisé en dossier - Session 83)
export { TransferSlotDrawer } from './transfer-slot-drawer';
export type { TransferSlotDrawerProps } from './transfer-slot-drawer';

// WalkInDrawer + WalkInFAB (Session 140)
export { WalkInDrawer } from './walkin-drawer';
export type { WalkInDrawerProps } from './walkin-drawer';
export { WalkInFAB } from './WalkInFAB';
