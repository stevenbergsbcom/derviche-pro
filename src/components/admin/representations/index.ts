/**
 * Exports composants de gestion des représentations
 * Derviche Diffusion
 */

// ============================================
// DIALOGS
// ============================================

export { VenueQuickCreateDialog } from './venue-quick-create-dialog';
export type { VenueQuickCreateDialogProps } from './venue-quick-create-dialog';

export { RepresentationFormDialog } from './representation-form-dialog';
export type { RepresentationFormDialogProps, RepresentationFormData } from './representation-form-dialog';

export { GenerateSeriesDialog } from './generate-series-dialog';
export type { 
  GenerateSeriesDialogProps, 
  GenerateSeriesData, 
  GeneratedRepresentation,
} from './types';

// ============================================
// TYPES (pour usage externe)
// ============================================

export type {
  MockRepresentation,
  MockVenue,
  MockUser,
  GeneratedRepresentationStatus,
} from './types';

// ============================================
// SOUS-COMPOSANTS (pour réutilisation si besoin)
// ============================================

export {
  AlertBanner,
  PeriodSection,
  WeekDaysSection,
  TimesSection,
  ExcludedDatesSection,
  VenueSection,
  CapacitySection,
  HostedBySection,
  PreviewSection,
} from './components';

// ============================================
// HOOKS (pour usage externe si besoin)
// ============================================

export { useGenerateSeriesDialog } from './hooks';

// ============================================
// UTILITAIRES (pour réutilisation)
// ============================================

export { getLocalDateString, formatDateFr, parseDateAtNoon } from './utils';
export { 
  WEEK_DAY_LABELS, 
  WEEK_DAY_LABELS_FULL, 
  MONTH_NAMES,
  DEFAULT_SERIES_DATA,
  DEFAULT_TIME,
  DEFAULT_CAPACITY,
} from './constants';
