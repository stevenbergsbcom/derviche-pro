/**
 * Fonctions de liste pour le service Admin Reservations
 * 
 * @module admin-reservations/list
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { 
  AdminReservationFilters, 
  AdminReservationsResult,
  AdminReservationsListResult,
  PaginationOptions,
  ReservationRowWithRelations,
} from './types';
import { 
  RESERVATION_SELECT_QUERY, 
  DEFAULT_PAGINATION,
  ERROR_MESSAGES,
} from './constants';
import { transformReservations } from './transformers';
import { 
  applyFilters, 
  applySorting, 
  applyPagination,
  calculateTotalPages,
} from './filters';

// ============================================
// FONCTION INTERNE PARTAGÉE
// ============================================

/**
 * Options pour la requête interne
 */
interface QueryOptions {
  /** Inclure le count pour pagination */
  withCount?: boolean;
  /** Appliquer la pagination */
  pagination?: PaginationOptions;
  /** Option de tri (si non fourni, utilise date + nom pour export) */
  sortBy?: AdminReservationFilters['sortBy'];
  /** Mode export : tri fixe par date puis nom */
  exportMode?: boolean;
}

/**
 * Résultat brut de la requête interne
 */
interface InternalQueryResult {
  data: ReservationRowWithRelations[];
  count: number | null;
  error: string | null;
}

/**
 * Exécute la requête de base avec filtres
 * Fonction interne partagée entre getAdminReservations et getAllReservationsForExport
 * 
 * @param filters - Filtres à appliquer
 * @param options - Options de requête (count, pagination, tri)
 * @returns Données brutes et count
 */
async function executeListQuery(
  filters: AdminReservationFilters,
  options: QueryOptions = {}
): Promise<InternalQueryResult> {
  const supabase = createClient();
  
  // Construction de la requête de base
  // Note: On utilise 'any' car le typage exact dépend des options (count ou non)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('reservations')
    .select(RESERVATION_SELECT_QUERY, options.withCount ? { count: 'exact' } : undefined);

  // Appliquer les filtres
  query = applyFilters(query, filters);

  // Appliquer le tri
  if (options.exportMode) {
    // Mode export : tri fixe par date de représentation puis nom
    query = query
      .order('date', { referencedTable: 'slots', ascending: true })
      .order('guest_last_name', { ascending: true });
  } else {
    query = applySorting(query, options.sortBy);
  }

  // Appliquer la pagination si demandée
  if (options.pagination) {
    query = applyPagination(query, options.pagination.page, options.pagination.pageSize);
  }

  // Exécuter la requête
  const { data, error, count } = await query;

  if (error) {
    return { data: [], count: null, error: error.message };
  }

  return { 
    data: (data || []) as ReservationRowWithRelations[], 
    count: count ?? null, 
    error: null,
  };
}

// ============================================
// FONCTIONS EXPORTÉES
// ============================================

/**
 * Récupère la liste des réservations avec filtres et pagination
 * 
 * @param filters - Filtres optionnels (showId, status, period, search, etc.)
 * @param pagination - Options de pagination (page, pageSize)
 * @returns Résultat paginé avec total et métadonnées
 * 
 * @example
 * ```ts
 * // Récupérer les réservations à venir pour un spectacle
 * const result = await getAdminReservations(
 *   { showId: '123', period: 'upcoming' },
 *   { page: 1, pageSize: 20 }
 * );
 * ```
 */
export async function getAdminReservations(
  filters: AdminReservationFilters = {},
  pagination: PaginationOptions = DEFAULT_PAGINATION
): Promise<AdminReservationsResult> {
  try {
    const { page, pageSize } = pagination;

    const result = await executeListQuery(filters, {
      withCount: true,
      pagination: { page, pageSize },
      sortBy: filters.sortBy,
    });

    if (result.error) {
      logger.error(ERROR_MESSAGES.FETCH_LIST, { error: result.error });
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        error: result.error,
      };
    }

    const reservations = transformReservations(result.data);
    const total = result.count || 0;

    return {
      data: reservations,
      total,
      page,
      pageSize,
      totalPages: calculateTotalPages(total, pageSize),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getAdminReservations', { message });
    return {
      data: [],
      total: 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: 0,
      error: message,
    };
  }
}

/**
 * Récupère TOUTES les réservations pour export (sans pagination)
 * Applique les mêmes filtres que la liste paginée
 * 
 * @param filters - Filtres optionnels (mêmes que getAdminReservations)
 * @returns Liste complète des réservations filtrées
 * 
 * @remarks
 * - Tri fixe : date de représentation croissante, puis nom
 * - Pas de limite de résultats (attention aux performances)
 * - Utilisé pour l'export CSV
 * 
 * @example
 * ```ts
 * // Exporter toutes les réservations confirmées
 * const result = await getAllReservationsForExport({ status: 'confirmed' });
 * console.log(`${result.data.length} réservations à exporter`);
 * ```
 */
export async function getAllReservationsForExport(
  filters: AdminReservationFilters = {}
): Promise<AdminReservationsListResult> {
  try {
    const result = await executeListQuery(filters, {
      withCount: false,
      exportMode: true,
    });

    if (result.error) {
      logger.error(ERROR_MESSAGES.FETCH_EXPORT, { error: result.error });
      return { data: [], error: result.error };
    }

    const reservations = transformReservations(result.data);
    
    logger.info(`Export: ${reservations.length} réservations récupérées`);
    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : ERROR_MESSAGES.EXCEPTION;
    logger.error('Exception getAllReservationsForExport', { message });
    return { data: [], error: message };
  }
}
