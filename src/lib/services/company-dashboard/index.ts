/**
 * Service Company Dashboard
 * Derviche Diffusion
 *
 * Gère la récupération des données pour l'interface compagnie (lecture seule)
 * - Infos compagnie
 * - Spectacles de la compagnie
 * - Statistiques de réservations
 * - Prochains créneaux
 */

export type {
  CompanyShowWithStats,
  UpcomingSlot,
  CompanyDashboardStats,
  CompanyDashboardData,
  CompanyDashboardResult,
} from './types';

export {
  getCompanyIdForUser,
  getCompanyInfo,
  getCompanyShowsWithStats,
  getUpcomingSlots,
} from './queries';
export type { SlotRangeMode } from './queries';

export { getCompanyDashboard } from './dashboard';
