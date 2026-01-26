/**
 * Types locaux pour la page Slot Details
 * Derviche Diffusion
 */

import type { CheckinReservation } from '@/lib/services/checkin';
import type { ReservationRowData } from '@/components/accueil';

/**
 * Informations d'un slot pour l'affichage
 */
export interface SlotInfo {
  id: string;
  date: string;
  time: string;
  venueName: string;
  venueCity: string;
  showTitle: string;
  showSlug: string;
  capacity: number;
}

/**
 * Props du hook useSlotDetails
 */
export interface UseSlotDetailsProps {
  slotId: string;
  showSlug: string;
}

/**
 * Retour du hook useSlotDetails
 */
export interface UseSlotDetailsReturn {
  // Données
  slotInfo: SlotInfo | null;
  reservations: CheckinReservation[];
  filteredReservations: CheckinReservation[];
  
  // États
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Compteurs
  confirmedCount: number;
  presentCount: number;
  
  // Drawer check-in
  drawerOpen: boolean;
  selectedReservation: ReservationRowData | null;
  setDrawerOpen: (open: boolean) => void;
  
  // Drawer ajout
  addDrawerOpen: boolean;
  setAddDrawerOpen: (open: boolean) => void;
  
  // Drawer transfert
  transferDrawerOpen: boolean;
  setTransferDrawerOpen: (open: boolean) => void;
  
  // Handlers
  setSearchQuery: (query: string) => void;
  handleRefresh: () => void;
  handleReservationClick: (reservation: CheckinReservation) => void;
  handleCheckinSuccess: (updatedReservation: ReservationRowData) => void;
  handleAddReservation: () => void;
  handleAddSuccess: () => void;
  handleTransferClick: () => void;
  handleTransferSuccess: (updatedReservation: ReservationRowData) => void;
}
