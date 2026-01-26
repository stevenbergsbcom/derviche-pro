/**
 * Fonctions Slots pour le service Check-in
 * Derviche Diffusion
 * 
 * Gestion des représentations (créneaux) pour le check-in.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';
import type { SlotHostedBy } from '@/types/database';

import type { CheckinSlot, CheckinSlotsResult, GetSlotsOptions } from './types';
import { DEFAULT_PAST_DAYS_LIMIT } from './constants';
import { isValidVenue, isValidShow, isValidHostedBy } from './guards';

/**
 * Récupère les représentations d'un spectacle accessibles pour l'utilisateur
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
    
    logger.info('checkin.getAccessibleSlots - Début', { 
      showSlug, 
      userId, 
      role,
      pastDaysLimit,
      upcomingOnly,
      includeAllPast,
    });

    const supabase = createClient();

    // D'abord, récupérer le show par son slug
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .select('id, slug, title, company_id')
      .eq('slug', showSlug)
      .is('deleted_at', null)
      .single();

    if (showError || !showData) {
      logger.error('checkin.getAccessibleSlots - Spectacle non trouvé', { showSlug });
      return { data: [], error: 'Spectacle non trouvé' };
    }

    // Vérifier l'accès selon le rôle
    if (role === 'company' && showData.company_id !== companyId) {
      logger.warn('checkin.getAccessibleSlots - Accès refusé (mauvaise compagnie)');
      return { data: [], error: 'Accès non autorisé à ce spectacle' };
    }

    // Calculer la date limite pour les slots passés
    // Priorité : includeAllPast > upcomingOnly > pastDaysLimit
    const today = new Date().toISOString().split('T')[0];
    let minDate: string | null = null;
    
    if (includeAllPast) {
      // Charger tout l'historique (pas de limite de date)
      minDate = null;
    } else if (upcomingOnly) {
      // Uniquement les slots à venir (aujourd'hui inclus)
      minDate = today;
    } else {
      // Limiter les slots passés selon pastDaysLimit (défaut: 30 jours)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - pastDaysLimit);
      minDate = limitDate.toISOString().split('T')[0];
    }

    // Récupérer les slots avec filtrage optionnel par date
    let query = supabase
      .from('slots')
      .select(`
        id,
        date,
        time,
        capacity,
        remaining_capacity,
        hosted_by,
        hosted_by_id,
        venues (
          id,
          name,
          city
        ),
        shows!inner (
          id,
          slug,
          title
        ),
        reservations (
          id,
          status,
          checkin_status
        )
      `)
      .eq('show_id', showData.id);

    // Appliquer le filtre de date si nécessaire
    if (minDate) {
      query = query.gte('date', minDate);
    }

    // Trier par date et heure
    query = query
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    // Filtrer selon le rôle
    if (role === 'externe') {
      query = query.eq('hosted_by_id', userId);
    } else if (role === 'company') {
      query = query.eq('hosted_by', 'company');
    }
    // Admin : pas de filtre supplémentaire

    const { data, error } = await query;

    if (error) {
      logger.error('checkin.getAccessibleSlots - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Transformer les données avec validation
    const slots: CheckinSlot[] = [];

    for (const slot of data) {
      // Valider le venue
      const venue = isValidVenue(slot.venues) 
        ? { id: slot.venues.id, name: slot.venues.name, city: (slot.venues as { city?: string }).city || '' }
        : { id: '', name: 'Lieu inconnu', city: '' };

      // Valider le show
      if (!isValidShow(slot.shows)) {
        logger.warn('checkin.getAccessibleSlots - Show invalide dans slot', { slotId: slot.id });
        continue;
      }
      const show = slot.shows;

      // Valider hosted_by avec fallback sécurisé
      const hostedBy: SlotHostedBy = isValidHostedBy(slot.hosted_by) 
        ? slot.hosted_by 
        : 'derviche';

      // Compter les réservations
      const reservations = Array.isArray(slot.reservations) ? slot.reservations : [];
      const confirmedCount = reservations.filter(
        (r): r is { id: string; status: string; checkin_status: string | null } => 
          typeof r === 'object' && r !== null && (r as { status?: unknown }).status === 'confirmed'
      ).length;
      const checkedInCount = reservations.filter(
        (r): r is { id: string; status: string; checkin_status: string | null } => 
          typeof r === 'object' && 
          r !== null && 
          (r as { status?: unknown }).status === 'confirmed' && 
          (r as { checkin_status?: unknown }).checkin_status !== null &&
          (r as { checkin_status?: unknown }).checkin_status !== 'absent'
      ).length;

      slots.push({
        id: slot.id,
        date: slot.date,
        time: slot.time,
        capacity: slot.capacity,
        remainingCapacity: slot.remaining_capacity,
        hostedBy,
        hostedById: slot.hosted_by_id,
        venue,
        show: {
          id: show.id,
          slug: show.slug,
          title: show.title,
        },
        confirmedCount,
        checkedInCount,
      });
    }

    logger.info('checkin.getAccessibleSlots - Succès', { count: slots.length });
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
): Promise<{ capacity: number; remaining: number; isUnlimited: boolean } | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('slots')
      .select('capacity, remaining_capacity')
      .eq('id', slotId)
      .single();

    if (error || !data) {
      return null;
    }

    const isUnlimited = data.capacity >= 999999;
    return {
      capacity: data.capacity,
      remaining: data.remaining_capacity,
      isUnlimited,
    };
  } catch (err) {
    logger.error('checkin.checkSlotCapacity - Exception', { err });
    return null;
  }
}
