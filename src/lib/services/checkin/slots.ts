/**
 * Fonctions Slots pour le service Check-in
 * Derviche Diffusion
 * 
 * Gestion des représentations (créneaux) pour le check-in.
 * 
 * Session S91: Optimisé avec RPC PostgreSQL get_accessible_slots
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { isSlotTimePast } from '@/lib/utils/timezone';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy } from '@/types/database';

import type { CheckinSlot, CheckinSlotsResult, GetSlotsOptions } from './types';
import { DEFAULT_PAST_DAYS_LIMIT, VALID_HOSTED_BY, isValidCheckinRole } from './constants';

/**
 * Type retourné par la RPC get_accessible_slots
 */
interface AccessibleSlotRow {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remaining_capacity: number;
  hosted_by: string;
  hosted_by_id: string | null;
  venue_id: string;
  venue_name: string;
  venue_city: string;
  show_id: string;
  show_slug: string;
  show_title: string;
  confirmed_count: number;
  checked_in_count: number;
}

/**
 * Type guard pour valider hosted_by
 */
function isValidHostedBy(value: unknown): value is SlotHostedBy {
  return typeof value === 'string' && VALID_HOSTED_BY.includes(value as SlotHostedBy);
}

/**
 * Récupère les représentations d'un spectacle accessibles pour l'utilisateur
 * Utilise la RPC PostgreSQL optimisée pour les performances
 * 
 * @param showSlug - Slug du spectacle
 * @param userId - ID de l'utilisateur
 * @param role - Rôle de l'utilisateur
 * @param companyId - ID de la compagnie (si rôle company)
 * @param options - Options de filtrage (optionnel)
 *   - pastDaysLimit: Limite en jours pour les slots passés (défaut: 30)
 *   - upcomingOnly: Charger uniquement les slots à venir
 *   - includeAllPast: Charger tout l'historique (ignore pastDaysLimit)
 */
export async function getAccessibleSlots(
  showSlug: string,
  userId: string,
  role: UserRole,
  companyId: string | null,
  options?: GetSlotsOptions
): Promise<CheckinSlotsResult> {
  try {
    // Extraire et valider les options
    const rawPastDaysLimit = options?.pastDaysLimit ?? DEFAULT_PAST_DAYS_LIMIT;
    const pastDaysLimit = Math.max(1, rawPastDaysLimit); // Minimum 1 jour
    const upcomingOnly = options?.upcomingOnly ?? false;
    const includeAllPast = options?.includeAllPast ?? false;
    
    logger.info('checkin.getAccessibleSlots - Début (RPC)', { 
      showSlug, 
      userId, 
      role,
      pastDaysLimit,
      upcomingOnly,
      includeAllPast,
    });

    // Validation précoce
    if (!showSlug) {
      return { data: [], error: 'Show slug requis' };
    }

    if (!userId) {
      return { data: [], error: 'User ID requis' };
    }

    if (!isValidCheckinRole(role)) {
      logger.warn('checkin.getAccessibleSlots - Rôle non autorisé', { role });
      return { data: [], error: 'Rôle non autorisé pour l\'accueil' };
    }

    if (role === 'company' && !companyId) {
      logger.warn('checkin.getAccessibleSlots - Rôle company sans company_id');
      return { data: [], error: 'Compte compagnie non configuré' };
    }

    const supabase = createClient();

    // Appel de la RPC optimisée
    // Note: On convertit null en undefined pour p_company_id car Supabase RPC attend undefined pour les paramètres optionnels
    const { data, error } = await supabase.rpc('get_accessible_slots', {
      p_show_slug: showSlug,
      p_user_id: userId,
      p_role: role,
      p_company_id: companyId ?? undefined,
      p_past_days_limit: pastDaysLimit,
      p_upcoming_only: upcomingOnly,
      p_include_all_past: includeAllPast,
    });

    if (error) {
      // Gérer les erreurs spécifiques de la RPC
      if (error.message.includes('Show not found')) {
        logger.error('checkin.getAccessibleSlots - Spectacle non trouvé', { showSlug });
        return { data: [], error: 'Spectacle non trouvé' };
      }
      if (error.message.includes('Access denied')) {
        logger.warn('checkin.getAccessibleSlots - Accès refusé', { showSlug, role });
        return { data: [], error: 'Accès non autorisé à ce spectacle' };
      }
      logger.error('checkin.getAccessibleSlots - Erreur RPC', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      logger.info('checkin.getAccessibleSlots - Aucun slot trouvé');
      return { data: [], error: null };
    }

    // Transformer les données RPC vers le format CheckinSlot
    const slots: CheckinSlot[] = (data as AccessibleSlotRow[]).map((row) => ({
      id: row.id,
      date: row.date,
      time: row.time,
      capacity: row.capacity,
      remainingCapacity: row.remaining_capacity,
      hostedBy: isValidHostedBy(row.hosted_by) ? row.hosted_by : 'derviche',
      hostedById: row.hosted_by_id,
      venue: {
        id: row.venue_id,
        name: row.venue_name,
        city: row.venue_city,
      },
      show: {
        id: row.show_id,
        slug: row.show_slug,
        title: row.show_title,
      },
      confirmedCount: row.confirmed_count,
      checkedInCount: row.checked_in_count,
    }));

    logger.info('checkin.getAccessibleSlots - Succès (RPC)', { count: slots.length });
    return { data: slots, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getAccessibleSlots - Exception', { error: message });
    return { data: [], error: message };
  }
}

/**
 * Vérifie la capacité restante d'un slot
 * 
 * @returns Object avec capacity, remaining, et isUnlimited
 *          ou null si le slot n'existe pas
 */
export async function checkSlotCapacity(
  slotId: string
): Promise<{
  capacity: number;
  remaining: number;
  isUnlimited: boolean;
  /** True si la date/heure du slot est déjà passée par rapport à maintenant. */
  isPast: boolean;
} | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('slots')
      .select('capacity, remaining_capacity, date, time')
      .eq('id', slotId)
      .single();

    if (error || !data) {
      return null;
    }

    const isUnlimited = data.capacity >= 999999;
    // time peut arriver en HH:MM:SS depuis PostgreSQL — on tronque pour
    // rester cohérent avec isSlotTimePast qui attend HH:MM.
    const timeHhMm = typeof data.time === 'string' ? data.time.slice(0, 5) : '';
    return {
      capacity: data.capacity,
      remaining: data.remaining_capacity,
      isUnlimited,
      isPast: isSlotTimePast(data.date, timeHhMm),
    };
  } catch (err) {
    logger.error('checkin.checkSlotCapacity - Exception', { err });
    return null;
  }
}
