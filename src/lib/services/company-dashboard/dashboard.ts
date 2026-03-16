/**
 * Orchestrateur Company Dashboard
 * Derviche Diffusion
 *
 * Fonction principale qui agrège toutes les données du dashboard compagnie
 */

import { logger } from '@/lib/logger';
import type { CompanyDashboardResult, CompanyDashboardStats } from './types';
import { getCompanyIdForUser, getCompanyInfo, getCompanyShowsWithStats, getUpcomingSlots } from './queries';

/**
 * Récupère toutes les données du dashboard compagnie
 */
export async function getCompanyDashboard(userId: string): Promise<CompanyDashboardResult> {
  try {
    // 1. Récupérer le company_id de l'utilisateur
    const { companyId, error: companyIdError } = await getCompanyIdForUser(userId);

    if (companyIdError || !companyId) {
      return { data: null, error: companyIdError || 'Compagnie non trouvée' };
    }

    // 2. Récupérer les données en parallèle
    const [companyResult, showsResult, upcomingSlotsResult] = await Promise.all([
      getCompanyInfo(companyId),
      getCompanyShowsWithStats(companyId),
      getUpcomingSlots(companyId, 10),
    ]);

    // 3. Calculer les statistiques globales
    const shows = showsResult.data;
    const stats: CompanyDashboardStats = {
      total_shows: shows.length,
      total_slots: shows.reduce((sum, s) => sum + s.total_slots, 0),
      total_reservations: shows.reduce((sum, s) => sum + s.total_reservations, 0),
      total_capacity: shows.reduce((sum, s) => sum + s.total_capacity, 0),
      average_occupancy_rate: shows.length > 0
        ? Math.round(shows.reduce((sum, s) => sum + s.occupancy_rate, 0) / shows.length)
        : 0,
      upcoming_slots_count: upcomingSlotsResult.data.length,
    };

    return {
      data: {
        company: companyResult.data,
        stats,
        shows,
        upcomingSlots: upcomingSlotsResult.data,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCompanyDashboard', { message });
    return { data: null, error: message };
  }
}
