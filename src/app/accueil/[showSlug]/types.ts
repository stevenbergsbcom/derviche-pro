/**
 * Types locaux - Page Représentations d'un spectacle
 * Derviche Diffusion
 */

import type { CheckinSlot } from '@/lib/services/checkin';

// ============================================
// TYPES FILTRAGE
// ============================================

/** Onglet de filtrage actif */
export type TabFilter = 'upcoming' | 'past';

// ============================================
// TYPES PROPS COMPOSANTS
// ============================================

/** Props TabFilters */
export interface TabFiltersProps {
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  upcomingCount: number;
  pastCount: number;
}

/** Props ShowHeader */
export interface ShowHeaderProps {
  title: string;
  slotsCount: number;
  isLoading: boolean;
  activeTab: TabFilter;
  showFullHistory: boolean;
  pastDaysLimit: number;
}

/** Props EmptyState */
export interface EmptyStateProps {
  activeTab: TabFilter;
}

/** Props ErrorState */
export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** Props DateSection */
export interface DateSectionProps {
  date: string;
  slots: CheckinSlot[];
  onSlotClick: (slotId: string) => void;
  isPast?: boolean;
}

/** Props LoadingOverlay */
export interface LoadingOverlayProps {
  isVisible: boolean;
}

// ============================================
// TYPES HOOK
// ============================================

/** Retour du hook useShowSlots */
export interface UseShowSlotsReturn {
  // États
  activeTab: TabFilter;
  showFullHistory: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Données
  showTitle: string;
  displayedSlots: CheckinSlot[];
  upcomingSlots: CheckinSlot[];
  pastSlots: CheckinSlot[];
  todaySlots: CheckinSlot[] | undefined;
  otherDates: [string, CheckinSlot[]][];
  hasSlots: boolean;
  
  // Handlers
  setActiveTab: (tab: TabFilter) => void;
  handleRefresh: () => void;
  handleLoadFullHistory: () => Promise<void>;
  handleSlotClick: (slotId: string) => void;
}
