/**
 * Types pour la page Admin Professionnels
 * Derviche Diffusion
 */

import type { Professional, UpdateProfessionalData } from '@/hooks/useProfessionals';

// ============================================
// RÉEXPORTS
// ============================================

export type { Professional, UpdateProfessionalData };

// ============================================
// FILTRES
// ============================================

/** Filtre de statut */
export type StatusFilter = 'all' | 'active' | 'inactive';

/** État complet des filtres */
export interface ProfessionalsFiltersState {
  searchQuery: string;
  statusFilter: StatusFilter;
  cityFilter: string;
}

// ============================================
// ÉTATS UI
// ============================================

/** Onglets du drawer détail */
export type DrawerTab = 'info' | 'reservations';

/** État du drawer */
export interface DrawerState {
  isOpen: boolean;
  professional: Professional | null;
  activeTab: DrawerTab;
  isEditing: boolean;
}

// ============================================
// PROPS DES COMPOSANTS
// ============================================

/** Props pour ProfessionalsFilters */
export interface ProfessionalsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  availableCities: string[];
}

/** Props pour ProfessionalsTable */
export interface ProfessionalsTableProps {
  professionals: Professional[];
  hasFilters: boolean;
  isSubmitting: boolean;
  formatName: (p: Professional) => string;
  onView: (p: Professional) => void;
  onToggleStatus: (p: Professional) => void;
  onDelete: (p: Professional) => void;
}

/** Props pour ProfessionalDrawer */
export interface ProfessionalDrawerProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (p: Professional) => void;
  onDelete: (p: Professional) => void;
  onUpdate: (id: string, data: UpdateProfessionalData) => Promise<void>;
  isSubmitting: boolean;
}

/** Props pour ProfessionalEditForm */
export interface ProfessionalEditFormProps {
  professional: Professional;
  onSubmit: (data: UpdateProfessionalData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  formError: string | null;
}

/** Props pour ProfessionalReservations */
export interface ProfessionalReservationsProps {
  professionalId: string;
  professionalName: string;
}

// ============================================
// RETOUR DU HOOK PRINCIPAL
// ============================================

export interface UseProfessionalsPageReturn {
  // Données
  professionals: Professional[];
  filteredProfessionals: Professional[];
  availableCities: string[];
  isLoading: boolean;
  error: string | null;

  // Filtres
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  cityFilter: string;
  setCityFilter: (v: string) => void;
  hasFilters: boolean;

  // Drawer
  drawerState: DrawerState;
  openDrawer: (p: Professional) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: DrawerTab) => void;
  setDrawerEditing: (editing: boolean) => void;

  // Suppression
  professionalToDelete: Professional | null;
  deleteError: string | null;
  handleDeleteClick: (p: Professional) => void;
  handleConfirmDelete: () => Promise<void>;
  handleDeleteDialogChange: (open: boolean) => void;

  // Actions
  isSubmitting: boolean;
  formError: string | null;
  handleToggleStatus: (p: Professional) => Promise<void>;
  handleUpdate: (id: string, data: UpdateProfessionalData) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;

  // Formatage
  formatName: (p: Professional) => string;
  formatNameShort: (p: Professional) => string;
}
