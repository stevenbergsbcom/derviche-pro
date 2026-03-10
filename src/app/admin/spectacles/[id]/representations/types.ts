/**
 * Types locaux pour la page des représentations
 * Compatibilité avec les composants existants
 */

import type { UserRole, SlotHostedBy } from '@/types/database';

// ============================================
// TYPES DE DONNÉES
// ============================================

/** Représentation pour les composants (format Mock) */
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

/** Lieu pour les composants (format Mock) */
export interface MockVenue {
  id: string;
  name: string;
  city: string;
}

/** Utilisateur pour les composants (format Mock) */
export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

/** Spectacle enrichi avec company */
export interface EnrichedShow {
  id: string;
  title: string;
  company?: {
    name: string;
  };
  company_name: string;
}

// ============================================
// TYPES POUR LES PROPS DES COMPOSANTS
// ============================================

/** Props pour RepresentationFilters */
export interface RepresentationFiltersProps {
  /** Nombre de représentations filtrées */
  filteredCount: number;
  /** Nombre total de représentations */
  totalCount: number;
  /** Indique si des filtres sont actifs */
  hasActiveFilters: boolean;
  /** Fonction pour réinitialiser les filtres */
  onResetFilters: () => void;
  /** Filtre par mois sélectionné */
  monthFilter: string;
  /** Callback pour changer le filtre mois */
  onMonthFilterChange: (value: string) => void;
  /** Liste des mois disponibles */
  availableMonths: string[];
  /** Filtre par lieu sélectionné */
  venueFilter: string;
  /** Callback pour changer le filtre lieu */
  onVenueFilterChange: (value: string) => void;
  /** Liste des lieux utilisés */
  usedVenues: MockVenue[];
  /** Recherche par date */
  dateSearch: string;
  /** Callback pour changer la recherche */
  onDateSearchChange: (value: string) => void;
  /** Direction du tri par date */
  sortDir: 'asc' | 'desc';
  /** Callback pour changer le sens du tri */
  onSortDirChange: (dir: 'asc' | 'desc') => void;
  /** Masquer les représentations passées */
  hidePast: boolean;
  /** Callback pour afficher/masquer les passées */
  onHidePastChange: (hide: boolean) => void;
  /** Nombre de représentations passées */
  pastCount: number;
}

/** Props pour RepresentationTableRow */
export interface RepresentationTableRowProps {
  /** La représentation à afficher */
  representation: MockRepresentation;
  /** Liste des utilisateurs internes pour afficher le nom de l'hôte */
  internalUsers: MockUser[];
  /** Indique si l'utilisateur est externe (lecture seule) */
  isExterne: boolean;
  /** Callback pour éditer */
  onEdit: (rep: MockRepresentation) => void;
  /** Callback pour supprimer */
  onDelete: (rep: MockRepresentation) => void;
  /** Indique si une action est en cours */
  isSubmitting: boolean;
  /** Indique si la représentation est dans le passé */
  isPast: boolean;
}

/** Props pour RepresentationCard (mobile) */
export interface RepresentationCardProps {
  /** La représentation à afficher */
  representation: MockRepresentation;
  /** Liste des utilisateurs internes pour afficher le nom de l'hôte */
  internalUsers: MockUser[];
  /** Indique si l'utilisateur est externe (lecture seule) */
  isExterne: boolean;
  /** Callback pour éditer */
  onEdit: (rep: MockRepresentation) => void;
  /** Callback pour supprimer */
  onDelete: (rep: MockRepresentation) => void;
  /** Indique si une action est en cours */
  isSubmitting: boolean;
  /** Indique si la représentation est dans le passé */
  isPast: boolean;
}

/** Props pour HostedByBadge */
export interface HostedByBadgeProps {
  /** Type d'accueil ('derviche', 'company' ou 'externe') */
  hostedBy: SlotHostedBy;
  /** ID de l'utilisateur hôte */
  hostedById: string | null;
  /** Liste des utilisateurs internes */
  internalUsers: MockUser[];
}

/** Props pour CapacityDisplay */
export interface CapacityDisplayProps {
  /** Nombre de places réservées */
  booked: number;
  /** Capacité totale (null = illimité) */
  capacity: number | null;
  /** Affichage compact (sans barre de progression) */
  compact?: boolean;
}

// ============================================
// TYPES POUR LE HOOK
// ============================================

/** État du hook useRepresentationsPage */
export interface RepresentationsPageState {
  // Données
  show: EnrichedShow | null;
  representations: MockRepresentation[];
  venues: MockVenue[];
  internalUsers: MockUser[];
  
  // Filtres
  monthFilter: string;
  venueFilter: string;
  dateSearch: string;
  availableMonths: string[];
  usedVenues: MockVenue[];
  filteredRepresentations: MockRepresentation[];
  hasActiveFilters: boolean;

  // Tri & masquage des passées
  sortDir: 'asc' | 'desc';
  hidePast: boolean;
  pastCount: number;
  
  // États UI
  isLoading: boolean;
  loadingError: string | null;
  hasLoaded: boolean;
  isExterne: boolean;
  
  // Modales
  isFormDialogOpen: boolean;
  editingRepresentation: MockRepresentation | null;
  editingReservationsCount: number;
  representationToDelete: MockRepresentation | null;
  deleteReservationsCount: number;
  deleteError: string | null;
  isNewVenueDialogOpen: boolean;
  newVenueSource: 'simple' | 'series';
  isGenerateSeriesOpen: boolean;
  newlyCreatedVenueId: string | null;
  isSubmitting: boolean;
}

/** Actions du hook useRepresentationsPage */
export interface RepresentationsPageActions {
  // Filtres
  setMonthFilter: (value: string) => void;
  setVenueFilter: (value: string) => void;
  setDateSearch: (value: string) => void;
  resetFilters: () => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  setHidePast: (hide: boolean) => void;
  
  // Modales
  setIsFormDialogOpen: (open: boolean) => void;
  setIsGenerateSeriesOpen: (open: boolean) => void;
  setIsNewVenueDialogOpen: (open: boolean) => void;
  clearEditingState: () => void;
  clearDeleteState: () => void;
  clearNewlyCreatedVenueId: () => void;
  
  // Handlers CRUD
  handleCreate: () => void;
  handleEdit: (rep: MockRepresentation) => Promise<void>;
  handleDeleteClick: (rep: MockRepresentation) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  handleFormSubmit: (formData: import('@/components/admin/representations').RepresentationFormData, isEditing: boolean) => Promise<void>;
  handleGenerateSeriesSubmit: (data: import('@/components/admin/representations').GenerateSeriesData, repsToCreate: import('@/components/admin/representations').GeneratedRepresentation[]) => Promise<void>;
  
  // Venues
  handleOpenNewVenueDialog: (source: 'simple' | 'series') => void;
  handleCreateVenue: (data: { name: string; city: string }) => Promise<string>;
  handleVenueCreated: (venueId: string) => void;
  
  // Refresh
  refreshAllData: () => Promise<void>;
}
