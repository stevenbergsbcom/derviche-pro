/**
 * Mutations - Service Shows
 * Derviche Diffusion
 *
 * Fonctions de modification (INSERT/UPDATE/DELETE) pour les spectacles
 *
 * @module shows/mutations
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type {
  ShowWithRelationsResult,
  ShowResult,
  ShowWithRelationsInput,
  ShowInsert,
  ShowUpdate,
  ShowStatus,
  ShowPriceType,
  RawShowWithCompany,
} from './types';
import { buildShowWithRelations } from './mappers';
import { generateUniqueSlug } from './slug';
import { SHOW_SELECT_WITH_COMPANY } from './constants';

// ============================================
// HELPERS INTERNES
// ============================================

/**
 * Met à jour les mappings catégories pour un show
 */
async function updateCategoryMappings(
  supabase: ReturnType<typeof createClient>,
  showId: string,
  categoryIds: string[]
): Promise<void> {
  // Supprimer les anciens mappings
  const { error: deleteError } = await supabase
    .from('show_category_mapping')
    .delete()
    .eq('show_id', showId);

  if (deleteError) {
    logger.error('Erreur suppression category mappings', deleteError);
  }

  // Créer les nouveaux mappings
  if (categoryIds.length > 0) {
    const mappings = categoryIds.map((category_id) => ({
      show_id: showId,
      category_id,
    }));

    const { error } = await supabase
      .from('show_category_mapping')
      .insert(mappings);

    if (error) {
      logger.error('Erreur mise à jour category mappings', error);
    }
  }
}

/**
 * Met à jour les mappings publics cibles pour un show
 */
async function updateAudienceMappings(
  supabase: ReturnType<typeof createClient>,
  showId: string,
  audienceIds: string[]
): Promise<void> {
  // Supprimer les anciens mappings
  const { error: deleteError } = await supabase
    .from('show_target_audience_mapping')
    .delete()
    .eq('show_id', showId);

  if (deleteError) {
    logger.error('Erreur suppression audience mappings', deleteError);
  }

  // Créer les nouveaux mappings
  if (audienceIds.length > 0) {
    const mappings = audienceIds.map((target_audience_id) => ({
      show_id: showId,
      target_audience_id,
    }));

    const { error } = await supabase
      .from('show_target_audience_mapping')
      .insert(mappings);

    if (error) {
      logger.error('Erreur mise à jour audience mappings', error);
    }
  }
}

/**
 * Récupère les mappings actuels d'un show (si non fournis)
 */
async function fetchCurrentMappings(
  supabase: ReturnType<typeof createClient>,
  showId: string
): Promise<{ categoryIds: string[]; audienceIds: string[] }> {
  const [catResult, audResult] = await Promise.all([
    supabase
      .from('show_category_mapping')
      .select('category_id')
      .eq('show_id', showId),
    supabase
      .from('show_target_audience_mapping')
      .select('target_audience_id')
      .eq('show_id', showId),
  ]);

  return {
    categoryIds: (catResult.data || []).map((m) => m.category_id),
    audienceIds: (audResult.data || []).map((m) => m.target_audience_id),
  };
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crée un nouveau spectacle avec ses relations N-N
 *
 * @remarks
 * Le slug est généré automatiquement à partir du titre avec unicité garantie.
 * Les mappings catégories et publics cibles sont créés en parallèle.
 *
 * @param input - Données du spectacle et relations
 * @returns Spectacle créé avec relations
 */
export async function createShow(
  input: ShowWithRelationsInput
): Promise<ShowWithRelationsResult> {
  try {
    const supabase = createClient();
    const { show, category_ids = [], target_audience_ids = [] } = input;

    // Vérifier que le titre est présent et non vide
    const showInsert = show as ShowInsert;
    if (!showInsert.title || !showInsert.title.trim()) {
      return { data: null, error: 'Le titre est requis pour créer un spectacle' };
    }

    // Générer un slug unique à partir du titre
    let uniqueSlug: string;
    try {
      uniqueSlug = await generateUniqueSlug(showInsert.title);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Le titre doit contenir au moins un caractère alphanumérique';
      return { data: null, error: errorMessage };
    }

    // Vérification de sécurité supplémentaire
    if (!uniqueSlug || !uniqueSlug.trim()) {
      return {
        data: null,
        error: 'Le titre doit contenir au moins un caractère alphanumérique',
      };
    }

    // Insérer le show avec le slug unique
    const showWithSlug: ShowInsert = {
      ...showInsert,
      slug: uniqueSlug,
    };

    const { data: newShow, error: showError } = await supabase
      .from('shows')
      .insert(showWithSlug)
      .select(SHOW_SELECT_WITH_COMPANY)
      .single();

    if (showError) {
      logger.error('Erreur création show', showError);
      return { data: null, error: showError.message };
    }

    // Créer les mappings en parallèle
    await Promise.all([
      category_ids.length > 0
        ? supabase.from('show_category_mapping').insert(
            category_ids.map((category_id) => ({
              show_id: newShow.id,
              category_id,
            }))
          )
        : Promise.resolve(),
      target_audience_ids.length > 0
        ? supabase.from('show_target_audience_mapping').insert(
            target_audience_ids.map((target_audience_id) => ({
              show_id: newShow.id,
              target_audience_id,
            }))
          )
        : Promise.resolve(),
    ]);

    // Construire le résultat
    const result = buildShowWithRelations(newShow as RawShowWithCompany, {
      categoryIds: category_ids,
      audienceIds: target_audience_ids,
      slotsCount: 0,
    });

    logger.info(`Show créé: ${result.title} (${result.id})`);
    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createShow', { message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour un spectacle existant avec ses relations N-N
 *
 * @param id - UUID du spectacle
 * @param input - Nouvelles données du spectacle et relations
 * @returns Spectacle mis à jour avec relations
 */
export async function updateShow(
  id: string,
  input: ShowWithRelationsInput
): Promise<ShowWithRelationsResult> {
  try {
    const supabase = createClient();
    const { show, category_ids, target_audience_ids } = input;

    // Mettre à jour le spectacle
    const { data: updatedShow, error: showError } = await supabase
      .from('shows')
      .update(show as ShowUpdate)
      .eq('id', id)
      .is('deleted_at', null)
      .select(SHOW_SELECT_WITH_COMPANY)
      .single();

    if (showError) {
      logger.error('Erreur mise à jour show', { id, error: showError.message });
      return { data: null, error: showError.message };
    }

    // Mettre à jour les mappings (si fournis)
    const updatePromises: Promise<void>[] = [];

    if (category_ids !== undefined) {
      updatePromises.push(updateCategoryMappings(supabase, id, category_ids));
    }

    if (target_audience_ids !== undefined) {
      updatePromises.push(
        updateAudienceMappings(supabase, id, target_audience_ids)
      );
    }

    await Promise.all(updatePromises);

    // Récupérer les valeurs finales (si non fournies, fetch les actuelles)
    let finalCategoryIds = category_ids;
    let finalAudienceIds = target_audience_ids;

    if (finalCategoryIds === undefined || finalAudienceIds === undefined) {
      const currentMappings = await fetchCurrentMappings(supabase, id);
      finalCategoryIds = finalCategoryIds ?? currentMappings.categoryIds;
      finalAudienceIds = finalAudienceIds ?? currentMappings.audienceIds;
    }

    // Compter les slots
    const { count: slotsCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', id);

    // Construire le résultat
    const result = buildShowWithRelations(updatedShow as RawShowWithCompany, {
      categoryIds: finalCategoryIds,
      audienceIds: finalAudienceIds,
      slotsCount: slotsCount || 0,
    });

    logger.info(`Show mis à jour: ${result.title} (${result.id})`);
    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateShow', { message });
    return { data: null, error: message };
  }
}

/**
 * Supprime un spectacle (soft delete)
 *
 * @param id - UUID du spectacle
 * @returns Spectacle supprimé
 */
export async function deleteShow(id: string): Promise<ShowResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('shows')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Erreur suppression show', { id, error: error.message });
      return { data: null, error: error.message };
    }

    // Cast explicite pour les champs enum
    const typedData = {
      ...data,
      status: data.status as ShowStatus,
      price_type: data.price_type as ShowPriceType,
    };

    logger.info(`Show supprimé (soft): ${typedData.title} (${typedData.id})`);
    return { data: typedData, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteShow', { message });
    return { data: null, error: message };
  }
}
