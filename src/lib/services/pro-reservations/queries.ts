/**
 * Requêtes de créneaux et disponibilité pour les professionnels
 *
 * @module pro-reservations/queries
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { ProAvailableSlot, ProAvailableSlotsResult } from './types';

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Récupère les créneaux disponibles d'un spectacle (hors créneau actuel de la résa)
 * Filtre uniquement les créneaux futurs avec de la capacité restante
 *
 * @param showId - UUID du spectacle
 * @param currentSlotId - UUID du créneau actuel (exclu des résultats)
 * @param numPlaces - Nombre de places nécessaires (filtre sur remaining_capacity)
 */
export async function getProAvailableSlotsForShow(
  showId: string,
  currentSlotId: string,
  numPlaces: number
): Promise<ProAvailableSlotsResult> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        remaining_capacity,
        venues (
          name,
          city
        )
      `)
      .eq('show_id', showId)
      .neq('id', currentSlotId)
      .gte('date', today)
      .gte('remaining_capacity', numPlaces)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('Erreur chargement créneaux disponibles', { showId, error: error.message });
      return { data: null, error: error.message };
    }

    interface RawAvailableSlot {
      id: string;
      date: string;
      time: string;
      remaining_capacity: number;
      venues: { name: string; city: string } | null;
    }

    const slots: ProAvailableSlot[] = ((data ?? []) as unknown as RawAvailableSlot[]).map((s) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      remaining_capacity: s.remaining_capacity,
      venue_name: s.venues?.name ?? null,
      venue_city: s.venues?.city ?? null,
    }));

    return { data: slots, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getProAvailableSlotsForShow', { showId, message });
    return { data: null, error: message };
  }
}
