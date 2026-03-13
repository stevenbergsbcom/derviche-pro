/**
 * Service Admin Reservations - Gestion des réservations côté admin
 * Derviche Diffusion
 * 
 * Point d'entrée du module - Réexporte toutes les fonctions et types publics
 * 
 * @module admin-reservations
 * 
 * Fonctionnalités :
 * - Liste paginée avec filtres
 * - Détail complet avec relations
 * - Check-in (mise à jour du statut)
 * - Modification complète (via RPC sécurisée)
 * - Annulation
 * - Export CSV
 * - Statistiques
 * 
 * @example
 * ```ts
 * import { 
 *   getAdminReservations, 
 *   updateReservationCheckin,
 *   type AdminReservation,
 * } from '@/lib/services/admin-reservations';
 * 
 * const result = await getAdminReservations({ period: 'upcoming' });
 * ```
 */

// ============================================
// TYPES PUBLICS
// ============================================

export type {
  // Entités
  AdminReservation,
  AdminReservationSlot,
  
  // Filtres et pagination
  AdminReservationFilters,
  AdminReservationSortBy,
  PaginationOptions,
  
  // Résultats
  AdminReservationsResult,
  AdminReservationResult,
  AdminReservationsListResult,
  
  // Mutations
  CheckinUpdateData,
  UpdateReservationData,
  CreateAdminReservationData,
  CreateAdminReservationResult,
  
  // Stats
  ReservationStats,
  ReservationStatsResult,
  
  // Slots
  AvailableSlot,
  AvailableSlotsResult,
} from './types';

export type { GetAvailableSlotsOptions } from './stats';

// ============================================
// FONCTIONS - LISTE
// ============================================

export { 
  getAdminReservations,
  getAllReservationsForExport,
} from './list';

// ============================================
// FONCTIONS - DÉTAIL
// ============================================

export { 
  getAdminReservationById,
} from './detail';

// ============================================
// FONCTIONS - MUTATIONS
// ============================================

export { 
  updateReservationCheckin,
  updateReservation,
  cancelReservation,
  createAdminReservation,
} from './mutations';

// ============================================
// FONCTIONS - STATS
// ============================================

export {
  getReservationStats,
  getReservationsBySlot,
  getAvailableSlotsForShow,
  getVenuesWithReservations,
} from './stats';
