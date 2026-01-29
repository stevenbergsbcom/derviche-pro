/**
 * Slug - Service Shows
 * Derviche Diffusion
 *
 * Fonctions de génération de slug pour les spectacles
 *
 * @module shows/slug
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// GÉNÉRATION DE SLUG
// ============================================

/**
 * Génère un slug à partir du titre (sans vérification d'unicité)
 *
 * @remarks
 * Transformations appliquées :
 * 1. Conversion en minuscules
 * 2. Normalisation NFD (décomposition des caractères accentués)
 * 3. Suppression des accents
 * 4. Remplacement des caractères spéciaux par des tirets
 * 5. Suppression des tirets en début/fin
 * 6. Limitation à 100 caractères
 *
 * @param title - Titre du spectacle
 * @returns Slug généré
 *
 * @example
 * ```ts
 * generateSlug('Le Malade Imaginaire') // 'le-malade-imaginaire'
 * generateSlug('Café Müller')          // 'cafe-muller'
 * generateSlug('L\'Avare')             // 'l-avare'
 * ```
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux
    .replace(/^-+|-+$/g, '') // Retirer les tirets en début/fin
    .substring(0, 100); // Limiter la longueur
}

/**
 * Génère un slug unique à partir du titre
 *
 * @remarks
 * Si le slug existe déjà, ajoute un suffixe numérique (-2, -3, etc.)
 * En cas d'erreur de requête, retourne le slug de base
 * (la contrainte UNIQUE en BDD gèrera les doublons)
 *
 * @param title - Titre du spectacle
 * @returns Slug unique garanti
 * @throws Si le slug généré est vide (titre invalide)
 *
 * @example
 * ```ts
 * // Premier spectacle avec ce titre
 * await generateUniqueSlug('Hamlet') // 'hamlet'
 *
 * // Deuxième spectacle avec ce titre
 * await generateUniqueSlug('Hamlet') // 'hamlet-2'
 *
 * // Troisième spectacle avec ce titre
 * await generateUniqueSlug('Hamlet') // 'hamlet-3'
 * ```
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const supabase = createClient();
  const baseSlug = generateSlug(title);

  // Vérifier que le slug de base n'est pas vide
  if (!baseSlug || !baseSlug.trim()) {
    throw new Error(
      'Le titre doit contenir au moins un caractère alphanumérique pour générer un slug valide'
    );
  }

  // Chercher tous les slugs qui commencent par le slug de base
  const { data: existing, error } = await supabase
    .from('shows')
    .select('slug')
    .like('slug', `${baseSlug}%`)
    .is('deleted_at', null);

  // En cas d'erreur de requête, retourner le slug de base
  // La contrainte UNIQUE en BDD gèrera les doublons si nécessaire
  if (error) {
    logger.error('Erreur recherche slugs existants', {
      error: error.message,
      baseSlug,
    });
    return baseSlug;
  }

  // Si aucun résultat, le slug de base est disponible
  if (!existing || existing.length === 0) {
    return baseSlug;
  }

  // Créer un Set pour recherche rapide O(1)
  const existingSlugs = new Set(existing.map((s) => s.slug));

  // Si le slug de base exact n'existe pas, on le retourne
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Trouver le prochain numéro disponible
  let counter = 2;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}
