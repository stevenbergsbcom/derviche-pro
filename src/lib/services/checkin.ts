/**
 * Service Check-in - Gestion de l'accueil sur place
 * Derviche Diffusion
 * 
 * Fonctionnalités :
 * - Liste des spectacles accessibles selon le rôle
 * - Liste des représentations accessibles
 * - Gestion des réservations (lecture/modification)
 * 
 * Logique d'accès :
 * - super-admin / admin : TOUS les spectacles avec représentations
 * - externe : Spectacles où l'utilisateur est hosted_by_id sur au moins un slot
 * - company : Spectacles de sa compagnie où hosted_by = 'company'
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/hooks/useCurrentUserRole';

// ============================================
// TYPES
// ============================================

/** Spectacle accessible pour le check-in */
export interface CheckinShow {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  company: {
    id: string;
    name: string;
  };
  /** Nombre de représentations à venir */
  upcomingSlotsCount: number;
  /** Prochaine représentation */
  nextSlot: {
    id: string;
    date: string;
    time: string;
    venueName: string;
  } | null;
}

/** Représentation accessible pour le check-in */
export interface CheckinSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  remainingCapacity: number;
  hostedBy: 'derviche' | 'company' | 'externe';
  hostedById: string | null;
  venue: {
    id: string;
    name: string;
    city: string;
  };
  show: {
    id: string;
    slug: string;
    title: string;
  };
  /** Nombre de réservations confirmées */
  confirmedCount: number;
  /** Nombre de personnes présentes (check-in fait) */
  checkedInCount: number;
}

/** Résultat de la récupération des spectacles */
export interface CheckinShowsResult {
  data: CheckinShow[];
  error: string | null;
}

/** Résultat de la récupération des représentations */
export interface CheckinSlotsResult {
  data: CheckinSlot[];
  error: string | null;
}

/** Rôles avec accès complet (admin) */
const ADMIN_ROLES: UserRole[] = ['super-admin', 'admin'];

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère les spectacles accessibles pour l'utilisateur courant
 * Filtre selon le rôle et les assignations
 */
export async function getAccessibleShows(
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CheckinShowsResult> {
  try {
    logger.info('checkin.getAccessibleShows - Début', { userId, role, companyId });

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // Récupérer les spectacles avec leurs slots à venir
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
      .gte('slots.date', today)
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
      // Extraire les données de la compagnie
      const company = show.companies as unknown as { id: string; name: string };
      
      // Filtrer et trier les slots
      const slots = (show.slots as unknown as Array<{
        id: string;
        date: string;
        time: string;
        hosted_by: string;
        hosted_by_id: string | null;
        venues: { id: string; name: string } | null;
      }>).filter(slot => {
        // Pour externe, on a déjà filtré dans la query
        // Pour company, vérifier hosted_by
        if (role === 'company') {
          return slot.hosted_by === 'company';
        }
        // Pour externe, vérifier hosted_by_id (double check)
        if (role === 'externe') {
          return slot.hosted_by_id === userId;
        }
        // Admin : tous les slots
        return true;
      }).sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      if (slots.length === 0) continue;

      // Trouver le prochain slot
      const nextSlot = slots[0];

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
          upcomingSlotsCount: slots.length,
          nextSlot: nextSlot ? {
            id: nextSlot.id,
            date: nextSlot.date,
            time: nextSlot.time,
            venueName: nextSlot.venues?.name || 'Lieu inconnu',
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
 * Récupère les représentations d'un spectacle accessibles pour l'utilisateur
 */
export async function getAccessibleSlots(
  showSlug: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CheckinSlotsResult> {
  try {
    logger.info('checkin.getAccessibleSlots - Début', { showSlug, userId, role });

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

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

    // Récupérer les slots
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
      .eq('show_id', showData.id)
      .gte('date', today)
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

    // Transformer les données
    const slots: CheckinSlot[] = data.map(slot => {
      const venue = slot.venues as unknown as { id: string; name: string; city: string } | null;
      const show = slot.shows as unknown as { id: string; slug: string; title: string };
      const reservations = slot.reservations as unknown as Array<{
        id: string;
        status: string;
        checkin_status: string | null;
      }>;

      // Compter les réservations
      const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
      const checkedInCount = reservations.filter(r => 
        r.status === 'confirmed' && 
        r.checkin_status && 
        r.checkin_status !== 'absent'
      ).length;

      return {
        id: slot.id,
        date: slot.date,
        time: slot.time,
        capacity: slot.capacity,
        remainingCapacity: slot.remaining_capacity,
        hostedBy: slot.hosted_by as 'derviche' | 'company' | 'externe',
        hostedById: slot.hosted_by_id,
        venue: venue ? {
          id: venue.id,
          name: venue.name,
          city: venue.city,
        } : {
          id: '',
          name: 'Lieu inconnu',
          city: '',
        },
        show: {
          id: show.id,
          slug: show.slug,
          title: show.title,
        },
        confirmedCount,
        checkedInCount,
      };
    });

    logger.info('checkin.getAccessibleSlots - Succès', { count: slots.length });
    return { data: slots, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getAccessibleSlots - Exception', { error: message });
    return { data: [], error: message };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Vérifie si un utilisateur a accès à un slot spécifique
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
      const show = data.shows as unknown as { company_id: string };
      return data.hosted_by === 'company' && show.company_id === companyId;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Formate une date pour l'affichage
 */
export function formatSlotDate(date: string): string {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formate une heure pour l'affichage
 */
export function formatSlotTime(time: string): string {
  return time.slice(0, 5); // HH:MM
}

/**
 * Vérifie si un slot est aujourd'hui
 */
export function isSlotToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
}

/**
 * Groupe les slots par date
 */
export function groupSlotsByDate(slots: CheckinSlot[]): Map<string, CheckinSlot[]> {
  const grouped = new Map<string, CheckinSlot[]>();
  
  for (const slot of slots) {
    const existing = grouped.get(slot.date);
    if (existing) {
      existing.push(slot);
    } else {
      grouped.set(slot.date, [slot]);
    }
  }

  return grouped;
}
