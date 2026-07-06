/**
 * Filtres et query builders pour le service Admin Reservations
 *
 * @module admin-reservations/filters
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { AdminReservationFilters, EffectiveDateFilters } from './types';
import { DEFAULT_SORT_BY } from './constants';

// ============================================
// HELPERS DATE
// ============================================

/**
 * Retourne la date du jour au format YYYY-MM-DD
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcule les filtres de date effectifs en fonction de period et dateFrom/dateTo
 * 
 * @remarks
 * Les dates personnalisées (dateFrom/dateTo) écrasent le filtre period.
 * - 'upcoming' : à partir d'aujourd'hui
 * - 'past' : jusqu'à aujourd'hui (inclus pour voir les représentations du jour)
 * - 'all' : pas de filtre de date
 * 
 * @param filters - Filtres contenant period et/ou dateFrom/dateTo
 * @returns Filtres de date effectifs à appliquer
 */
export function getEffectiveDateFilters(filters: AdminReservationFilters): EffectiveDateFilters {
  // Si des dates personnalisées sont définies, elles prennent le dessus
  // (intention explicite de l'utilisateur, respectée même en recherche).
  if (filters.dateFrom || filters.dateTo) {
    return {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }

  // Recherche active : on ignore le filtre Période (défaut « À venir ») pour
  // chercher sur TOUTES les périodes. Sinon une résa passée matchant le terme
  // serait masquée → l'utilisateur croirait que la recherche ne trouve pas
  // tout. Le chip Période est neutralisé côté UI tant qu'une recherche est
  // active, puis « À venir » redevient actif dès qu'on efface la recherche.
  if (filters.search && filters.search.trim()) {
    return {};
  }

  // Sinon, appliquer le filtre period
  const today = getTodayDate();

  switch (filters.period) {
    case 'upcoming':
      return { dateFrom: today };
    case 'past':
      return { dateTo: today };
    case 'all':
    default:
      return {};
  }
}

// ============================================
// QUERY BUILDER HELPERS
// ============================================

/**
 * Applique les filtres de base à une query Supabase
 * 
 * @param query - Query Supabase de base
 * @param filters - Filtres à appliquer
 * @returns Query avec filtres appliqués
 * 
 * @remarks
 * Applique dans l'ordre :
 * 1. Filtre par showId (sur slots.show_id)
 * 2. Filtre par slotId (sur slot_id)
 * 3. Filtre par status
 * 4. Filtre par checkinStatus
 * 5. Filtres de date (calculés depuis period ou dateFrom/dateTo)
 * 6. Recherche textuelle (email, prénom, nom)
 * 
 * Note: On utilise 'any' pour le type query car les types Supabase
 * sont complexes et changent entre versions. Le typage est assuré
 * par les fonctions appelantes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters(query: any, filters: AdminReservationFilters): any {
  let filteredQuery = query;

  // Filtre par spectacle
  if (filters.showId) {
    filteredQuery = filteredQuery.eq('slots.show_id', filters.showId);
  }

  // Filtre par lieu
  if (filters.venueId) {
    filteredQuery = filteredQuery.eq('slots.venue_id', filters.venueId);
  }

  // Filtre par slot
  if (filters.slotId) {
    filteredQuery = filteredQuery.eq('slot_id', filters.slotId);
  }

  // Filtre par statut réservation
  if (filters.status) {
    filteredQuery = filteredQuery.eq('status', filters.status);
  }

  // Filtre par statut check-in
  if (filters.checkinStatus) {
    filteredQuery = filteredQuery.eq('checkin_status', filters.checkinStatus);
  }

  // Appliquer les filtres de date effectifs
  const effectiveDates = getEffectiveDateFilters(filters);
  
  if (effectiveDates.dateFrom) {
    filteredQuery = filteredQuery.gte('slots.date', effectiveDates.dateFrom);
  }

  if (effectiveDates.dateTo) {
    filteredQuery = filteredQuery.lte('slots.date', effectiveDates.dateTo);
  }

  // Recherche textuelle : traitée séparément via `resolveSearchIds` (RPC)
  // parce qu'elle nécessite un appel async (jointure profiles + multi-tokens).
  // Voir migration 125 pour le détail. Le caller doit appliquer .in('id', ids)
  // sur la query avant execution.

  return filteredQuery;
}

// ============================================
// RECHERCHE (via RPC — migration 125)
// ============================================

/**
 * Résout un terme de recherche en liste d'IDs de réservations candidates.
 * Utilise la RPC `search_reservation_ids` qui fait un OR sur 13+ colonnes
 * (guest_*, profiles, CRM ids) avec support multi-tokens.
 *
 * @returns
 *   - `null` si aucune recherche n'est demandée (filters.search vide)
 *     → le caller n'applique aucun filtre par ID
 *   - `string[]` (potentiellement vide) sinon
 *     → le caller applique .in('id', ids) ; si `[]` alors zéro résultat
 */
export async function resolveSearchIds(
  filters: AdminReservationFilters,
): Promise<string[] | null> {
  if (!filters.search || !filters.search.trim()) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('search_reservation_ids', {
    p_term: filters.search,
  });

  if (error) {
    // Fallback safe : on log mais on ne bloque pas la page — l'utilisateur
    // verra la liste complète (sans filtre de recherche) plutôt qu'une
    // erreur. Le service log permet de détecter le problème.
    logger.error('[admin-reservations] search_reservation_ids RPC error', {
      error: error.message,
      term: filters.search,
    });
    return null;
  }

  return (data as string[] | null) ?? [];
}

/**
 * Applique le tri à une query Supabase
 * 
 * @param query - Query Supabase
 * @param sortBy - Option de tri (défaut: slot_date_asc)
 * @returns Query avec tri appliqué
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySorting(query: any, sortBy?: AdminReservationFilters['sortBy']): any {
  const sort = sortBy || DEFAULT_SORT_BY;
  
  switch (sort) {
    case 'slot_date_asc':
      // slot_date est une colonne dénormalisée sur reservations (migration 080)
      // .order({ referencedTable: 'slots' }) ne trie pas la table parente en Supabase JS
      return query
        .order('slot_date', { ascending: true })
        .order('slot_time', { ascending: true });
    
    case 'slot_date_desc':
      return query
        .order('slot_date', { ascending: false })
        .order('slot_time', { ascending: false });
    
    case 'created_at_asc':
      return query.order('created_at', { ascending: true });
    
    case 'created_at_desc':
      return query.order('created_at', { ascending: false });
    
    case 'name_asc':
      return query
        .order('guest_last_name', { ascending: true })
        .order('guest_first_name', { ascending: true });
    
    case 'name_desc':
      return query
        .order('guest_last_name', { ascending: false })
        .order('guest_first_name', { ascending: false });
    
    default:
      // Fallback sur colonnes dénormalisées (migration 080) — cohérent avec slot_date_asc
      return query
        .order('slot_date', { ascending: true })
        .order('slot_time', { ascending: true });
  }
}

/**
 * Applique la pagination à une query Supabase
 * 
 * @param query - Query Supabase
 * @param page - Numéro de page (1-indexed)
 * @param pageSize - Nombre d'éléments par page
 * @returns Query avec pagination appliquée
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPagination(query: any, page: number, pageSize: number): any {
  const offset = (page - 1) * pageSize;
  return query.range(offset, offset + pageSize - 1);
}

/**
 * Calcule le nombre total de pages
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
