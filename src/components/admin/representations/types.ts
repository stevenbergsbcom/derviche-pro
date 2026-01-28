/**
 * Types pour les dialogs de représentations
 * Derviche Diffusion
 */

import type { SlotHostedBy, UserRole } from '@/types/database';

// ============================================
// RÉEXPORTS depuis types existants
// ============================================

// Réexporter les types communs pour éviter imports multiples
export type { SlotHostedBy, UserRole };

// ============================================
// TYPES MOCK (compatibilité composants)
// ============================================

/** Représentation pour les composants (format camelCase UI) */
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

/** Lieu pour les composants (format camelCase UI) */
export interface MockVenue {
  id: string;
  name: string;
  city: string;
}

/** Utilisateur pour les composants (format camelCase UI) */
export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

// ============================================
// TYPES GÉNÉRATION DE SÉRIE
// ============================================

/** Données de configuration pour générer une série de représentations */
export interface GenerateSeriesData {
  /** Date de début de la période (YYYY-MM-DD) */
  startDate: string;
  /** Date de fin de la période (YYYY-MM-DD) */
  endDate: string;
  /** Jours de la semaine actifs [Dim, Lun, Mar, Mer, Jeu, Ven, Sam] */
  weekDays: boolean[];
  /** Liste des horaires (HH:MM) */
  times: string[];
  /** Dates à exclure (YYYY-MM-DD) */
  excludedDates: string[];
  /** ID du lieu sélectionné */
  venueId: string;
  /** Capacité max (null si illimité) */
  capacity: number | null;
  /** Indique si la capacité est illimitée */
  isUnlimited: boolean;
  /** Type d'accueil */
  hostedBy: SlotHostedBy;
  /** ID de l'utilisateur qui accueille (si hostedBy === 'derviche') */
  hostedById: string | null;
  /** Inclure les doublons exacts dans la génération */
  includeExactDuplicates: boolean;
  /** Inclure les conflits (autre lieu, même horaire) */
  includeConflicts: boolean;
}

/** Statut d'une représentation générée */
export type GeneratedRepresentationStatus = 'ok' | 'exact_duplicate' | 'conflict';

/** Représentation générée (preview avant création) */
export interface GeneratedRepresentation {
  /** Date (YYYY-MM-DD) */
  date: string;
  /** Horaire (HH:MM) */
  time: string;
  /** ID du lieu */
  venueId: string;
  /** Nom du lieu (pour affichage) */
  venueName: string;
  /** Statut de la représentation */
  status: GeneratedRepresentationStatus;
}

// ============================================
// TYPES PROPS DES COMPOSANTS
// ============================================

/** Props pour le dialog de génération de série */
export interface GenerateSeriesDialogProps {
  /** Contrôle l'ouverture de la modale */
  open: boolean;
  /** Callback quand la modale se ferme */
  onOpenChange: (open: boolean) => void;
  /** Callback à la soumission (peut être async) */
  onSubmit: (data: GenerateSeriesData, representationsToCreate: GeneratedRepresentation[]) => void | Promise<void>;
  /** Liste des lieux disponibles */
  venues: MockVenue[];
  /** Liste des utilisateurs Derviche */
  dervisheUsers: MockUser[];
  /** Représentations existantes (pour détecter les doublons) */
  existingRepresentations: MockRepresentation[];
  /** Callback pour ouvrir la modale de création de lieu */
  onOpenNewVenueDialog: () => void;
  /** ID du lieu nouvellement créé (pour auto-sélection) */
  newlyCreatedVenueId?: string | null;
  /** Callback pour reset l'ID du lieu nouvellement créé */
  onClearNewlyCreatedVenueId?: () => void;
}

/** Props pour la section période (dates début/fin) */
export interface PeriodSectionProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  minDate: string;
}

/** Props pour la section jours de la semaine */
export interface WeekDaysSectionProps {
  weekDays: boolean[];
  onWeekDayChange: (index: number, checked: boolean) => void;
}

/** Props pour la section horaires */
export interface TimesSectionProps {
  times: string[];
  onTimeChange: (index: number, value: string) => void;
  onAddTime: () => void;
  onRemoveTime: (index: number) => void;
}

/** Props pour la section dates exclues */
export interface ExcludedDatesSectionProps {
  excludedDates: string[];
  onExcludedDateChange: (index: number, value: string) => void;
  onAddExcludedDate: () => void;
  onRemoveExcludedDate: (index: number) => void;
}

/** Props pour la section lieu */
export interface VenueSectionProps {
  venueId: string;
  venues: MockVenue[];
  onVenueChange: (venueId: string) => void;
  onOpenNewVenueDialog: () => void;
}

/** Props pour la section capacité */
export interface CapacitySectionProps {
  capacity: number | null;
  isUnlimited: boolean;
  onCapacityChange: (value: number | null) => void;
  onUnlimitedChange: (checked: boolean) => void;
}

/** Props pour la section accueil */
export interface HostedBySectionProps {
  hostedBy: SlotHostedBy;
  hostedById: string | null;
  dervisheUsers: MockUser[];
  onHostedByChange: (value: SlotHostedBy) => void;
  onHostedByIdChange: (value: string | null) => void;
}

/** Props pour la bannière d'alerte */
export interface AlertBannerProps {
  /** Variante visuelle */
  variant: 'error' | 'warning';
  /** Titre de l'alerte */
  title: string;
  /** Label de la checkbox */
  checkboxLabel: string;
  /** ID de la checkbox pour l'accessibilité */
  checkboxId: string;
  /** État de la checkbox */
  checked: boolean;
  /** Callback changement checkbox */
  onCheckedChange: (checked: boolean) => void;
}

/** Props pour la section aperçu */
export interface PreviewSectionProps {
  /** Représentations générées */
  generatedRepresentations: GeneratedRepresentation[];
  /** Nombre de doublons exacts */
  exactDuplicatesCount: number;
  /** Nombre de conflits */
  conflictsCount: number;
  /** Inclure les doublons */
  includeExactDuplicates: boolean;
  /** Inclure les conflits */
  includeConflicts: boolean;
  /** Callback changement inclusion doublons */
  onIncludeExactDuplicatesChange: (checked: boolean) => void;
  /** Callback changement inclusion conflits */
  onIncludeConflictsChange: (checked: boolean) => void;
}

// ============================================
// TYPE RETOUR DU HOOK
// ============================================

/** Retour du hook useGenerateSeriesDialog */
export interface UseGenerateSeriesDialogReturn {
  // État
  seriesData: GenerateSeriesData;
  isExpanded: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Données calculées
  generatedRepresentations: GeneratedRepresentation[];
  representationsToCreate: GeneratedRepresentation[];
  exactDuplicatesCount: number;
  conflictsCount: number;
  isValid: boolean;
  
  // Handlers état
  setIsExpanded: (expanded: boolean) => void;
  
  // Handlers données série
  updateSeriesData: (updates: Partial<GenerateSeriesData>) => void;
  setWeekDay: (index: number, checked: boolean) => void;
  
  // Handlers horaires
  addTime: () => void;
  removeTime: (index: number) => void;
  updateTime: (index: number, value: string) => void;
  
  // Handlers dates exclues
  addExcludedDate: () => void;
  removeExcludedDate: (index: number) => void;
  updateExcludedDate: (index: number, value: string) => void;
  
  // Actions
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
}
