/**
 * Service Venues - CRUD pour la table venues
 * Derviche Diffusion
 * 
 * Gère toutes les opérations sur les lieux/salles de spectacle
 */

import { createClient } from '@/lib/supabase/client';
import type { VenueRow, VenueInsert, VenueUpdate } from '@/types/database';
import { logger } from '@/lib/logger';
import { logActivityClient } from '@/lib/services/logs/client';

// ============================================
// TYPES
// ============================================

/** Résultat d'une opération sur un venue */
export interface VenueResult {
  data: VenueRow | null;
  error: string | null;
}

/** Résultat d'une opération sur plusieurs venues */
export interface VenuesResult {
  data: VenueRow[];
  error: string | null;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère tous les lieux non supprimés
 * Triés par nom
 */
export async function getVenues(): Promise<VenuesResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Erreur récupération venues', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getVenues', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère un lieu par son ID
 */
export async function getVenueById(id: string): Promise<VenueResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Erreur récupération venue', { id, error: error.message });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getVenueById', { message });
    return { data: null, error: message };
  }
}

/**
 * Crée un nouveau lieu
 */
export async function createVenue(venue: VenueInsert): Promise<VenueResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single();

    if (error) {
      logger.error('Erreur création venue', error);
      return { data: null, error: error.message };
    }

    logger.info(`Venue créé: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'system',
      action: 'venue_create',
      success: true,
      details: { venue_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createVenue', { message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour un lieu existant
 */
export async function updateVenue(id: string, venue: VenueUpdate): Promise<VenueResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('venues')
      .update(venue)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Erreur mise à jour venue', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`Venue mis à jour: ${data.name} (${data.id})`);
    logActivityClient({
      category: 'system',
      action: 'venue_update',
      success: true,
      details: { venue_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateVenue', { message });
    return { data: null, error: message };
  }
}

/**
 * Supprime un lieu (soft delete)
 * Met deleted_at à la date actuelle au lieu de supprimer réellement
 */
export async function deleteVenue(id: string): Promise<VenueResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('venues')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Erreur suppression venue', { id, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info(`Venue supprimé (soft): ${data.name} (${data.id})`);
    logActivityClient({
      category: 'system',
      action: 'venue_delete',
      success: true,
      details: { venue_id: data.id, name: data.name },
    });
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteVenue', { message });
    return { data: null, error: message };
  }
}

/**
 * Vérifie si un lieu est utilisé par des slots (représentations)
 * Retourne true si le lieu est utilisé, false sinon
 */
export async function isVenueUsed(id: string): Promise<{ used: boolean; count: number; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { count, error } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', id);

    if (error) {
      logger.error('Erreur vérification utilisation venue', { id, error: error.message });
      return { used: false, count: 0, error: error.message };
    }

    return { used: (count || 0) > 0, count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception isVenueUsed', { message });
    return { used: false, count: 0, error: message };
  }
}
