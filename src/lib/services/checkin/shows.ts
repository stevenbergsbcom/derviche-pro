/**
 * Fonctions Shows pour le service Check-in
 * Derviche Diffusion
 * 
 * Gestion de l'accès aux spectacles selon le rôle utilisateur.
 * 
 * Session S90: Optimisé avec RPC PostgreSQL get_accessible_shows
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';

import type { CheckinShow, CheckinShowsResult } from './types';
import { ADMIN_ROLES, isValidCheckinRole } from './constants';

/**
 * Type retourné par la RPC get_accessible_shows
 */
interface AccessibleShowRow {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  company_id: string;
  company_name: string;
  upcoming_slots_count: number;
  past_slots_count: number;
  next_slot_id: string | null;
  next_slot_date: string | null;
  next_slot_time: string | null;
  next_slot_venue_name: string | null;
  last_slot_id: string | null;
  last_slot_date: string | null;
  last_slot_time: string | null;
  last_slot_venue_name: string | null;
}

/**
 * Récupère les spectacles accessibles pour l'utilisateur courant
 * Utilise la RPC PostgreSQL optimisée pour les performances
 * 
 * Logique d'accès :
 * - super-admin / admin : TOUS les spectacles avec représentations
 * - externe : Spectacles où l'utilisateur est hosted_by_id sur au moins un slot
 * - company : Spectacles de sa compagnie où hosted_by = 'company'
 */
export async function getAccessibleShows(
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CheckinShowsResult> {
  try {
    logger.info('checkin.getAccessibleShows - Début (RPC)', { userId, role, companyId });

    // Validation précoce
    if (!userId) {
      return { data: [], error: 'User ID requis' };
    }

    if (!isValidCheckinRole(role)) {
      logger.warn('checkin.getAccessibleShows - Rôle non autorisé', { role });
      return { data: [], error: 'Rôle non autorisé pour l\'accueil' };
    }

    if (role === 'company' && !companyId) {
      logger.warn('checkin.getAccessibleShows - Rôle company sans company_id');
      return { data: [], error: 'Compte compagnie non configuré' };
    }

    const supabase = createClient();

    // Appel de la RPC optimisée
    // Note: On convertit null en undefined pour p_company_id car Supabase RPC attend undefined pour les paramètres optionnels
    const { data, error } = await supabase.rpc('get_accessible_shows', {
      p_user_id: userId,
      p_role: role,
      p_company_id: companyId ?? undefined,
    });

    if (error) {
      logger.error('checkin.getAccessibleShows - Erreur RPC', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      logger.info('checkin.getAccessibleShows - Aucun spectacle trouvé');
      return { data: [], error: null };
    }

    // Transformer les données RPC vers le format CheckinShow
    const shows: CheckinShow[] = (data as AccessibleShowRow[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      imageUrl: row.image_url,
      company: {
        id: row.company_id,
        name: row.company_name,
      },
      upcomingSlotsCount: row.upcoming_slots_count,
      pastSlotsCount: row.past_slots_count,
      nextSlot: row.next_slot_id ? {
        id: row.next_slot_id,
        date: row.next_slot_date!,
        time: row.next_slot_time!,
        venueName: row.next_slot_venue_name ?? 'Lieu inconnu',
      } : null,
      lastSlot: row.last_slot_id ? {
        id: row.last_slot_id,
        date: row.last_slot_date!,
        time: row.last_slot_time!,
        venueName: row.last_slot_venue_name ?? 'Lieu inconnu',
      } : null,
    }));

    logger.info('checkin.getAccessibleShows - Succès (RPC)', { count: shows.length });
    return { data: shows, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getAccessibleShows - Exception', { error: message });
    return { data: [], error: message };
  }
}

/**
 * Vérifie si un utilisateur a accès à un slot spécifique
 * 
 * Logique d'accès :
 * - super-admin / admin : accès à tous les slots
 * - externe : doit être hosted_by_id du slot
 * - company : doit être hosted_by='company' et même compagnie
 */
export async function canAccessSlot(
  slotId: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('slots')
      .select(`
        id,
        hosted_by,
        hosted_by_id,
        shows!inner (
          company_id
        )
      `)
      .eq('id', slotId)
      .single();

    if (error || !data) {
      logger.warn('checkin.canAccessSlot - Slot non trouvé', { slotId, error });
      return false;
    }

    // Admin : accès à tout
    if (role !== null && ADMIN_ROLES.includes(role)) {
      return true;
    }

    // Externe : doit être hosted_by_id
    if (role === 'externe') {
      return data.hosted_by_id === userId;
    }

    // Company : doit être hosted_by = 'company' et même compagnie
    if (role === 'company') {
      const show = data.shows as unknown as { company_id: string } | null;
      if (!show || typeof show.company_id !== 'string') {
        logger.warn('checkin.canAccessSlot - Show invalide', { slotId });
        return false;
      }
      return data.hosted_by === 'company' && show.company_id === companyId;
    }

    return false;
  } catch (err) {
    logger.error('checkin.canAccessSlot - Exception', { slotId, error: err });
    return false;
  }
}
