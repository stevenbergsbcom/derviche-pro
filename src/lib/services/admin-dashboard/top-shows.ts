/**
 * Top Shows - Admin Dashboard Service
 * Derviche Diffusion
 *
 * Récupère les 3 spectacles avec le plus de réservations confirmées.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { TopShow, AdminDashboardOptions, QueryResult } from './types';
import { getTodayISO } from './helpers';

const TOP_SHOWS_LIMIT = 3;

/**
 * Récupère le top 3 des spectacles par nombre de réservations confirmées.
 *
 * Convention assignedShowIds :
 *   undefined | null → accès complet
 *   []               → externe sans assignation → []
 *   ['id', ...]      → externe filtré
 */
export async function getTopShows(
  options?: AdminDashboardOptions
): Promise<QueryResult<TopShow[]>> {
  try {
    const supabase = createClient();

    // Narrow : string[] si externe, null si accès complet
    const showIdFilter: string[] | null = Array.isArray(options?.assignedShowIds)
      ? options.assignedShowIds
      : null;

    const today = getTodayISO();

    // Externe sans assignation → liste vide
    if (showIdFilter !== null && showIdFilter.length === 0) {
      return { data: [], error: null };
    }

    // Récupérer les spectacles publiés (avec filtre éventuel)
    let showsQuery = supabase
      .from('shows')
      .select('id, title, slug')
      .eq('status', 'published')
      .is('deleted_at', null);

    if (showIdFilter !== null) {
      showsQuery = showsQuery.in('id', showIdFilter);
    }

    const { data: shows, error: showsError } = await showsQuery;

    if (showsError || !shows || shows.length === 0) {
      if (showsError) {
        logger.error('Erreur récupération spectacles top shows', { error: showsError.message });
      }
      return { data: [], error: showsError?.message ?? null };
    }

    const showIds = shows.map((s) => s.id);

    // Récupérer les créneaux pour ces spectacles
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, show_id, date')
      .in('show_id', showIds);

    if (slotsError) {
      logger.error('Erreur récupération slots top shows', { error: slotsError.message });
      return { data: [], error: slotsError.message };
    }

    const allSlotIds = slots?.map((s) => s.id) ?? [];

    if (allSlotIds.length === 0) {
      return { data: [], error: null };
    }

    // Récupérer toutes les réservations confirmées pour ces slots
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('slot_id')
      .eq('status', 'confirmed')
      .in('slot_id', allSlotIds);

    if (resError) {
      logger.error('Erreur récupération réservations top shows', { error: resError.message });
      return { data: [], error: resError.message };
    }

    // Agréger réservations par show_id via les slots
    const slotToShow = new Map<string, string>();
    for (const slot of slots ?? []) {
      slotToShow.set(slot.id, slot.show_id);
    }

    const resByShow = new Map<string, number>();
    for (const res of reservations ?? []) {
      const showId = slotToShow.get(res.slot_id);
      if (showId) {
        resByShow.set(showId, (resByShow.get(showId) ?? 0) + 1);
      }
    }

    // Compter les créneaux à venir par spectacle
    const upcomingByShow = new Map<string, number>();
    for (const slot of slots ?? []) {
      if (slot.date >= today) {
        upcomingByShow.set(slot.show_id, (upcomingByShow.get(slot.show_id) ?? 0) + 1);
      }
    }

    // Construire et trier le top
    const topShows: TopShow[] = shows
      .map((show) => ({
        id: show.id,
        title: show.title,
        slug: show.slug,
        reservations_count: resByShow.get(show.id) ?? 0,
        upcoming_slots_count: upcomingByShow.get(show.id) ?? 0,
      }))
      .sort((a, b) => b.reservations_count - a.reservations_count)
      .slice(0, TOP_SHOWS_LIMIT);

    return { data: topShows, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getTopShows', { message });
    return { data: [], error: message };
  }
}
