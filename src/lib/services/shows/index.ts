/**
 * Service Shows - Gestion des spectacles
 * Derviche Diffusion
 *
 * Point d'entrée du module - Réexporte toutes les fonctions et types publics
 *
 * @module shows
 *
 * Fonctionnalités :
 * - CRUD spectacles avec soft delete
 * - Gestion relations N-N (catégories, publics cibles)
 * - Génération automatique de slug unique
 * - Comptage des représentations (slots)
 *
 * @example
 * ```ts
 * import {
 *   getShows,
 *   getShowById,
 *   createShow,
 *   updateShow,
 *   deleteShow,
 *   isShowUsed,
 *   generateSlug,
 *   type ShowWithRelations,
 * } from '@/lib/services/shows';
 *
 * const result = await getShows();
 * if (!result.error) {
 *   console.log(result.data); // ShowWithRelations[]
 * }
 * ```
 */

// ============================================
// TYPES PUBLICS
// ============================================

export type {
  // Résultats génériques
  QueryResult,

  // Spectacle avec relations
  ShowWithRelations,
  ShowWithRelationsInput,

  // Résultats typés
  ShowResult,
  ShowWithRelationsResult,
  ShowsWithRelationsResult,
  ShowUsageResult,

  // Types de base (ré-exports de database.ts)
  ShowRow,
  ShowInsert,
  ShowUpdate,
  ShowStatus,
  ShowPriceType,
} from './types';

// ============================================
// FONCTIONS - QUERIES
// ============================================

export { getShows, getShowById, isShowUsed } from './queries';

// ============================================
// FONCTIONS - MUTATIONS
// ============================================

export { createShow, updateShow, deleteShow } from './mutations';

// ============================================
// FONCTIONS - SLUG
// ============================================

export { generateSlug, generateUniqueSlug } from './slug';
