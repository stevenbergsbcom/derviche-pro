/**
 * Admin Dashboard Service - Orchestrateur
 * Derviche Diffusion
 * 
 * Récupère toutes les données du tableau de bord administrateur
 * en orchestrant les appels aux sous-services
 */

import { logger } from '@/lib/logger';
import type { AdminDashboardOptions, AdminDashboardResult } from './types';
import { getStats } from './stats';
import { getUpcomingSlots } from './slots';
import { getRecentReservations } from './reservations';

// ============================================
// CONSTANTES
// ============================================

/** Nombre d'éléments par défaut pour les listes */
const DEFAULT_LIST_LIMIT = 10;

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Récupère toutes les données du dashboard admin
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getAdminDashboard(
  options?: AdminDashboardOptions
): Promise<AdminDashboardResult> {
  try {
    // Exécuter toutes les requêtes en parallèle
    const [statsResult, slotsResult, reservationsResult] = await Promise.all([
      getStats(options),
      getUpcomingSlots(DEFAULT_LIST_LIMIT, options),
      getRecentReservations(DEFAULT_LIST_LIMIT, options),
    ]);

    // Collecter toutes les erreurs
    const errors = [
      statsResult.error,
      slotsResult.error,
      reservationsResult.error,
    ].filter(Boolean);

    return {
      data: {
        stats: statsResult.data,
        upcomingSlots: slotsResult.data,
        recentReservations: reservationsResult.data,
      },
      error: errors.length > 0 ? errors.join('; ') : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAdminDashboard', { message });
    return { data: null, error: message };
  }
}
