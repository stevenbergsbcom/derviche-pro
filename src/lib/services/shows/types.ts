/**
 * Types - Service Shows
 * Derviche Diffusion
 *
 * @module shows/types
 */

import type {
  ShowRow,
  ShowInsert,
  ShowUpdate,
  ShowStatus,
  ShowPriceType,
} from '@/types/database';

// ============================================
// RÉSULTAT GÉNÉRIQUE
// ============================================

/**
 * Résultat générique pour les opérations de service
 */
export interface QueryResult<T> {
  data: T;
  error: string | null;
}

// ============================================
// SPECTACLE AVEC RELATIONS
// ============================================

/**
 * Spectacle avec données enrichies (company name, counts, etc.)
 */
export interface ShowWithRelations extends ShowRow {
  /** Nom de la compagnie associée */
  company_name: string;
  /** IDs des catégories associées */
  category_ids: string[];
  /** IDs des publics cibles associés */
  target_audience_ids: string[];
  /** Nombre de représentations (slots) */
  representations_count: number;
}

/**
 * Données pour créer/mettre à jour un show avec ses relations N-N
 */
export interface ShowWithRelationsInput {
  /** Données du spectacle */
  show: ShowInsert | ShowUpdate;
  /** IDs des catégories à associer */
  category_ids?: string[];
  /** IDs des publics cibles à associer */
  target_audience_ids?: string[];
}

// ============================================
// RÉSULTATS TYPÉS
// ============================================

/** Résultat pour un seul show */
export type ShowResult = QueryResult<ShowRow | null>;

/** Résultat pour un show avec relations */
export type ShowWithRelationsResult = QueryResult<ShowWithRelations | null>;

/** Résultat pour une liste de shows avec relations */
export type ShowsWithRelationsResult = QueryResult<ShowWithRelations[]>;

/** Résultat pour vérifier l'utilisation d'un show */
export interface ShowUsageResult {
  used: boolean;
  count: number;
  error: string | null;
}

// ============================================
// TYPES RAW SUPABASE (pour mappers)
// ============================================

/**
 * Données brutes retournées par Supabase pour un show avec company
 */
export interface RawShowWithCompany extends ShowRow {
  companies: { name: string } | null;
}

/**
 * Mapping catégorie
 */
export interface CategoryMapping {
  show_id: string;
  category_id: string;
}

/**
 * Mapping public cible
 */
export interface AudienceMapping {
  show_id: string;
  target_audience_id: string;
}

// ============================================
// RÉ-EXPORTS POUR COMMODITÉ
// ============================================

export type { ShowRow, ShowInsert, ShowUpdate, ShowStatus, ShowPriceType };
