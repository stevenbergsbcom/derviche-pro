/**
 * Fonctions Shows pour le service Check-in
 * Derviche Diffusion
 * 
 * Gestion de l'accès aux spectacles selon le rôle utilisateur.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';

import type { CheckinShow, CheckinShowsResult } from './types';
import { ADMIN_ROLES } from './constants';
import { isValidCompany, isValidVenue, isValidRawSlot } from './guards';

/**
 * Récupère les spectacles accessibles pour l'utilisateur courant
 * Filtre selon le rôle et les assignations
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
    logger.info('checkin.getAccessibleShows - Début', { userId, role, companyId });

    const supabase = createClient();

    // Récupérer les spectacles avec leurs slots (passés et futurs)
    let query = supabase
      .from('shows')
      .select(`
        id,
        slug,
        title,
        image_url,
        companies!inner (
          id,
          name
        ),
        slots!inner (
          id,
          date,
          time,
          hosted_by,
          hosted_by_id,
          venues (
            id,
            name
          )
        )
      `)
      .is('deleted_at', null)
      .eq('status', 'published')
      .order('title', { ascending: true });

    // Filtrer selon le rôle
    if (ADMIN_ROLES.includes(role)) {
      // Admin : tous les spectacles avec slots à venir
      // Pas de filtre supplémentaire
    } else if (role === 'externe') {
      // Externe : seulement les slots où il est hosted_by_id
      query = query.eq('slots.hosted_by_id', userId);
    } else if (role === 'company') {
      // Compagnie : spectacles de sa compagnie avec hosted_by = 'company'
      if (!companyId) {
        logger.warn('checkin.getAccessibleShows - Rôle company sans company_id');
        return { data: [], error: 'Compte compagnie non configuré' };
      }
      query = query
        .eq('company_id', companyId)
        .eq('slots.hosted_by', 'company');
    } else {
      logger.warn('checkin.getAccessibleShows - Rôle non autorisé', { role });
      return { data: [], error: 'Rôle non autorisé pour l\'accueil' };
    }

    const { data, error } = await query;

    if (error) {
      logger.error('checkin.getAccessibleShows - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      logger.info('checkin.getAccessibleShows - Aucun spectacle trouvé');
      return { data: [], error: null };
    }

    // Transformer et agréger les données
    const showsMap = new Map<string, CheckinShow>();

    for (const show of data) {
      // Valider et extraire les données de la compagnie
      if (!isValidCompany(show.companies)) {
        logger.warn('checkin.getAccessibleShows - Compagnie invalide', { showId: show.id });
        continue;
      }
      const company = show.companies;
      
      // Valider et filtrer les slots
      const rawSlots = Array.isArray(show.slots) ? show.slots : [];
      const validSlots = rawSlots
        .filter(isValidRawSlot)
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

      if (validSlots.length === 0) continue;

      // Séparer les slots passés et à venir (aujourd'hui = à venir)
      const today = new Date().toISOString().split('T')[0];
      const upcomingSlots = validSlots.filter((s) => s.date >= today);
      const pastSlots = validSlots.filter((s) => s.date < today);

      // Trouver le prochain slot (à venir)
      const nextSlot = upcomingSlots[0] ?? null;
      // Trouver le dernier slot passé (le plus récent = dernier du tableau)
      const lastSlot = pastSlots[pastSlots.length - 1] ?? null;

      // Créer ou mettre à jour l'entrée
      const existing = showsMap.get(show.id);
      if (!existing) {
        showsMap.set(show.id, {
          id: show.id,
          slug: show.slug,
          title: show.title,
          imageUrl: show.image_url,
          company: {
            id: company.id,
            name: company.name,
          },
          upcomingSlotsCount: upcomingSlots.length,
          pastSlotsCount: pastSlots.length,
          nextSlot: nextSlot ? {
            id: nextSlot.id,
            date: nextSlot.date,
            time: nextSlot.time,
            venueName: isValidVenue(nextSlot.venues) ? nextSlot.venues.name : 'Lieu inconnu',
          } : null,
          lastSlot: lastSlot ? {
            id: lastSlot.id,
            date: lastSlot.date,
            time: lastSlot.time,
            venueName: isValidVenue(lastSlot.venues) ? lastSlot.venues.name : 'Lieu inconnu',
          } : null,
        });
      }
    }

    const shows = Array.from(showsMap.values());
    
    // Trier par date du prochain slot
    shows.sort((a, b) => {
      if (!a.nextSlot) return 1;
      if (!b.nextSlot) return -1;
      const dateA = new Date(`${a.nextSlot.date}T${a.nextSlot.time}`);
      const dateB = new Date(`${b.nextSlot.date}T${b.nextSlot.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    logger.info('checkin.getAccessibleShows - Succès', { count: shows.length });
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
    if (ADMIN_ROLES.includes(role)) {
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
