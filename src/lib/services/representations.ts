/**
 * Service Representations - CRUD pour la table slots
 * Derviche Diffusion
 * 
 * Gère toutes les opérations sur les représentations (créneaux de spectacles)
 * Note : capacity = 0 signifie "places illimitées"
 */

import { createClient } from '@/lib/supabase/client';
import type { SlotRow, SlotInsert, SlotUpdate } from '@/types/database';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Données du lieu associé à un slot */
export interface SlotVenue {
  id: string;
  name: string;
  city: string;
}

/** Données de l'utilisateur responsable de l'accueil */
export interface SlotHostedByUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

/** Slot avec ses relations (venue + hosted_by user) */
export interface SlotWithRelations extends SlotRow {
  venue: SlotVenue | null;
  hosted_by_user: SlotHostedByUser | null;
}

/** Résultat d'une opération sur un slot */
export interface SlotResult {
  data: SlotWithRelations | null;
  error: string | null;
}

/** Résultat d'une opération sur plusieurs slots */
export interface SlotsResult {
  data: SlotWithRelations[];
  error: string | null;
}

/** Résultat de création multiple */
export interface SlotsBatchResult {
  data: SlotRow[];
  error: string | null;
  count: number;
}

// ============================================
// FONCTIONS CRUD
// ============================================

/**
 * Récupère toutes les représentations d'un spectacle
 * Avec JOIN sur venues et profiles (hosted_by)
 * Triées par date puis heure
 */
export async function getRepresentationsByShowId(showId: string): Promise<SlotsResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('slots')
      .select(`
        *,
        venue:venues!slots_venue_id_fkey (
          id,
          name,
          city
        ),
        hosted_by_user:profiles!slots_hosted_by_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('show_id', showId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('Erreur récupération representations', { showId, error: error.message });
      return { data: [], error: error.message };
    }

    // Typage explicite du résultat
    const slots = (data || []) as SlotWithRelations[];
    
    return { data: slots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getRepresentationsByShowId', { showId, message });
    return { data: [], error: message };
  }
}

/**
 * Récupère une représentation par son ID avec ses relations
 */
export async function getRepresentationById(id: string): Promise<SlotResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('slots')
      .select(`
        *,
        venue:venues!slots_venue_id_fkey (
          id,
          name,
          city
        ),
        hosted_by_user:profiles!slots_hosted_by_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Erreur récupération representation', { id, error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data as SlotWithRelations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getRepresentationById', { id, message });
    return { data: null, error: message };
  }
}

/**
 * Crée une nouvelle représentation
 */
export async function createRepresentation(slot: SlotInsert): Promise<SlotResult> {
  try {
    const supabase = createClient();
    
    // Créer le slot
    const { data: newSlot, error: insertError } = await supabase
      .from('slots')
      .insert(slot)
      .select()
      .single();

    if (insertError) {
      logger.error('Erreur création representation', insertError);
      return { data: null, error: insertError.message };
    }

    // Récupérer avec les relations
    const result = await getRepresentationById(newSlot.id);
    
    if (result.data) {
      logger.info(`Representation créée: ${newSlot.date} ${newSlot.time} (${newSlot.id})`);
    }
    
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createRepresentation', { message });
    return { data: null, error: message };
  }
}

/**
 * Crée plusieurs représentations en batch (pour génération de série)
 */
export async function createMultipleRepresentations(slots: SlotInsert[]): Promise<SlotsBatchResult> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('slots')
      .insert(slots)
      .select();

    if (error) {
      logger.error('Erreur création batch representations', error);
      return { data: [], error: error.message, count: 0 };
    }

    // Cast explicite car Supabase retourne hosted_by comme string
    const createdSlots = (data || []) as SlotRow[];
    logger.info(`${createdSlots.length} representations créées en batch`);
    
    return { data: createdSlots, error: null, count: createdSlots.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception createMultipleRepresentations', { message });
    return { data: [], error: message, count: 0 };
  }
}

/**
 * Met à jour une représentation existante
 */
export async function updateRepresentation(id: string, slot: SlotUpdate): Promise<SlotResult> {
  try {
    const supabase = createClient();
    
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update(slot)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Erreur mise à jour representation', { id, error: updateError.message });
      return { data: null, error: updateError.message };
    }

    // Récupérer avec les relations
    const result = await getRepresentationById(updatedSlot.id);
    
    if (result.data) {
      logger.info(`Representation mise à jour: ${updatedSlot.date} ${updatedSlot.time} (${updatedSlot.id})`);
    }
    
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception updateRepresentation', { id, message });
    return { data: null, error: message };
  }
}

/**
 * Supprime une représentation (suppression définitive)
 * Note : Les slots n'ont pas de soft delete
 */
export async function deleteRepresentation(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Erreur suppression representation', { id, error: error.message });
      return { success: false, error: error.message };
    }

    logger.info(`Representation supprimée: ${id}`);
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception deleteRepresentation', { id, message });
    return { success: false, error: message };
  }
}

/**
 * Compte les réservations existantes pour un slot
 * Utilisé pour avertir avant suppression
 */
export async function countReservationsForSlot(slotId: string): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { count, error } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('slot_id', slotId)
      .neq('status', 'cancelled'); // Ne pas compter les réservations annulées

    if (error) {
      logger.error('Erreur comptage reservations', { slotId, error: error.message });
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception countReservationsForSlot', { slotId, message });
    return { count: 0, error: message };
  }
}

/**
 * Vérifie si un slot a des réservations (helper boolean)
 */
export async function hasReservations(slotId: string): Promise<{ hasReservations: boolean; count: number; error: string | null }> {
  const result = await countReservationsForSlot(slotId);
  return {
    hasReservations: result.count > 0,
    count: result.count,
    error: result.error,
  };
}
