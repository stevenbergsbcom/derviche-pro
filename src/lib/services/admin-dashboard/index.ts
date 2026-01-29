/**
 * Admin Dashboard Service - Exports
 * Derviche Diffusion
 * 
 * Note: Les fonctions individuelles (getStats, getUpcomingSlots, getRecentReservations)
 * ne sont pas exportées pour éviter les conflits de noms avec d'autres services.
 * Utiliser getAdminDashboard() qui les orchestre.
 */

// Types publics
export type {
  AdminDashboardStats,
  AdminUpcomingSlot,
  AdminRecentReservation,
  AdminDashboardData,
  AdminDashboardResult,
  AdminDashboardOptions,
} from './types';

// Fonction principale (seule exportée publiquement)
export { getAdminDashboard } from './admin-dashboard';

// Helpers réutilisables (noms uniques, pas de conflit)
export { 
  calculateBooked, 
  calculateOccupancyRate,
  UNLIMITED_CAPACITY,
} from './helpers';
