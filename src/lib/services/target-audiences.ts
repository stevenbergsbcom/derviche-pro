/**
 * Service Target Audiences - CRUD pour la table target_audiences
 * Derviche Diffusion
 * 
 * Gère les publics cibles des spectacles
 */

import { createClient } from '@/lib/supabase/client';
import type { TargetAudienceRow, TargetAudienceInsert, TargetAudienceUpdate } from '@/types/database';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';
import { cleanupOrphanMappings } from '@/lib/utils/orphan-cleanup';

// ============================================
// TYPES
// ============================================

export interface TargetAudienceResult {
  data: TargetAudienceRow | null;
  error: string | null;
}

export interface TargetAudiencesResult {
  data: TargetAudienceRow[];
  error: string | null;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère tous les publics cibles
 * Triés par ordre d'affichage
 */
export async function getTargetAudiences(): Promise<TargetAudiencesResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('target_audiences')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Erreur récupération target_audiences', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getTargetAudiences', { message });
    return { data: [], error: message };
  }
}

/**
 * Crée un nouveau public cible
 */
export async function createTargetAudience(audience: TargetAudienceInsert): Promise<TargetAudienceResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('target_audiences')
      .insert(audience)
      .select()
      .single();

    if (error) {
      logger.error('Erreur création target_audience', error);
      return { data: null, error: error.message };
    }

    logger.info(`TargetAudience créé: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'show',
      action: 'audience_create',
      success: true,
      details: { audience_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createTargetAudience', { message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour un public cible
 */
export async function updateTargetAudience(id: string, audience: TargetAudienceUpdate): Promise<TargetAudienceResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('target_audiences')
      .update(audience)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erreur mise à jour target_audience', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`TargetAudience mis à jour: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'show',
      action: 'audience_update',
      success: true,
      details: { audience_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateTargetAudience', { message });
    return { data: null, error: message };
  }
}

/**
 * Supprime un public cible (seulement si non utilisé par des spectacles actifs)
 * Nettoie d'abord les mappings orphelins (liés à des spectacles supprimés)
 */
export async function deleteTargetAudience(id: string): Promise<TargetAudienceResult> {
  try {
    const supabase = createClient();
    
    // Nettoyer les mappings orphelins (spectacles soft-deleted)
    await cleanupOrphanMappings(supabase, 'show_target_audience_mapping', 'target_audience_id', id);
    
    // Maintenant supprimer le public cible
    const { data, error } = await supabase
      .from('target_audiences')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erreur suppression target_audience', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`TargetAudience supprimé: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'show',
      action: 'audience_delete',
      success: true,
      details: { audience_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteTargetAudience', { message });
    return { data: null, error: message };
  }
}

/**
 * Vérifie si un public cible est utilisé par des spectacles ACTIFS (non supprimés)
 */
export async function isTargetAudienceUsed(id: string): Promise<{ used: boolean; count: number; error: string | null }> {
  try {
    const supabase = createClient();
    
    // Récupérer les mappings avec les infos du spectacle
    const { data, error } = await supabase
      .from('show_target_audience_mapping')
      .select('show_id, shows(id, deleted_at)')
      .eq('target_audience_id', id);

    if (error) {
      logger.error('Erreur vérification utilisation target_audience', { id, error: error.message });
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
    logger.error('Exception isTargetAudienceUsed', { message });
    return { used: false, count: 0, error: message };
  }
}

/**
 * Génère un slug à partir du nom
 */
export function generateTargetAudienceSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
