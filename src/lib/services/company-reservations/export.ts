/**
 * Export des réservations compagnie (sans pagination)
 * Derviche Diffusion
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { buildSearchOrClause } from '@/lib/utils';
import type { CompanyReservationFilters, CompanyReservation } from './types';
import { transformReservation, getEffectiveDateFilters } from './transformers';

/**
 * Récupère TOUTES les réservations pour export (sans pagination)
 * Applique les mêmes filtres que la liste paginée
 */
export async function getAllCompanyReservationsForExport(
  filters: CompanyReservationFilters = {}
): Promise<{ data: CompanyReservation[]; error: string | null }> {
  try {
    const supabase = createClient();

    // Calculer les filtres de date effectifs
    const effectiveDates = getEffectiveDateFilters(filters);

    // Construction de la requête de base
    let query = supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_email_secondary,
        guest_phone_secondary,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_structure,
        guest_function,
        guest_afc_number,
        num_places,
        status,
        special_requests,
        checkin_status,
        checkin_at,
        checkin_comment,
        checkin_venue_notes,
        created_at,
        cancelled_at,
        cancellation_reason,
        slots!inner (
          id,
          date,
          time,
          capacity,
          remaining_capacity,
          hosted_by,
          venues (
            id,
            name,
            city
          ),
          shows!inner (
            id,
            title,
            slug
          )
        )
      `);

    // Appliquer les mêmes filtres
    if (filters.showId) {
      query = query.eq('slots.show_id', filters.showId);
    }

    if (filters.slotId) {
      query = query.eq('slot_id', filters.slotId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.checkinStatus) {
      query = query.eq('checkin_status', filters.checkinStatus);
    }

    // Appliquer les filtres de date effectifs
    if (effectiveDates.dateFrom) {
      query = query.gte('slots.date', effectiveDates.dateFrom);
    }

    if (effectiveDates.dateTo) {
      query = query.lte('slots.date', effectiveDates.dateTo);
    }

    if (filters.search) {
      const searchClause = buildSearchOrClause(
        filters.search,
        ['guest_email', 'guest_first_name', 'guest_last_name']
      );
      if (searchClause) {
        query = query.or(searchClause);
      }
    }

    // Tri aligné sur l'UI (filters.sortBy) — le fichier exporté reflète
    // exactement l'ordre choisi à l'écran.
    // Note: slot_date/slot_time dénormalisées (migration 080) — .order({ referencedTable })
    // ne trie pas la table parente en Supabase JS.
    // ⚠ Garder cette logique SYNCHRONE avec `list.ts` L116-144.
    const sortBy = filters.sortBy || 'slot_date_asc';
    switch (sortBy) {
      case 'slot_date_asc':
        query = query
          .order('slot_date', { ascending: true })
          .order('slot_time', { ascending: true })
          .order('guest_last_name', { ascending: true });
        break;
      case 'slot_date_desc':
        query = query
          .order('slot_date', { ascending: false })
          .order('slot_time', { ascending: false })
          .order('guest_last_name', { ascending: true });
        break;
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'created_at_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name_asc':
        query = query
          .order('guest_last_name', { ascending: true })
          .order('guest_first_name', { ascending: true });
        break;
      case 'name_desc':
        query = query
          .order('guest_last_name', { ascending: false })
          .order('guest_first_name', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[company-reservations] Erreur récupération pour export', error);
      return { data: [], error: error.message };
    }

    const reservations = (data || []).map(row =>
      transformReservation(row as Parameters<typeof transformReservation>[0])
    );

    logger.info(`[company-reservations] Export: ${reservations.length} réservations récupérées`);
    return { data: reservations, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getAllCompanyReservationsForExport', { message });
    return { data: [], error: message };
  }
}
