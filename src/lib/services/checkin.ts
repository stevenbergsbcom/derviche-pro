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
import type { SlotHostedBy } from '@/types/database';

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
  hostedBy: SlotHostedBy;
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

/** Valeurs valides pour hosted_by */
const VALID_HOSTED_BY: SlotHostedBy[] = ['derviche', 'company', 'externe'];

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Vérifie si une valeur est une compagnie valide
 */
function isValidCompany(data: unknown): data is { id: string; name: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { name: unknown }).name === 'string'
  );
}

/**
 * Vérifie si une valeur est un venue valide
 */
function isValidVenue(data: unknown): data is { id: string; name: string; city?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { name: unknown }).name === 'string'
  );
}

/**
 * Vérifie si une valeur est un show valide
 */
function isValidShow(data: unknown): data is { id: string; slug: string; title: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'slug' in data &&
    'title' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { slug: unknown }).slug === 'string' &&
    typeof (data as { title: unknown }).title === 'string'
  );
}

/**
 * Vérifie si une valeur est un hosted_by valide
 */
function isValidHostedBy(value: unknown): value is SlotHostedBy {
  return typeof value === 'string' && VALID_HOSTED_BY.includes(value as SlotHostedBy);
}

/**
 * Vérifie si une valeur est un slot brut valide
 */
function isValidRawSlot(data: unknown): data is {
  id: string;
  date: string;
  time: string;
  hosted_by: string;
  hosted_by_id: string | null;
  venues: unknown;
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'date' in data &&
    'time' in data &&
    'hosted_by' in data &&
    typeof (data as { id: unknown }).id === 'string' &&
    typeof (data as { date: unknown }).date === 'string' &&
    typeof (data as { time: unknown }).time === 'string'
  );
}

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

      // Trouver le prochain slot
      const nextSlot = validSlots[0];

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
          upcomingSlotsCount: validSlots.length,
          nextSlot: nextSlot ? {
            id: nextSlot.id,
            date: nextSlot.date,
            time: nextSlot.time,
            venueName: isValidVenue(nextSlot.venues) ? nextSlot.venues.name : 'Lieu inconnu',
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
