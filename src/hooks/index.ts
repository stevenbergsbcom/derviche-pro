/**
 * Index des hooks personnalisés
 * Derviche Diffusion
 */

// Hooks Supabase - Admin
export { useVenues } from './useVenues';
export type { UseVenuesReturn } from './useVenues';

export { useCompanies } from './useCompanies';
export type { UseCompaniesReturn } from './useCompanies';

export { useShows } from './useShows';
export type { UseShowsReturn } from './useShows';

export { useCategories } from './useCategories';
export type { UseCategoriesReturn } from './useCategories';

export { useTargetAudiences } from './useTargetAudiences';
export type { UseTargetAudiencesReturn } from './useTargetAudiences';

export { useInternalUsers, formatUserName, formatUserNameShort, translateRole } from './useInternalUsers';
export type { UseInternalUsersReturn, CreateUserData, UpdateUserData, OperationResult } from './useInternalUsers';

export { useRepresentations } from './useRepresentations';
export type { UseRepresentationsReturn } from './useRepresentations';

export { useAdminReservations } from './useAdminReservations';
export type { UseAdminReservationsReturn } from './useAdminReservations';

export { 
  useUserPreference, 
  useReservationColumnsPreference,
  RESERVATION_COLUMNS_CONFIG,
  DEFAULT_VISIBLE_COLUMNS,
} from './useUserPreferences';
export type { 
  UseUserPreferenceReturn, 
  ReservationColumn,
  ReservationColumnsPreference,
} from './useUserPreferences';

// Hooks Supabase - Public
export { usePublicCatalog } from './usePublicCatalog';
export type { UsePublicCatalogReturn } from './usePublicCatalog';

export { usePublicShow } from './usePublicShow';
export type { UsePublicShowReturn } from './usePublicShow';

export { useCurrentUserRole } from './useCurrentUserRole';
export type { UserRole } from './useCurrentUserRole';

// Hooks Supabase - Company (interface compagnie)
export { useCompanyDashboard } from './useCompanyDashboard';
export { useCompanyShows } from './useCompanyShows';

// Hooks Supabase - Accueil (check-in)
export { useCheckinAccess } from './useCheckinAccess';
export type { UseCheckinAccessReturn } from './useCheckinAccess';

// Réexports depuis le service checkin pour faciliter l'accès
export { 
  DEFAULT_PAST_DAYS_LIMIT,
  type GetSlotsOptions,
} from '@/lib/services/checkin';

// Hooks Supabase - Dashboard Admin
export { useUserFirstName } from './useUserFirstName';

// Hooks Utilitaires
export { useDebounce, useDebounceCallback, useDebounceState } from './useDebounce';
export type { DebouncedFunction, UseDebounceStateReturn } from './useDebounce';

// Hooks Préférences (App Settings)
export {
  useOrganizationSettings,
  useEmailSettings,
  useReminderSettings,
  useRgpdSettings,
  useThemeSettings,
} from './app-settings';
export type { UseAppSettingsReturn } from './app-settings';

// Hooks UX
export { useUnsavedChangesWarning } from './useUnsavedChangesWarning';

// Hooks Professionnel
export { useProReservations } from './useProReservations';
export type { UseProReservationsResult } from './useProReservations';

export { useGuestReservationsClaim } from './useGuestReservationsClaim';
export type { UseGuestReservationsClaimResult } from './useGuestReservationsClaim';
