/**
 * Mappers - Service Shows
 * Derviche Diffusion
 *
 * Fonctions de transformation des données Supabase vers les types métier
 *
 * @module shows/mappers
 */

import type {
  ShowWithRelations,
  RawShowWithCompany,
  CategoryMapping,
  AudienceMapping,
  ShowStatus,
  ShowPriceType,
} from './types';

// ============================================
// AGRÉGATION DES MAPPINGS
// ============================================

/**
 * Agrège les category_ids par show_id
 *
 * @param mappings - Liste des mappings catégories
 * @returns Map show_id → category_ids[]
 */
export function aggregateCategoryMappings(
  mappings: CategoryMapping[]
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const mapping of mappings) {
    if (!map[mapping.show_id]) {
      map[mapping.show_id] = [];
    }
    map[mapping.show_id].push(mapping.category_id);
  }

  return map;
}

/**
 * Agrège les target_audience_ids par show_id
 *
 * @param mappings - Liste des mappings publics cibles
 * @returns Map show_id → target_audience_ids[]
 */
export function aggregateAudienceMappings(
  mappings: AudienceMapping[]
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const mapping of mappings) {
    if (!map[mapping.show_id]) {
      map[mapping.show_id] = [];
    }
    map[mapping.show_id].push(mapping.target_audience_id);
  }

  return map;
}

/**
 * Agrège le count des slots par show_id
 *
 * @param slots - Liste des slots avec show_id
 * @returns Map show_id → count
 */
export function aggregateSlotsCount(
  slots: Array<{ show_id: string }>
): Record<string, number> {
  const map: Record<string, number> = {};

  for (const slot of slots) {
    map[slot.show_id] = (map[slot.show_id] || 0) + 1;
  }

  return map;
}

// ============================================
// CONSTRUCTION DU SHOW AVEC RELATIONS
// ============================================

/**
 * Options pour construire un ShowWithRelations
 */
export interface BuildShowOptions {
  /** Map show_id → category_ids[] */
  categoryMap?: Record<string, string[]>;
  /** Map show_id → target_audience_ids[] */
  audienceMap?: Record<string, string[]>;
  /** Map show_id → slots count */
  slotsCountMap?: Record<string, number>;
  /** Category IDs directs (pour un seul show) */
  categoryIds?: string[];
  /** Audience IDs directs (pour un seul show) */
  audienceIds?: string[];
  /** Slots count direct (pour un seul show) */
  slotsCount?: number;
}

/**
 * Construit un ShowWithRelations à partir des données Supabase brutes
 *
 * @param rawShow - Données brutes du show avec company jointe
 * @param options - Maps d'agrégation ou valeurs directes
 * @returns ShowWithRelations typé
 *
 * @example
 * ```ts
 * // Pour un seul show
 * const show = buildShowWithRelations(rawShow, {
 *   categoryIds: ['cat1', 'cat2'],
 *   audienceIds: ['aud1'],
 *   slotsCount: 5,
 * });
 *
 * // Pour plusieurs shows avec maps
 * const show = buildShowWithRelations(rawShow, {
 *   categoryMap,
 *   audienceMap,
 *   slotsCountMap,
 * });
 * ```
 */
export function buildShowWithRelations(
  rawShow: RawShowWithCompany,
  options: BuildShowOptions = {}
): ShowWithRelations {
  const {
    categoryMap,
    audienceMap,
    slotsCountMap,
    categoryIds,
    audienceIds,
    slotsCount,
  } = options;

  // Extraire le nom de la compagnie
  const companyName = rawShow.companies?.name || 'Compagnie inconnue';

  // Retirer la propriété companies de l'objet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { companies, ...showData } = rawShow;

  // Résoudre les IDs (priorité aux valeurs directes)
  const resolvedCategoryIds =
    categoryIds ?? categoryMap?.[rawShow.id] ?? [];
  const resolvedAudienceIds =
    audienceIds ?? audienceMap?.[rawShow.id] ?? [];
  const resolvedSlotsCount =
    slotsCount ?? slotsCountMap?.[rawShow.id] ?? 0;

  // Cast explicite pour les champs enum (Supabase les renvoie comme string)
  return {
    ...showData,
    status: showData.status as ShowStatus,
    price_type: showData.price_type as ShowPriceType,
    company_name: companyName,
    category_ids: resolvedCategoryIds,
    target_audience_ids: resolvedAudienceIds,
    representations_count: resolvedSlotsCount,
  };
}

/**
 * Construit une liste de ShowWithRelations à partir des données Supabase
 *
 * @param rawShows - Liste des shows bruts
 * @param categoryMap - Map show_id → category_ids[]
 * @param audienceMap - Map show_id → target_audience_ids[]
 * @param slotsCountMap - Map show_id → slots count
 * @returns Liste de ShowWithRelations
 */
export function buildShowsWithRelations(
  rawShows: RawShowWithCompany[],
  categoryMap: Record<string, string[]>,
  audienceMap: Record<string, string[]>,
  slotsCountMap: Record<string, number>
): ShowWithRelations[] {
  return rawShows.map((rawShow) =>
    buildShowWithRelations(rawShow, {
      categoryMap,
      audienceMap,
      slotsCountMap,
    })
  );
}
