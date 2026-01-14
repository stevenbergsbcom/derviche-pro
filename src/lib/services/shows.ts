/**
 * Service Shows - CRUD pour la table shows
 * Derviche Diffusion
 * 
 * Gère toutes les opérations sur les spectacles,
 * y compris les relations N-N avec categories et target_audiences
 */

import { createClient } from '@/lib/supabase/client';
import type { ShowRow, ShowInsert, ShowUpdate, ShowStatus, ShowPriceType } from '@/types/database';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Spectacle avec données enrichies (company name, counts, etc.) */
export interface ShowWithRelations extends ShowRow {
  company_name: string;
  category_ids: string[];
  target_audience_ids: string[];
  representations_count: number;
}

/** Résultat d'une opération sur un show */
export interface ShowResult {
  data: ShowRow | null;
  error: string | null;
}

/** Résultat d'une opération sur plusieurs shows */
export interface ShowsResult {
  data: ShowWithRelations[];
  error: string | null;
}

/** Données pour créer/mettre à jour un show avec ses relations */
export interface ShowWithRelationsInput {
  show: ShowInsert | ShowUpdate;
  category_ids?: string[];
  target_audience_ids?: string[];
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère tous les spectacles actifs avec leurs relations
 * Triés par titre
 */
export async function getShows(): Promise<ShowsResult> {
  try {
    const supabase = createClient();

    // Requête 1: Récupérer les spectacles avec le nom de la compagnie
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select(`
        *,
        companies!inner(name)
      `)
      .is('deleted_at', null)
      .order('title', { ascending: true });

    if (showsError) {
      logger.error('Erreur récupération shows', showsError);
      return { data: [], error: showsError.message };
    }

    if (!shows || shows.length === 0) {
      return { data: [], error: null };
    }

    const showIds = shows.map(s => s.id);

    // Requête 2: Récupérer les mappings catégories
    const { data: categoryMappings } = await supabase
      .from('show_category_mapping')
      .select('show_id, category_id')
      .in('show_id', showIds);

    // Requête 3: Récupérer les mappings target audiences
    const { data: audienceMappings } = await supabase
      .from('show_target_audience_mapping')
      .select('show_id, target_audience_id')
      .in('show_id', showIds);

    // Requête 4: Compter les représentations (slots) actives par show
    const { data: slotsData } = await supabase
      .from('slots')
      .select('show_id')
      .in('show_id', showIds);

    // Agréger les counts de slots par show_id
    const slotsCountMap: Record<string, number> = {};
    (slotsData || []).forEach(slot => {
      slotsCountMap[slot.show_id] = (slotsCountMap[slot.show_id] || 0) + 1;
    });

    // Agréger les category_ids par show_id
    const categoryMap: Record<string, string[]> = {};
    (categoryMappings || []).forEach(mapping => {
      if (!categoryMap[mapping.show_id]) {
        categoryMap[mapping.show_id] = [];
      }
      categoryMap[mapping.show_id].push(mapping.category_id);
    });

    // Agréger les target_audience_ids par show_id
    const audienceMap: Record<string, string[]> = {};
    (audienceMappings || []).forEach(mapping => {
      if (!audienceMap[mapping.show_id]) {
        audienceMap[mapping.show_id] = [];
      }
      audienceMap[mapping.show_id].push(mapping.target_audience_id);
    });

    // Fusionner toutes les données
    const showsWithRelations: ShowWithRelations[] = shows.map(show => {
      // Extraire le nom de la compagnie (Supabase retourne un objet)
      const companyData = show.companies as { name: string } | null;

      // Retirer la propriété companies et ajouter les données enrichies
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { companies, ...showData } = show;

      // Cast explicite pour les champs enum (Supabase les renvoie comme string)
      return {
        ...showData,
        status: showData.status as ShowStatus,
        price_type: showData.price_type as ShowPriceType,
        company_name: companyData?.name || 'Compagnie inconnue',
        category_ids: categoryMap[show.id] || [],
        target_audience_ids: audienceMap[show.id] || [],
        representations_count: slotsCountMap[show.id] || 0,
      };
    });

    return { data: showsWithRelations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getShows', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère un spectacle par son ID avec ses relations
 */
export async function getShowById(id: string): Promise<{ data: ShowWithRelations | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data: show, error } = await supabase
      .from('shows')
      .select(`
        *,
        companies!inner(name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Erreur récupération show', { id, error: error.message });
      return { data: null, error: error.message };
    }

    // Récupérer les mappings
    const { data: categoryMappings } = await supabase
      .from('show_category_mapping')
      .select('category_id')
      .eq('show_id', id);

    const { data: audienceMappings } = await supabase
      .from('show_target_audience_mapping')
      .select('target_audience_id')
      .eq('show_id', id);

    // Compter les slots
    const { count: slotsCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', id);

    const companyData = show.companies as { name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { companies, ...showData } = show;

    // Cast explicite pour les champs enum (Supabase les renvoie comme string)
    const showWithRelations: ShowWithRelations = {
      ...showData,
      status: showData.status as ShowStatus,
      price_type: showData.price_type as ShowPriceType,
      company_name: companyData?.name || 'Compagnie inconnue',
      category_ids: (categoryMappings || []).map(m => m.category_id),
      target_audience_ids: (audienceMappings || []).map(m => m.target_audience_id),
      representations_count: slotsCount || 0,
    };

    return { data: showWithRelations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getShowById', { message });
    return { data: null, error: message };
  }
}

/**
 * Crée un nouveau spectacle avec ses relations N-N
 * Le slug est généré automatiquement à partir du titre (avec unicité garantie)
 */
export async function createShow(
  input: ShowWithRelationsInput
): Promise<{ data: ShowWithRelations | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { show, category_ids = [], target_audience_ids = [] } = input;

    // Vérifier que le titre est présent et non vide (requis pour la création)
    const showInsert = show as ShowInsert;
    if (!showInsert.title || !showInsert.title.trim()) {
      return { data: null, error: 'Le titre est requis pour créer un spectacle' };
    }

    // Générer un slug unique à partir du titre
    let uniqueSlug: string;
    try {
      uniqueSlug = await generateUniqueSlug(showInsert.title);
    } catch (err) {
      // generateUniqueSlug peut lancer une erreur si le slug généré est vide
      const errorMessage = err instanceof Error ? err.message : 'Le titre doit contenir au moins un caractère alphanumérique';
      return { data: null, error: errorMessage };
    }

    // Vérification de sécurité supplémentaire (ne devrait jamais être nécessaire si generateUniqueSlug fonctionne correctement)
    if (!uniqueSlug || !uniqueSlug.trim()) {
      return { data: null, error: 'Le titre doit contenir au moins un caractère alphanumérique' };
    }

    // Remplacer le slug fourni par le slug unique généré
    const showWithUniqueSlug: ShowInsert = {
      ...showInsert,
      slug: uniqueSlug,
    };

    // 1. Créer le spectacle
    const { data: newShow, error: showError } = await supabase
      .from('shows')
      .insert(showWithUniqueSlug)
      .select(`
        *,
        companies!inner(name)
      `)
      .single();

    if (showError) {
      logger.error('Erreur création show', showError);
      return { data: null, error: showError.message };
    }

    // 2. Créer les mappings catégories
    if (category_ids.length > 0) {
      const categoryMappings = category_ids.map(category_id => ({
        show_id: newShow.id,
        category_id,
      }));

      const { error: catError } = await supabase
        .from('show_category_mapping')
        .insert(categoryMappings);

      if (catError) {
        logger.error('Erreur création category mappings', catError);
        // On ne fait pas de rollback, le show est créé
      }
    }

    // 3. Créer les mappings target audiences
    if (target_audience_ids.length > 0) {
      const audienceMappings = target_audience_ids.map(target_audience_id => ({
        show_id: newShow.id,
        target_audience_id,
      }));

      const { error: audError } = await supabase
        .from('show_target_audience_mapping')
        .insert(audienceMappings);

      if (audError) {
        logger.error('Erreur création audience mappings', audError);
      }
    }

    // Construire le résultat
    const companyData = newShow.companies as { name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { companies, ...showData } = newShow;

    // Cast explicite pour les champs enum (Supabase les renvoie comme string)
    const result: ShowWithRelations = {
      ...showData,
      status: showData.status as ShowStatus,
      price_type: showData.price_type as ShowPriceType,
      company_name: companyData?.name || 'Compagnie inconnue',
      category_ids,
      target_audience_ids,
      representations_count: 0,
    };

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
 */
export async function updateShow(
  id: string,
  input: ShowWithRelationsInput
): Promise<{ data: ShowWithRelations | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { show, category_ids, target_audience_ids } = input;

    // 1. Mettre à jour le spectacle
    const { data: updatedShow, error: showError } = await supabase
      .from('shows')
      .update(show as ShowUpdate)
      .eq('id', id)
      .is('deleted_at', null)
      .select(`
        *,
        companies!inner(name)
      `)
      .single();

    if (showError) {
      logger.error('Erreur mise à jour show', { id, error: showError.message });
      return { data: null, error: showError.message };
    }

    // 2. Mettre à jour les mappings catégories (si fournis)
    if (category_ids !== undefined) {
      // Supprimer les anciens mappings
      await supabase
        .from('show_category_mapping')
        .delete()
        .eq('show_id', id);

      // Créer les nouveaux mappings
      if (category_ids.length > 0) {
        const categoryMappings = category_ids.map(category_id => ({
          show_id: id,
          category_id,
        }));

        const { error: catError } = await supabase
          .from('show_category_mapping')
          .insert(categoryMappings);

        if (catError) {
          logger.error('Erreur mise à jour category mappings', catError);
        }
      }
    }

    // 3. Mettre à jour les mappings target audiences (si fournis)
    if (target_audience_ids !== undefined) {
      // Supprimer les anciens mappings
      await supabase
        .from('show_target_audience_mapping')
        .delete()
        .eq('show_id', id);

      // Créer les nouveaux mappings
      if (target_audience_ids.length > 0) {
        const audienceMappings = target_audience_ids.map(target_audience_id => ({
          show_id: id,
          target_audience_id,
        }));

        const { error: audError } = await supabase
          .from('show_target_audience_mapping')
          .insert(audienceMappings);

        if (audError) {
          logger.error('Erreur mise à jour audience mappings', audError);
        }
      }
    }

    // Compter les slots actuels
    const { count: slotsCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', id);

    // Construire le résultat
    const companyData = updatedShow.companies as { name: string } | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { companies, ...showData } = updatedShow;

    // Récupérer les mappings actuels si non fournis
    let finalCategoryIds = category_ids;
    let finalAudienceIds = target_audience_ids;

    if (finalCategoryIds === undefined) {
      const { data: catMappings } = await supabase
        .from('show_category_mapping')
        .select('category_id')
        .eq('show_id', id);
      finalCategoryIds = (catMappings || []).map(m => m.category_id);
    }

    if (finalAudienceIds === undefined) {
      const { data: audMappings } = await supabase
        .from('show_target_audience_mapping')
        .select('target_audience_id')
        .eq('show_id', id);
      finalAudienceIds = (audMappings || []).map(m => m.target_audience_id);
    }

    // Cast explicite pour les champs enum (Supabase les renvoie comme string)
    const result: ShowWithRelations = {
      ...showData,
      status: showData.status as ShowStatus,
      price_type: showData.price_type as ShowPriceType,
      company_name: companyData?.name || 'Compagnie inconnue',
      category_ids: finalCategoryIds,
      target_audience_ids: finalAudienceIds,
      representations_count: slotsCount || 0,
    };

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

    // Cast explicite pour les champs enum (Supabase les renvoie comme string)
    const typedData: ShowRow = {
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

/**
 * Vérifie si un spectacle est utilisé par des slots (représentations)
 */
export async function isShowUsed(id: string): Promise<{ used: boolean; count: number; error: string | null }> {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('show_id', id);

    if (error) {
      logger.error('Erreur vérification utilisation show', { id, error: error.message });
      return { used: false, count: 0, error: error.message };
    }

    return { used: (count || 0) > 0, count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception isShowUsed', { message });
    return { used: false, count: 0, error: message };
  }
}

/**
 * Génère un slug à partir du titre (sans vérification d'unicité)
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9]+/g, '-')     // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '')         // Retirer les tirets en début et fin
    .substring(0, 100);              // Limiter la longueur
}

/**
 * Génère un slug unique à partir du titre
 * Si le slug existe déjà, ajoute un suffixe numérique (-2, -3, etc.)
 * En cas d'erreur de requête, retourne le slug de base (la contrainte UNIQUE en BDD gèrera les doublons)
 * @throws Si le slug généré est vide (titre invalide)
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const supabase = createClient();
  const baseSlug = generateSlug(title);

  // Vérifier que le slug de base n'est pas vide
  // Cela peut arriver si le titre ne contient que des caractères spéciaux ou des espaces
  if (!baseSlug || !baseSlug.trim()) {
    throw new Error('Le titre doit contenir au moins un caractère alphanumérique pour générer un slug valide');
  }

  // Chercher tous les slugs qui commencent par le slug de base
  const { data: existing, error } = await supabase
    .from('shows')
    .select('slug')
    .like('slug', `${baseSlug}%`)
    .is('deleted_at', null);

  // En cas d'erreur de requête, on retourne le slug de base
  // La contrainte UNIQUE en BDD gèrera les doublons si nécessaire
  if (error) {
    logger.error('Erreur recherche slugs existants', { error: error.message, baseSlug });
    return baseSlug;
  }

  // Si aucun résultat, le slug de base est disponible
  if (!existing || existing.length === 0) {
    return baseSlug;
  }

  // Créer un Set pour recherche rapide
  const existingSlugs = new Set(existing.map(s => s.slug));

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
