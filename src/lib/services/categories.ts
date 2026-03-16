/**
 * Service Categories - CRUD pour la table show_categories
 * Derviche Diffusion
 * 
 * Gère les catégories de spectacles
 */

import { createClient } from '@/lib/supabase/client';
import type { ShowCategoryRow, ShowCategoryInsert, ShowCategoryUpdate } from '@/types/database';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';
import { cleanupOrphanMappings } from '@/lib/utils/orphan-cleanup';

// ============================================
// TYPES
// ============================================

export interface CategoryResult {
  data: ShowCategoryRow | null;
  error: string | null;
}

export interface CategoriesResult {
  data: ShowCategoryRow[];
  error: string | null;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère toutes les catégories
 * Triées par ordre d'affichage
 */
export async function getCategories(): Promise<CategoriesResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('show_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Erreur récupération categories', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getCategories', { message });
    return { data: [], error: message };
  }
}

/**
 * Crée une nouvelle catégorie
 */
export async function createCategory(category: ShowCategoryInsert): Promise<CategoryResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('show_categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      logger.error('Erreur création category', error);
      return { data: null, error: error.message };
    }

    logger.info(`Category créée: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'show',
      action: 'category_create',
      success: true,
      details: { category_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createCategory', { message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour une catégorie
 */
export async function updateCategory(id: string, category: ShowCategoryUpdate): Promise<CategoryResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('show_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erreur mise à jour category', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`Category mise à jour: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'show',
      action: 'category_update',
      success: true,
      details: { category_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateCategory', { message });
    return { data: null, error: message };
  }
}

/**
 * Supprime une catégorie (seulement si non utilisée par des spectacles actifs)
 * Nettoie d'abord les mappings orphelins (liés à des spectacles supprimés)
 */
export async function deleteCategory(id: string): Promise<CategoryResult> {
  try {
    const supabase = createClient();
    
    // Nettoyer les mappings orphelins (spectacles soft-deleted)
    await cleanupOrphanMappings(supabase, 'show_category_mapping', 'category_id', id);
    
    // Maintenant supprimer la catégorie
    const { data, error } = await supabase
      .from('show_categories')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erreur suppression category', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`Category supprimée: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'show',
      action: 'category_delete',
      success: true,
      details: { category_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteCategory', { message });
    return { data: null, error: message };
  }
}

/**
 * Vérifie si une catégorie est utilisée par des spectacles ACTIFS (non supprimés)
 */
export async function isCategoryUsed(id: string): Promise<{ used: boolean; count: number; error: string | null }> {
  try {
    const supabase = createClient();
    
    // Récupérer les mappings avec les infos du spectacle
    const { data, error } = await supabase
      .from('show_category_mapping')
      .select('show_id, shows(id, deleted_at)')
      .eq('category_id', id);

    if (error) {
      logger.error('Erreur vérification utilisation category', { id, error: error.message });
      return { used: false, count: 0, error: error.message };
    }

    // Filtrer pour ne garder que les spectacles actifs (deleted_at === null)
    const activeCount = data?.filter(row => {
      const show = row.shows as { deleted_at: string | null } | null;
      return show && show.deleted_at === null;
    }).length || 0;

    return { used: activeCount > 0, count: activeCount, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception isCategoryUsed', { message });
    return { used: false, count: 0, error: message };
  }
}

/**
 * Génère un slug à partir du nom
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
