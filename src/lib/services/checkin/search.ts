/**
 * Recherche globale de réservations pour la PWA check-in
 * Derviche Diffusion
 *
 * Recherche par nom, prénom, email ou structure sur toutes les réservations
 * accessibles selon le rôle de l'utilisateur.
 *
 * Sécurité :
 * - super-admin / admin : toutes les réservations
 * - externe : uniquement les slots dont il est hosted_by_id
 * - company : uniquement les slots de ses spectacles (hosted_by = 'company')
 * - role null ou inconnu : aucun résultat (défense en profondeur)
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { CheckinStatus } from '@/types/database';
import { ADMIN_ROLES } from './constants';

// ============================================
// TYPES
// ============================================

export interface GlobalSearchResult {
  reservationId: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestStructure: string | null;
  numPlaces: number;
  status: 'confirmed' | 'cancelled' | 'no_show';
  checkinStatus: CheckinStatus | null;
  // Slot
  slotId: string;
  slotDate: string;
  slotTime: string;
  // Show
  showTitle: string;
  showSlug: string;
  // Venue
  venueName: string;
}

export interface GlobalSearchResults {
  data: GlobalSearchResult[];
  error: string | null;
}

// ============================================
// CONSTANTES
// ============================================

const MAX_RESULTS = 20;
const MIN_QUERY_LENGTH = 2;

/** Rôles autorisés pour la recherche globale */
const ALLOWED_SEARCH_ROLES: UserRole[] = ['super-admin', 'admin', 'externe', 'company'];

/**
 * Échappe les caractères spéciaux ILIKE (%, _, \)
 * pour éviter les matchs non intentionnels
 */
function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Recherche des réservations dans toute la base selon la query.
 * Cherche sur : prénom, nom, email, structure (insensible à la casse).
 */
export async function searchReservations(
  query: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<GlobalSearchResults> {
  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { data: [], error: null };
  }

  // Défense en profondeur : bloquer role null ou non autorisé
  if (!role || !ALLOWED_SEARCH_ROLES.includes(role)) {
    logger.warn('checkin.searchReservations - Rôle non autorisé', { role });
    return { data: [], error: null };
  }

  try {
    logger.info('checkin.searchReservations - Début', { query: trimmed, role });

    const supabase = createClient();

    // Échapper les wildcards ILIKE pour éviter les matchs non voulus
    const escaped = escapeIlike(trimmed);
    const searchPattern = `%${escaped}%`;

    // Construction de la requête de base
    let queryBuilder = supabase
      .from('reservations')
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_structure,
        num_places,
        status,
        checkin_status,
        slots!inner (
          id,
          date,
          time,
          hosted_by,
          hosted_by_id,
          venues (
            name
          ),
          shows!inner (
            id,
            slug,
            title,
            company_id
          )
        )
      `)
      .or(
        `guest_first_name.ilike.${searchPattern},guest_last_name.ilike.${searchPattern},guest_email.ilike.${searchPattern},guest_structure.ilike.${searchPattern}`
      )
      .limit(MAX_RESULTS);

    // Filtres selon le rôle (admin = pas de filtre)
    if (!ADMIN_ROLES.includes(role)) {
      if (role === 'externe') {
        queryBuilder = queryBuilder.eq('slots.hosted_by_id', userId);
      } else if (role === 'company' && companyId) {
        queryBuilder = queryBuilder
          .eq('slots.hosted_by', 'company')
          .eq('slots.shows.company_id', companyId);
      } else {
        return { data: [], error: null };
      }
    }

    const { data, error } = await queryBuilder;

    if (error) {
      logger.error('checkin.searchReservations - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Transformer les données
    const results: GlobalSearchResult[] = data.map((row) => {
      const slot = row.slots as unknown as {
        id: string;
        date: string;
        time: string;
        hosted_by: string;
        hosted_by_id: string | null;
        venues: { name: string } | null;
        shows: { id: string; slug: string; title: string; company_id: string };
      };

      return {
        reservationId: row.id,
        guestFirstName: row.guest_first_name,
        guestLastName: row.guest_last_name,
        guestEmail: row.guest_email,
        guestStructure: row.guest_structure,
        numPlaces: row.num_places,
        status: row.status as 'confirmed' | 'cancelled' | 'no_show',
        checkinStatus: row.checkin_status as CheckinStatus | null,
        slotId: slot.id,
        slotDate: slot.date,
        slotTime: slot.time,
        showTitle: slot.shows.title,
        showSlug: slot.shows.slug,
        venueName: slot.venues?.name ?? 'Lieu inconnu',
      };
    });

    // Trier : confirmées en premier, puis no_show, puis annulées
    const statusOrder: Record<string, number> = { confirmed: 0, no_show: 1, cancelled: 2 };
    results.sort(
      (a, b) =>
        (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3) ||
        a.slotDate.localeCompare(b.slotDate)
    );

    logger.info('checkin.searchReservations - Succès', { count: results.length });
    return { data: results, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.searchReservations - Exception', { error: message });
    return { data: [], error: message };
  }
}
