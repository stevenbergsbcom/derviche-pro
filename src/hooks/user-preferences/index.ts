/**
 * Hooks de preferences utilisateur - Barrel exports
 * Derviche Diffusion
 */

// Types
export type {
  UseUserPreferenceReturn,
  ReservationColumn,
  ReservationColumnsPreference,
  ProfessionalColumn,
  CompanyReservationColumn,
  CompanyReservationColumnsPreference,
} from './types';

// Constants
export {
  RESERVATION_COLUMNS_CONFIG,
  DEFAULT_COLUMNS_ORDER,
  DEFAULT_VISIBLE_COLUMNS,
  DEFAULT_COLUMNS_PREFERENCE,
  PROFESSIONAL_COLUMNS_CONFIG,
  PROFESSIONAL_COLUMNS_ORDER,
  DEFAULT_PROFESSIONAL_VISIBLE_COLUMNS,
  COMPANY_RESERVATION_COLUMNS_CONFIG,
  DEFAULT_COMPANY_COLUMNS_ORDER,
  DEFAULT_COMPANY_VISIBLE_COLUMNS,
  DEFAULT_COMPANY_COLUMNS_PREFERENCE,
} from './constants';

// Hooks
export { useUserPreference } from './use-preference-queries';
export {
  useReservationColumnsPreference,
  useProfessionalsColumnsPreference,
  useCompanyReservationColumnsPreference,
} from './use-preference-mutations';
