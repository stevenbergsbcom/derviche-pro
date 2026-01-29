/**
 * Queries - Service Shows
 * Derviche Diffusion
 *
 * Fonctions de lecture (SELECT) pour les spectacles
 *
 * @module shows/queries
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type {
  ShowsWithRelationsResult,
  ShowWithRelationsResult,
  ShowUsageResult,
  RawShowWithCompany,
  CategoryMapping,
  AudienceMapping,
} from './types';
import {
  aggregateCategoryMappings,
  aggregateAudienceMappings,
  aggregateSlotsCount,
  buildShowsWithRelations,
  buildShowWithRelations,
} from './mappers';
import { SHOW_SELECT_WITH_COMPANY } from './constants';

// ============================================
// QUERIES
// ============================================

/**
 * Récupère tous les spectacles actifs avec leurs relations
 *
 * @remarks
 * Utilise Promise.all pour paralléliser les 4 requêtes nécessaires :
 * 1. Spectacles avec company name
 * 2. Mappings catégories
 * 3. Mappings publics cibles
 * 4. Count des slots par show
 *
 * @returns Liste des spectacles triés par titre avec relations
 */
export async function getShows(): Promise<ShowsWithRelationsResult> {
  try {
    const supabase = createClient();

    // Requête 1: Récupérer les spectacles avec le nom de la compagnie
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select(SHOW_SELECT_WITH_COMPANY)
      .is('deleted_at', null)
      .order('title', { ascending: true });

    if (showsError) {
      logger.error('Erreur récupération shows', showsError);
      return { data: [], error: showsError.message };
    }

    if (!shows || shows.length === 0) {
      return { data: [], error: null };
    }

    const showIds = shows.map((s) => s.id);

    // Requêtes 2, 3, 4 en parallèle (optimisation)
    const [categoryResult, audienceResult, slotsResult] = await Promise.all([
      supabase
        .from('show_category_mapping')
        .select('show_id, category_id')
        .in('show_id', showIds),
      supabase
        .from('show_target_audience_mapping')
        .select('show_id, target_audience_id')
        .in('show_id', showIds),
      supabase.from('slots').select('show_id').in('show_id', showIds),
    ]);

    // Agréger les données
    const categoryMap = aggregateCategoryMappings(
      (categoryResult.data as CategoryMapping[]) || []
    );
    const audienceMap = aggregateAudienceMappings(
      (audienceResult.data as AudienceMapping[]) || []
    );
    const slotsCountMap = aggregateSlotsCount(slotsResult.data || []);

    // Construire les shows avec relations
    const showsWithRelations = buildShowsWithRelations(
      shows as RawShowWithCompany[],
      categoryMap,
      audienceMap,
      slotsCountMap
    );

    return { data: showsWithRelations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getShows', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère un spectacle par son ID avec ses relations
 *
 * @param id - UUID du spectacle
 * @returns Spectacle avec relations ou null si non trouvé
 */
export async function getShowById(
  id: string
): Promise<ShowWithRelationsResult> {
  try {
    const supabase = createClient();

    // Requête principale
    const { data: show, error } = await supabase
      .from('shows')
      .select(SHOW_SELECT_WITH_COMPANY)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Erreur récupération show', { id, error: error.message });
      return { data: null, error: error.message };
    }

    // Requêtes parallèles pour les relations
    const [categoryResult, audienceResult, slotsResult] = await Promise.all([
      supabase
        .from('show_category_mapping')
        .select('category_id')
        .eq('show_id', id),
      supabase
        .from('show_target_audience_mapping')
        .select('target_audience_id')
        .eq('show_id', id),
      supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('show_id', id),
    ]);

    // Construire le show avec relations
    const showWithRelations = buildShowWithRelations(
      show as RawShowWithCompany,
      {
        categoryIds: (categoryResult.data || []).map((m) => m.category_id),
        audienceIds: (audienceResult.data || []).map(
          (m) => m.target_audience_id
        ),
        slotsCount: slotsResult.count || 0,
      }
    );

    return { data: showWithRelations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getShowById', { message });
    return { data: null, error: message };
  }
}

/**
 * Vérifie si un spectacle est utilisé par des slots (représentations)
 *
 * @param id - UUID du spectacle
 * @returns Statut d'utilisation avec count
 */
export async function isShowUsed(id: string): Promise<ShowUsageResult> {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', id);

    if (error) {
      logger.error('Erreur vérification utilisation show', {
        id,
        error: error.message,
      });
      return { used: false, count: 0, error: error.message };
    }

    return { used: (count || 0) > 0, count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception isShowUsed', { message });
    return { used: false, count: 0, error: message };
  }
}
