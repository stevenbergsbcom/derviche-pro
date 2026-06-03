/**
 * Liste et recherche des réservations compagnie
 * Derviche Diffusion
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { buildSearchOrClause } from '@/lib/utils';
import type { CompanyReservationFilters, PaginationOptions, CompanyReservationsResult } from './types';
import { transformReservation, getEffectiveDateFilters } from './transformers';

/**
 * Récupère la liste des réservations pour la compagnie connectée
 * Les RLS policies filtrent automatiquement par company_id
 */
export async function getCompanyReservations(
  filters: CompanyReservationFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): Promise<CompanyReservationsResult> {
  try {
    const supabase = createClient();
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // Calculer les filtres de date effectifs
    const effectiveDates = getEffectiveDateFilters(filters);

    // Construction de la requête de base
    // Note: Les RLS policies filtrent automatiquement par company_id
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
        guest_country,
        guest_structure,
        guest_function,
        guest_afc_number,
        crm_id,
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
      `, { count: 'exact' });

    // Appliquer les filtres
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

    // Tri (défaut: date représentation croissante)
    // Note: on utilise slot_date/slot_time (colonnes dénormalisées sur reservations, migration 080)
    // car .order({ referencedTable: 'slots' }) ne trie PAS la table parente en Supabase JS
    const sortBy = filters.sortBy || 'slot_date_asc';
    switch (sortBy) {
      case 'slot_date_asc':
        query = query
          .order('slot_date', { ascending: true })
          .order('slot_time', { ascending: true });
        break;
      case 'slot_date_desc':
        query = query
          .order('slot_date', { ascending: false })
          .order('slot_time', { ascending: false });
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

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('[company-reservations] Erreur récupération', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        error: error.message,
      };
    }

    const reservations = (data || []).map(row =>
      transformReservation(row as Parameters<typeof transformReservation>[0])
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    logger.info(`[company-reservations] ${reservations.length} réservations chargées (page ${page}/${totalPages})`);

    return {
      data: reservations,
      total,
      page,
      pageSize,
      totalPages,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getCompanyReservations', { message });
    return {
      data: [],
      total: 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: 0,
      error: message,
    };
  }
}

/**
 * Récupère les spectacles de la compagnie connectée (pour le filtre)
 * Filtre explicitement par company_id de l'utilisateur connecté
 */
export async function getCompanyShows(): Promise<{
  data: Array<{ id: string; title: string; slug: string }>;
  error: string | null;
}> {
  try {
    const supabase = createClient();

    // 1. Récupérer l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.error('[company-reservations] Utilisateur non connecté', { error: authError?.message });
      return { data: [], error: 'Utilisateur non connecté' };
    }

    // 2. Récupérer le company_id depuis le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      logger.error('[company-reservations] Profil ou company_id non trouvé', { error: profileError?.message });
      return { data: [], error: 'Compagnie non associée au profil' };
    }

    // 3. Récupérer les spectacles de cette compagnie uniquement
    const { data, error } = await supabase
      .from('shows')
      .select('id, title, slug')
      .eq('company_id', profile.company_id)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('title', { ascending: true });

    if (error) {
      logger.error('[company-reservations] Erreur récupération spectacles', error);
      return { data: [], error: error.message };
    }

    logger.info(`[company-reservations] ${(data || []).length} spectacle(s) chargé(s) pour compagnie ${profile.company_id}`);
    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[company-reservations] Exception getCompanyShows', { message });
    return { data: [], error: message };
  }
}
