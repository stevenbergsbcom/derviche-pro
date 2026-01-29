/**
 * Constants - Service Shows
 * Derviche Diffusion
 *
 * Constantes partagées entre les modules queries et mutations
 *
 * @module shows/constants
 */

// ============================================
// REQUÊTES SELECT
// ============================================

/**
 * Requête SELECT commune pour les shows avec company jointe
 *
 * @remarks
 * Utilisé dans queries.ts et mutations.ts pour garantir
 * la cohérence des données retournées
 */
export const SHOW_SELECT_WITH_COMPANY = `
  *,
  companies!inner(name)
`;
