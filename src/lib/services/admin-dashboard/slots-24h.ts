/**
 * Slots 24h - Admin Dashboard Service
 * Derviche Diffusion
 *
 * Récupère les créneaux ayant lieu dans les prochaines 24 heures.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Slot24h, AdminDashboardOptions, QueryResult } from './types';

/**
 * Récupère les créneaux dans les 24 prochaines heures.
 * Triés par date + heure croissante.
 *
 * @param options - Options de filtrage (assignedShowIds pour les externes)
 */
export async function getSlots24h(
  options?: AdminDashboardOptions
): Promise<QueryResult<Slot24h[]>> {
  try {
    const supabase = createClient();
    const { assignedShowIds } = options || {};

    // Bornes : maintenant → maintenant + 24h
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Utiliser l'heure locale (pas UTC) pour éviter le décalage de timezone
    const toLocalDateISO = (d: Date) => {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${da}`;
    };

    const todayISO = toLocalDateISO(now);
    const tomorrowISO = toLocalDateISO(in24h);

    // Récupérer les slots dans la fenêtre [today, tomorrow] avec leurs détails
    let query = supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        show_id,
        shows!inner ( title, slug ),
        venues!inner ( name )
      `)
      .gte('date', todayISO)
      .lte('date', tomorrowISO)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (assignedShowIds && assignedShowIds.length > 0) {
      query = query.in('show_id', assignedShowIds);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      logger.error('Erreur getSlots24h', { error: slotsError.message });
      return { data: [], error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }

    // Récupérer le count de réservations pour chaque slot
    const slotIds = slots.map((s) => s.id);

    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('slot_id')
      .eq('status', 'confirmed')
      .in('slot_id', slotIds);

    if (resError) {
      logger.error('Erreur comptage réservations slots24h', { error: resError.message });
    }

    const countBySlot = new Map<string, number>();
    for (const r of reservations ?? []) {
      countBySlot.set(r.slot_id, (countBySlot.get(r.slot_id) ?? 0) + 1);
    }

    // Filtrer strictement par datetime (pas juste par date)
    // Un créneau du lendemain peut être hors fenêtre si son heure dépasse celle dans 24h
    const nowTime = now.getTime();
    const in24hTime = in24h.getTime();

    const result: Slot24h[] = slots
      .filter((slot) => {
        // Reconstruire un datetime pour ce slot
        const slotDatetime = new Date(`${slot.date}T${slot.time}`);
        const slotTime = slotDatetime.getTime();
        return slotTime >= nowTime && slotTime <= in24hTime;
      })
      .map((slot) => {
        // Supabase retourne les jointures comme objets ou tableaux selon la relation
        const show = Array.isArray(slot.shows) ? slot.shows[0] : slot.shows;
        const venue = Array.isArray(slot.venues) ? slot.venues[0] : slot.venues;

        return {
          id: slot.id,
          date: slot.date,
          time: slot.time,
          show_title: (show as { title: string; slug: string } | null)?.title ?? '',
          show_slug: (show as { title: string; slug: string } | null)?.slug ?? '',
          venue_name: (venue as { name: string } | null)?.name ?? '',
          reservations_count: countBySlot.get(slot.id) ?? 0,
        };
      });

    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getSlots24h', { message });
    return { data: [], error: message };
  }
}
