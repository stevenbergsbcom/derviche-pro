/**
 * Helpers - Admin Dashboard Service
 * Derviche Diffusion
 * 
 * Fonctions utilitaires pour les calculs et requêtes communes
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// CONSTANTES
// ============================================

/** Valeur représentant une capacité illimitée dans la base de données */
export const UNLIMITED_CAPACITY = 999999;

// ============================================
// CALCULS DE CAPACITÉ
// ============================================

/**
 * Calcule le nombre de places réservées à partir de capacity et remaining_capacity
 * Utilise Math.max pour éviter les valeurs négatives
 * 
 * @param capacity - Capacité totale du créneau
 * @param remainingCapacity - Capacité restante
 * @returns Nombre de places réservées
 */
export function calculateBooked(capacity: number, remainingCapacity: number): number {
  // 999999 = capacité illimitée
  if (capacity === UNLIMITED_CAPACITY) {
    return Math.max(0, UNLIMITED_CAPACITY - remainingCapacity);
  }
  return Math.max(0, capacity - remainingCapacity);
}

/**
 * Calcule le taux de remplissage en pourcentage
 * 
 * @param capacity - Capacité totale du créneau
 * @param remainingCapacity - Capacité restante
 * @returns Taux de remplissage (0-100)
 */
export function calculateOccupancyRate(capacity: number, remainingCapacity: number): number {
  // Capacité illimitée ou nulle = pas de taux calculable
  if (capacity === UNLIMITED_CAPACITY || capacity === 0) {
    return 0;
  }
  const booked = calculateBooked(capacity, remainingCapacity);
  return Math.round((booked / capacity) * 100);
}

// ============================================
// CALCULS DE DATES
// ============================================

/**
 * Retourne la date du jour au format ISO (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retourne le début de la semaine courante (lundi) au format ISO
 */
export function getWeekStartISO(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return monday.toISOString().split('T')[0];
}

/**
 * Retourne les bornes de la journée au format ISO datetime
 */
export function getTodayBounds(): { start: string; end: string } {
  const today = getTodayISO();
  return {
    start: `${today}T00:00:00`,
    end: `${today}T23:59:59`,
  };
}

// ============================================
// REQUÊTES PARTAGÉES
// ============================================

/**
 * Récupère les slot_ids pour une liste de spectacles
 * Utilisé pour filtrer les réservations des utilisateurs externes
 * 
 * @param supabase - Client Supabase
 * @param showIds - Liste des show_id
 * @returns Liste des slot_id correspondants
 */
export async function getSlotIdsForShows(
  supabase: ReturnType<typeof createClient>,
  showIds: string[]
): Promise<{ slotIds: string[]; error: string | null }> {
  const { data: slots, error } = await supabase
    .from('slots')
    .select('id')
    .in('show_id', showIds);

  if (error) {
    logger.error('Erreur récupération slot_ids', { error: error.message });
    return { slotIds: [], error: error.message };
  }

  return { slotIds: slots?.map(s => s.id) ?? [], error: null };
}
