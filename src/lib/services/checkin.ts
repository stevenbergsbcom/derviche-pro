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

/** Réservation pour le check-in */
export interface CheckinReservation {
  id: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string | null;
  guestEmailSecondary: string | null;
  guestPhone: string | null;
  guestPhoneSecondary: string | null;
  guestFunction: string | null;
  guestStructure: string | null;
  guestAddress: string | null;
  guestPostalCode: string | null;
  guestCity: string | null;
  guestAfcNumber: string | null;
  numPlaces: number;
  status: 'confirmed' | 'cancelled' | 'no_show';
  checkinStatus: import('@/types/database').CheckinStatus | null;
  checkinComment: string | null;
  /** Notes sur le lieu (visibles par tous) */
  checkinVenueNotes: string | null;
  /** Notes internes Derviche (visibles uniquement par admin) */
  checkinInternalNotes: string | null;
  specialRequests: string | null;
  createdAt: string;
}

/** Résultat de la récupération des réservations */
export interface CheckinReservationsResult {
  data: CheckinReservation[];
  error: string | null;
}

/** Rôles avec accès complet (admin) */
const ADMIN_ROLES: UserRole[] = ['super-admin', 'admin'];

/** Valeurs valides pour hosted_by */
const VALID_HOSTED_BY: SlotHostedBy[] = ['derviche', 'company', 'externe'];

/** Nombre maximum de places par réservation (cohérence avec AddReservationDrawer) */
const MAX_PLACES = 20;

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

/**
 * Vérifie si une réponse RPC create_admin_reservation est valide
 */
function isValidRpcResult(data: unknown): data is { 
  success: boolean; 
  reservation_id?: string; 
  error?: string 
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as { success: unknown }).success === 'boolean'
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

    // Récupérer les slots (passés et futurs)
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
 * Récupère les réservations d'un slot
 * Triées par ordre alphabétique (nom de famille, puis prénom)
 */
export async function getSlotReservations(
  slotId: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CheckinReservationsResult> {
  try {
    logger.info('checkin.getSlotReservations - Début', { slotId, userId, role });

    // Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(slotId, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.getSlotReservations - Accès refusé', { slotId, userId });
      return { data: [], error: 'Accès non autorisé à cette représentation' };
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at
      `)
      .eq('slot_id', slotId)
      .order('guest_last_name', { ascending: true, nullsFirst: false })
      .order('guest_first_name', { ascending: true, nullsFirst: false });

    if (error) {
      logger.error('checkin.getSlotReservations - Erreur Supabase', { error });
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      logger.info('checkin.getSlotReservations - Aucune réservation');
      return { data: [], error: null };
    }

    // Transformer les données
    // Note: checkinInternalNotes masqué pour les non-admins
    const reservations: CheckinReservation[] = data.map((r) => ({
      id: r.id,
      guestFirstName: r.guest_first_name,
      guestLastName: r.guest_last_name,
      guestEmail: r.guest_email,
      guestEmailSecondary: r.guest_email_secondary,
      guestPhone: r.guest_phone,
      guestPhoneSecondary: r.guest_phone_secondary,
      guestFunction: r.guest_function,
      guestStructure: r.guest_structure,
      guestAddress: r.guest_address,
      guestPostalCode: r.guest_postal_code,
      guestCity: r.guest_city,
      guestAfcNumber: r.guest_afc_number,
      numPlaces: r.num_places,
      status: r.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: r.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: r.checkin_comment,
      checkinVenueNotes: r.checkin_venue_notes,
      // Notes internes masquées pour les non-admins
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? r.checkin_internal_notes : null,
      specialRequests: r.special_requests,
      createdAt: r.created_at,
    }));

    logger.info('checkin.getSlotReservations - Succès', { count: reservations.length });
    return { data: reservations, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getSlotReservations - Exception', { error: message });
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

// ============================================
// MISE À JOUR DU CHECK-IN
// ============================================

/** Paramètres pour mettre à jour le statut de check-in et/ou les infos guest */
export interface UpdateCheckinParams {
  reservationId: string;
  /** Statut de check-in (optionnel - si absent, seules les infos guest sont mises à jour) */
  status?: import('@/types/database').CheckinStatus | null;
  comment?: string | null;
  /** Notes sur le lieu (visibles par tous les rôles) */
  venueNotes?: string | null;
  /** Notes internes Derviche (visibles uniquement par super-admin/admin) */
  internalNotes?: string | null;
  userId: string;
  role: UserRole;
  companyId: string | null;
  // Champs guest (optionnels - pour modification des infos du professionnel)
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestEmailSecondary?: string | null;
  guestPhone?: string | null;
  guestPhoneSecondary?: string | null;
  guestStructure?: string | null;
  guestFunction?: string | null;
  guestAddress?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  guestAfcNumber?: string | null;
  specialRequests?: string | null;
}

/** Résultat de la mise à jour du check-in */
export interface UpdateCheckinResult {
  success: boolean;
  data: CheckinReservation | null;
  error: string | null;
}

/**
 * Met à jour le statut de check-in d'une réservation
 * 
 * Vérifie que l'utilisateur a accès au slot associé avant de modifier.
 * Enregistre également qui a fait le check-in et quand.
 */
export async function updateCheckinStatus(
  params: UpdateCheckinParams
): Promise<UpdateCheckinResult> {
  const { 
    reservationId, 
    status, 
    comment, 
    venueNotes, 
    internalNotes, 
    userId, 
    role, 
    companyId,
    // Champs guest
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
  } = params;

  try {
    logger.info('checkin.updateCheckinStatus - Début', { 
      reservationId, 
      status, 
      userId, 
      role 
    });

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, slot_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.updateCheckinStatus - Réservation non trouvée', { 
        reservationId, 
        error: fetchError 
      });
      return { 
        success: false, 
        data: null, 
        error: 'Réservation non trouvée' 
      };
    }

    // 2. Vérifier que la réservation est confirmée
    if (reservation.status !== 'confirmed') {
      logger.warn('checkin.updateCheckinStatus - Réservation non confirmée', { 
        reservationId, 
        status: reservation.status 
      });
      return { 
        success: false, 
        data: null, 
        error: 'Seules les réservations confirmées peuvent être pointées' 
      };
    }

    // 3. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.updateCheckinStatus - Accès refusé', { 
        reservationId, 
        slotId: reservation.slot_id, 
        userId 
      });
      return { 
        success: false, 
        data: null, 
        error: 'Accès non autorisé à cette représentation' 
      };
    }

    // 4. Mettre à jour la réservation
    const now = new Date().toISOString();
    
    // Construire l'objet de mise à jour
    // Note: internalNotes uniquement pour super-admin et admin
    // Note: Si status n'est pas fourni, on ne met pas à jour les champs checkin_*
    const updateData: {
      checkin_status?: typeof status;
      checkin_comment?: string | null;
      checkin_venue_notes?: string | null;
      checkin_internal_notes?: string | null;
      checkin_at?: string;
      checkin_by?: string;
      // Champs guest (optionnels)
      guest_first_name?: string;
      guest_last_name?: string;
      guest_email?: string;
      guest_email_secondary?: string | null;
      guest_phone?: string | null;
      guest_phone_secondary?: string | null;
      guest_structure?: string | null;
      guest_function?: string | null;
      guest_address?: string | null;
      guest_postal_code?: string | null;
      guest_city?: string | null;
      guest_afc_number?: string | null;
      special_requests?: string | null;
    } = {};

    // Ajouter les champs check-in seulement si un status est fourni
    if (status !== undefined && status !== null) {
      updateData.checkin_status = status;
      updateData.checkin_at = now;
      updateData.checkin_by = userId;
    }

    // Le commentaire peut être modifié indépendamment du statut
    if (comment !== undefined) {
      updateData.checkin_comment = comment;
    }

    // Ajouter venueNotes si fourni (tous les rôles peuvent le modifier)
    if (venueNotes !== undefined) {
      updateData.checkin_venue_notes = venueNotes;
    }

    // Ajouter internalNotes uniquement si l'utilisateur est admin
    if (internalNotes !== undefined && ADMIN_ROLES.includes(role)) {
      updateData.checkin_internal_notes = internalNotes;
    }

    // Ajouter les champs guest si fournis
    if (guestFirstName !== undefined) {
      updateData.guest_first_name = guestFirstName.trim();
    }
    if (guestLastName !== undefined) {
      updateData.guest_last_name = guestLastName.trim();
    }
    if (guestEmail !== undefined) {
      updateData.guest_email = guestEmail.trim();
    }
    if (guestEmailSecondary !== undefined) {
      updateData.guest_email_secondary = guestEmailSecondary?.trim() || null;
    }
    if (guestPhone !== undefined) {
      updateData.guest_phone = guestPhone?.trim() || null;
    }
    if (guestPhoneSecondary !== undefined) {
      updateData.guest_phone_secondary = guestPhoneSecondary?.trim() || null;
    }
    if (guestStructure !== undefined) {
      updateData.guest_structure = guestStructure?.trim() || null;
    }
    if (guestFunction !== undefined) {
      updateData.guest_function = guestFunction?.trim() || null;
    }
    if (guestAddress !== undefined) {
      updateData.guest_address = guestAddress?.trim() || null;
    }
    if (guestPostalCode !== undefined) {
      updateData.guest_postal_code = guestPostalCode?.trim() || null;
    }
    if (guestCity !== undefined) {
      updateData.guest_city = guestCity?.trim() || null;
    }
    if (guestAfcNumber !== undefined) {
      updateData.guest_afc_number = guestAfcNumber?.trim() || null;
    }
    if (specialRequests !== undefined) {
      updateData.special_requests = specialRequests?.trim() || null;
    }

    // Vérifier qu'on a quelque chose à mettre à jour
    if (Object.keys(updateData).length === 0) {
      logger.warn('checkin.updateCheckinStatus - Aucune donnée à mettre à jour', { reservationId });
      return {
        success: false,
        data: null,
        error: 'Aucune modification à enregistrer',
      };
    }

    logger.info('checkin.updateCheckinStatus - Données à mettre à jour', { 
      reservationId, 
      fieldsCount: Object.keys(updateData).length,
      fields: Object.keys(updateData),
    });

    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.updateCheckinStatus - Erreur mise à jour', { 
        reservationId, 
        error: updateError 
      });
      return { 
        success: false, 
        data: null, 
        error: updateError?.message || 'Erreur lors de la mise à jour' 
      };
    }

    // 5. Transformer et retourner la réservation mise à jour
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      // Notes internes masquées pour les non-admins
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
    };

    logger.info('checkin.updateCheckinStatus - Succès', { 
      reservationId, 
      newStatus: status 
    });

    return { success: true, data: result, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.updateCheckinStatus - Exception', { 
      reservationId, 
      error: message 
    });
    return { success: false, data: null, error: message };
  }
}

// ============================================
// HELPERS
// ============================================

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
 * Vérifie si un slot est passé (date antérieure à aujourd'hui)
 * Note: les slots d'aujourd'hui sont considérés comme "à venir"
 */
export function isSlotPast(date: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return date < today;
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

// ============================================
// CRÉATION DE RÉSERVATION DEPUIS LE CHECK-IN
// ============================================

/** Données du formulaire de création de réservation depuis le check-in */
export interface CreateCheckinReservationData {
  // Champs obligatoires
  slotId: string;
  numPlaces: number;
  firstName: string;
  lastName: string;
  email: string;
  // Champs optionnels du guest
  phone?: string;
  emailSecondary?: string;
  phoneSecondary?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  organization?: string;  // -> guest_structure
  function?: string;      // -> guest_function
  afcNumber?: string;
  // Commentaire / demandes
  specialRequests?: string;
  // Champs check-in (optionnels)
  checkinStatus?: import('@/types/database').CheckinStatus;
  checkinComment?: string;
  checkinVenueNotes?: string;
  checkinInternalNotes?: string;
}

/** Résultat de la création de réservation depuis le check-in */
export interface CreateCheckinReservationResult {
  success: boolean;
  reservationId?: string;
  /** Avertissement (ex: doublon email) - ne bloque pas la création */
  warning?: string;
  error?: string;
}

/** Résultat de la vérification de doublon */
export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  existingReservation?: {
    id: string;
    guestFirstName: string | null;
    guestLastName: string | null;
    numPlaces: number;
  };
}

/**
 * Vérifie si un email a déjà une réservation sur ce créneau
 * Ne bloque pas, retourne juste l'info
 */
export async function checkDuplicateEmail(
  slotId: string,
  email: string
): Promise<DuplicateCheckResult> {
  try {
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('reservations')
      .select('id, guest_first_name, guest_last_name, num_places')
      .eq('slot_id', slotId)
      .ilike('guest_email', normalizedEmail)
      .eq('status', 'confirmed')
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('checkin.checkDuplicateEmail - Erreur', { error });
      return { hasDuplicate: false };
    }

    if (data) {
      return {
        hasDuplicate: true,
        existingReservation: {
          id: data.id,
          guestFirstName: data.guest_first_name,
          guestLastName: data.guest_last_name,
          numPlaces: data.num_places,
        },
      };
    }

    return { hasDuplicate: false };
  } catch (err) {
    logger.error('checkin.checkDuplicateEmail - Exception', { err });
    return { hasDuplicate: false };
  }
}

/**
 * Crée une réservation depuis l'interface de check-in (PWA)
 * 
 * Logique d'accès :
 * - super-admin / admin : Peuvent créer sur tous les slots
 * - externe : Peuvent créer sur les slots où ils sont hosted_by_id
 * - company : Peuvent créer sur les slots de leurs spectacles où hosted_by='company'
 * 
 * Fonctionnalités :
 * - Vérification d'accès au slot
 * - Détection de doublon email (avertissement, ne bloque pas)
 * - Création via RPC create_admin_reservation
 * - Mise à jour du checkin_status si fourni
 */
export async function createReservationFromCheckin(
  data: CreateCheckinReservationData,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<CreateCheckinReservationResult> {
  try {
    logger.info('checkin.createReservationFromCheckin - Début', {
      slotId: data.slotId,
      email: data.email,
      userId,
      role,
    });

    // 1. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(data.slotId, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.createReservationFromCheckin - Accès refusé', { slotId: data.slotId });
      return { success: false, error: 'Accès non autorisé à cette représentation' };
    }

    // 2. Vérifier les doublons email
    let warning: string | undefined;
    const duplicateCheck = await checkDuplicateEmail(data.slotId, data.email);
    if (duplicateCheck.hasDuplicate && duplicateCheck.existingReservation) {
      const existing = duplicateCheck.existingReservation;
      const existingName = [existing.guestFirstName, existing.guestLastName]
        .filter(Boolean)
        .join(' ') || 'Sans nom';
      warning = `Attention : ${data.email} a déjà une réservation (${existingName}, ${existing.numPlaces} place(s))`;
      logger.info('checkin.createReservationFromCheckin - Doublon détecté', { warning });
    }

    // 3. Appeler la RPC create_admin_reservation
    const supabase = createClient();
    
    // Note: La RPC ne supporte pas encore checkin_status directement
    // On va créer la réservation puis mettre à jour le status si nécessaire
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_admin_reservation',
      {
        p_slot_id: data.slotId,
        p_num_places: data.numPlaces,
        p_first_name: data.firstName.trim(),
        p_last_name: data.lastName.trim(),
        p_email: data.email.trim(),
        p_phone: data.phone?.trim() || undefined,
        p_email_secondary: data.emailSecondary?.trim() || undefined,
        p_phone_secondary: data.phoneSecondary?.trim() || undefined,
        p_address: data.address?.trim() || undefined,
        p_postal_code: data.postalCode?.trim() || undefined,
        p_city: data.city?.trim() || undefined,
        p_organization: data.organization?.trim() || undefined,
        p_function: data.function?.trim() || undefined,
        p_afc_number: data.afcNumber?.trim() || undefined,
        p_comment: data.specialRequests?.trim() || undefined,
        p_checkin_comment: data.checkinComment?.trim() || undefined,
        p_checkin_venue_notes: data.checkinVenueNotes?.trim() || undefined,
        p_checkin_internal_notes: ADMIN_ROLES.includes(role) 
          ? (data.checkinInternalNotes?.trim() || undefined) 
          : undefined,
      }
    );

    if (rpcError) {
      logger.error('checkin.createReservationFromCheckin - Erreur RPC', { error: rpcError });
      return { success: false, error: rpcError.message };
    }

    // Valider le format de la réponse RPC
    if (!isValidRpcResult(rpcResult)) {
      logger.error('checkin.createReservationFromCheckin - Format réponse invalide', { rpcResult });
      return { success: false, error: 'Erreur interne: format de réponse invalide' };
    }

    if (!rpcResult.success) {
      logger.error('checkin.createReservationFromCheckin - RPC échouée', { error: rpcResult.error });
      return { success: false, error: rpcResult.error || 'Erreur lors de la création' };
    }

    const reservationId = rpcResult.reservation_id;
    if (!reservationId) {
      logger.error('checkin.createReservationFromCheckin - Pas d\'ID retourné');
      return { success: false, error: 'Erreur interne: pas d\'ID de réservation' };
    }

    // 4. Si checkin_status fourni, mettre à jour la réservation
    if (data.checkinStatus) {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          checkin_status: data.checkinStatus,
          checkin_at: new Date().toISOString(),
          checkin_by: userId,
        })
        .eq('id', reservationId);

      if (updateError) {
        logger.warn('checkin.createReservationFromCheckin - Erreur mise à jour status', { 
          reservationId, 
          error: updateError 
        });
        // On ne fait pas échouer la création pour ça
      }
    }

    logger.info('checkin.createReservationFromCheckin - Succès', { 
      reservationId, 
      hasWarning: !!warning 
    });

    return {
      success: true,
      reservationId,
      warning,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.createReservationFromCheckin - Exception', { error: message });
    return { success: false, error: message };
  }
}

/**
 * Vérifie la capacité restante d'un slot
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

// ============================================
// TRANSFERT DE RÉSERVATION
// ============================================

/** Paramètres pour transférer une réservation vers un autre créneau */
export interface TransferReservationParams {
  reservationId: string;
  targetSlotId: string;
  /** Nouveau nombre de places (optionnel - si absent, garde le nombre actuel) */
  newNumPlaces?: number;
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Informations sur la capacité d'un slot après transfert */
export interface SlotCapacityInfo {
  capacity: number;
  remainingAfterTransfer: number;
  isUnlimited: boolean;
  isOverbooking: boolean;
}

/** Résultat du transfert de réservation */
export interface TransferReservationResult {
  success: boolean;
  data: {
    reservation: CheckinReservation;
    targetSlotCapacity: SlotCapacityInfo;
  } | null;
  error: string | null;
}

/**
 * Transfère une réservation vers un autre créneau du même spectacle
 * 
 * Fonctionnalités :
 * - Vérifie l'accès au slot source (pas le cible)
 * - Vérifie que les deux slots appartiennent au même spectacle
 * - Permet de modifier le nombre de places en même temps
 * - Reset le checkin_status à null
 * - Autorise l'overbooking (retourne un warning via isOverbooking)
 * 
 * Le trigger update_slot_capacity gère automatiquement :
 * - Libération des places sur le slot source
 * - Réservation des places sur le slot cible
 */
export async function transferReservation(
  params: TransferReservationParams
): Promise<TransferReservationResult> {
  const { reservationId, targetSlotId, newNumPlaces, userId, role, companyId } = params;

  try {
    logger.info('checkin.transferReservation - Début', {
      reservationId,
      targetSlotId,
      newNumPlaces,
      userId,
      role,
    });

    const supabase = createClient();

    // 1. Récupérer la réservation avec les infos du slot source
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        num_places,
        status,
        slots!inner (
          id,
          show_id
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.transferReservation - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // Extraire le show_id du slot source
    const sourceSlot = reservation.slots as unknown as { id: string; show_id: string };
    if (!sourceSlot || typeof sourceSlot.show_id !== 'string') {
      logger.error('checkin.transferReservation - Données slot source invalides');
      return {
        success: false,
        data: null,
        error: 'Erreur interne: données du créneau invalides',
      };
    }

    // 2. Vérifier que la réservation est confirmée
    if (reservation.status !== 'confirmed') {
      logger.warn('checkin.transferReservation - Réservation non confirmée', {
        reservationId,
        status: reservation.status,
      });
      return {
        success: false,
        data: null,
        error: 'Seules les réservations confirmées peuvent être transférées',
      };
    }

    // 3. Vérifier que ce n'est pas le même slot
    if (reservation.slot_id === targetSlotId) {
      logger.warn('checkin.transferReservation - Même slot source et cible');
      return {
        success: false,
        data: null,
        error: 'Le créneau cible est identique au créneau actuel',
      };
    }

    // 4. Vérifier l'accès au slot SOURCE
    const hasAccess = await canAccessSlot(reservation.slot_id, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.transferReservation - Accès refusé au slot source', {
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette réservation',
      };
    }

    // 5. Récupérer le slot cible et vérifier qu'il appartient au même spectacle
    const { data: targetSlot, error: targetError } = await supabase
      .from('slots')
      .select('id, show_id, capacity, remaining_capacity')
      .eq('id', targetSlotId)
      .single();

    if (targetError || !targetSlot) {
      logger.warn('checkin.transferReservation - Slot cible non trouvé', {
        targetSlotId,
        error: targetError,
      });
      return {
        success: false,
        data: null,
        error: 'Créneau cible non trouvé',
      };
    }

    if (targetSlot.show_id !== sourceSlot.show_id) {
      logger.warn('checkin.transferReservation - Spectacles différents', {
        sourceShowId: sourceSlot.show_id,
        targetShowId: targetSlot.show_id,
      });
      return {
        success: false,
        data: null,
        error: 'Le transfert n\'est possible qu\'entre créneaux du même spectacle',
      };
    }

    // 6. Calculer le nombre de places final
    const finalNumPlaces = newNumPlaces !== undefined ? newNumPlaces : reservation.num_places;

    // Validation du nombre de places : entier entre 1 et MAX_PLACES
    if (!Number.isInteger(finalNumPlaces)) {
      return {
        success: false,
        data: null,
        error: 'Le nombre de places doit être un nombre entier',
      };
    }

    if (finalNumPlaces < 1) {
      return {
        success: false,
        data: null,
        error: 'Le nombre de places doit être au moins 1',
      };
    }

    if (finalNumPlaces > MAX_PLACES) {
      return {
        success: false,
        data: null,
        error: `Le nombre de places ne peut pas dépasser ${MAX_PLACES}`,
      };
    }

    // 7. Calculer la capacité après transfert pour l'avertissement d'overbooking
    // Note: on ne libère pas encore les places du slot source dans ce calcul
    // car le trigger le fera automatiquement
    const remainingAfterTransfer = targetSlot.remaining_capacity - finalNumPlaces;
    const isUnlimited = targetSlot.capacity >= 999999;
    const isOverbooking = !isUnlimited && remainingAfterTransfer < 0;

    logger.info('checkin.transferReservation - Calcul capacité', {
      targetSlotId,
      currentRemaining: targetSlot.remaining_capacity,
      finalNumPlaces,
      remainingAfterTransfer,
      isOverbooking,
    });

    // 8. Effectuer le transfert (UPDATE)
    // Le trigger update_slot_capacity gère automatiquement les capacités
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        slot_id: targetSlotId,
        num_places: finalNumPlaces,
        checkin_status: null, // Reset du check-in
      })
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.transferReservation - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors du transfert',
      };
    }

    // 9. Transformer la réservation mise à jour
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      // Notes internes masquées pour les non-admins
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
    };

    logger.info('checkin.transferReservation - Succès', {
      reservationId,
      targetSlotId,
      finalNumPlaces,
      isOverbooking,
    });

    return {
      success: true,
      data: {
        reservation: result,
        targetSlotCapacity: {
          capacity: targetSlot.capacity,
          remainingAfterTransfer,
          isUnlimited,
          isOverbooking,
        },
      },
      error: null,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.transferReservation - Exception', {
      reservationId,
      error: message,
    });
    return {
      success: false,
      data: null,
      error: 'Une erreur inattendue est survenue lors du transfert',
    };
  }
}

/**
 * Récupère les créneaux disponibles pour le transfert d'une réservation
 * Retourne tous les créneaux du même spectacle (sauf le créneau actuel)
 */
export async function getTransferTargetSlots(
  reservationId: string,
  userId: string,
  role: UserRole,
  companyId: string | null
): Promise<{ data: CheckinSlot[]; error: string | null }> {
  try {
    logger.info('checkin.getTransferTargetSlots - Début', { reservationId, userId, role });

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id actuel
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        status,
        slots!inner (
          id,
          show_id,
          shows!inner (
            slug
          )
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.getTransferTargetSlots - Réservation non trouvée', { reservationId });
      return { data: [], error: 'Réservation non trouvée' };
    }

    // 2. Vérifier l'accès au slot source
    const hasAccess = await canAccessSlot(reservation.slot_id, userId, role, companyId);
    if (!hasAccess) {
      logger.warn('checkin.getTransferTargetSlots - Accès refusé');
      return { data: [], error: 'Accès non autorisé à cette réservation' };
    }

    // Extraire les infos du slot
    const sourceSlot = reservation.slots as unknown as { 
      id: string; 
      show_id: string; 
      shows: { slug: string } 
    };
    
    if (!sourceSlot?.shows?.slug) {
      logger.error('checkin.getTransferTargetSlots - Données slot invalides');
      return { data: [], error: 'Erreur interne: données invalides' };
    }

    // 3. Récupérer tous les slots du même spectacle via getAccessibleSlots
    // Note: on utilise getAccessibleSlots qui applique déjà les filtres de rôle
    // Mais pour le transfert, on veut TOUS les slots du spectacle (pas filtré par rôle)
    const { data: allSlots, error: slotsError } = await supabase
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
      .eq('show_id', sourceSlot.show_id)
      .neq('id', reservation.slot_id) // Exclure le slot actuel
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      logger.error('checkin.getTransferTargetSlots - Erreur Supabase', { error: slotsError });
      return { data: [], error: slotsError.message };
    }

    if (!allSlots || allSlots.length === 0) {
      return { data: [], error: null };
    }

    // 4. Transformer les données
    const slots: CheckinSlot[] = [];

    for (const slot of allSlots) {
      // Valider le venue
      const venue = isValidVenue(slot.venues)
        ? { id: slot.venues.id, name: slot.venues.name, city: (slot.venues as { city?: string }).city || '' }
        : { id: '', name: 'Lieu inconnu', city: '' };

      // Valider le show
      if (!isValidShow(slot.shows)) continue;
      const show = slot.shows;

      // Valider hosted_by
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

    logger.info('checkin.getTransferTargetSlots - Succès', { count: slots.length });
    return { data: slots, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.getTransferTargetSlots - Exception', { error: message });
    return { data: [], error: 'Une erreur inattendue est survenue' };
  }
}

// ============================================
// MISE À JOUR DES INFOS GUEST (SANS VÉRIF STATUT)
// ============================================

/** Paramètres pour mettre à jour les infos d'un guest (fonctionne même si annulée) */
export interface UpdateGuestInfoParams {
  reservationId: string;
  userId: string;
  role: UserRole;
  companyId: string | null;
  // Champs guest
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestEmailSecondary?: string | null;
  guestPhone?: string | null;
  guestPhoneSecondary?: string | null;
  guestStructure?: string | null;
  guestFunction?: string | null;
  guestAddress?: string | null;
  guestPostalCode?: string | null;
  guestCity?: string | null;
  guestAfcNumber?: string | null;
  specialRequests?: string | null;
  // Notes (pas de checkin_status car réservation peut être annulée)
  checkinComment?: string | null;
  checkinVenueNotes?: string | null;
  checkinInternalNotes?: string | null;
}

/** Résultat de la mise à jour des infos guest */
export interface UpdateGuestInfoResult {
  success: boolean;
  data: CheckinReservation | null;
  error: string | null;
}

/**
 * Met à jour les informations d'un guest sur une réservation
 * 
 * Contrairement à updateCheckinStatus, cette fonction :
 * - Fonctionne même si la réservation est annulée
 * - Ne permet PAS de modifier le checkin_status
 * - Permet de modifier les notes et les infos du professionnel
 */
export async function updateGuestInfo(
  params: UpdateGuestInfoParams
): Promise<UpdateGuestInfoResult> {
  const {
    reservationId,
    userId,
    role,
    companyId,
    guestFirstName,
    guestLastName,
    guestEmail,
    guestEmailSecondary,
    guestPhone,
    guestPhoneSecondary,
    guestStructure,
    guestFunction,
    guestAddress,
    guestPostalCode,
    guestCity,
    guestAfcNumber,
    specialRequests,
    checkinComment,
    checkinVenueNotes,
    checkinInternalNotes,
  } = params;

  try {
    logger.info('checkin.updateGuestInfo - Début', {
      reservationId,
      userId,
      role,
    });

    // Validation basique
    if (!guestFirstName.trim() || !guestLastName.trim()) {
      return {
        success: false,
        data: null,
        error: 'Le prénom et le nom sont obligatoires',
      };
    }
    if (!guestEmail.trim()) {
      return {
        success: false,
        data: null,
        error: "L'email est obligatoire",
      };
    }

    const supabase = createClient();

    // 1. Récupérer la réservation pour obtenir le slot_id
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, slot_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.updateGuestInfo - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // 2. Vérifier l'accès au slot (même pour les annulées)
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.updateGuestInfo - Accès refusé', {
        reservationId,
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette représentation',
      };
    }

    // 3. Construire l'objet de mise à jour
    const updateData: Record<string, string | null> = {
      guest_first_name: guestFirstName.trim(),
      guest_last_name: guestLastName.trim(),
      guest_email: guestEmail.trim(),
      guest_email_secondary: guestEmailSecondary?.trim() || null,
      guest_phone: guestPhone?.trim() || null,
      guest_phone_secondary: guestPhoneSecondary?.trim() || null,
      guest_structure: guestStructure?.trim() || null,
      guest_function: guestFunction?.trim() || null,
      guest_address: guestAddress?.trim() || null,
      guest_postal_code: guestPostalCode?.trim() || null,
      guest_city: guestCity?.trim() || null,
      guest_afc_number: guestAfcNumber?.trim() || null,
      special_requests: specialRequests?.trim() || null,
    };

    // Ajouter les notes si fournies
    if (checkinComment !== undefined) {
      updateData.checkin_comment = checkinComment?.trim() || null;
    }
    if (checkinVenueNotes !== undefined) {
      updateData.checkin_venue_notes = checkinVenueNotes?.trim() || null;
    }
    // Notes internes uniquement pour les admins
    if (checkinInternalNotes !== undefined && ADMIN_ROLES.includes(role)) {
      updateData.checkin_internal_notes = checkinInternalNotes?.trim() || null;
    }

    // 4. Effectuer la mise à jour
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.updateGuestInfo - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de la mise à jour',
      };
    }

    // 5. Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
    };

    logger.info('checkin.updateGuestInfo - Succès', { reservationId });

    return { success: true, data: result, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.updateGuestInfo - Exception', {
      reservationId,
      error: message,
    });
    return { success: false, data: null, error: message };
  }
}

// ============================================
// RÉACTIVATION DE RÉSERVATION ANNULÉE
// ============================================

/** Paramètres pour réactiver une réservation annulée */
export interface ReactivateReservationParams {
  reservationId: string;
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Résultat de la réactivation */
export interface ReactivateReservationResult {
  success: boolean;
  data: {
    reservation: CheckinReservation;
    /** True si la réactivation a causé un overbooking */
    isOverbooking: boolean;
  } | null;
  error: string | null;
}

/**
 * Réactive une réservation annulée
 * 
 * Fonctionnalités :
 * - Vérifie que la réservation est bien annulée
 * - Vérifie l'accès au slot
 * - Passe le statut de 'cancelled' à 'confirmed'
 * - Le trigger update_slot_capacity gère la décrémentation de remaining_capacity
 * - Autorise l'overbooking (retourne un warning via isOverbooking)
 */
export async function reactivateReservation(
  params: ReactivateReservationParams
): Promise<ReactivateReservationResult> {
  const { reservationId, userId, role, companyId } = params;

  try {
    logger.info('checkin.reactivateReservation - Début', {
      reservationId,
      userId,
      role,
    });

    const supabase = createClient();

    // 1. Récupérer la réservation avec les infos du slot
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        slot_id,
        num_places,
        status,
        slots!inner (
          id,
          capacity,
          remaining_capacity
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.reactivateReservation - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // 2. Vérifier que la réservation est bien annulée
    if (reservation.status !== 'cancelled') {
      logger.warn('checkin.reactivateReservation - Réservation non annulée', {
        reservationId,
        status: reservation.status,
      });
      return {
        success: false,
        data: null,
        error: 'Cette réservation n\'est pas annulée',
      };
    }

    // 3. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.reactivateReservation - Accès refusé', {
        reservationId,
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette représentation',
      };
    }

    // 4. Extraire les infos du slot pour vérifier l'overbooking
    const slot = reservation.slots as unknown as {
      id: string;
      capacity: number;
      remaining_capacity: number;
    };

    const isUnlimited = slot.capacity >= 999999;
    const remainingAfterReactivation = slot.remaining_capacity - reservation.num_places;
    const isOverbooking = !isUnlimited && remainingAfterReactivation < 0;

    logger.info('checkin.reactivateReservation - Calcul capacité', {
      slotId: slot.id,
      currentRemaining: slot.remaining_capacity,
      numPlaces: reservation.num_places,
      remainingAfterReactivation,
      isOverbooking,
    });

    // 5. Réactiver la réservation
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        // On ne reset pas le checkin_status car il était probablement null
      })
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.reactivateReservation - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de la réactivation',
      };
    }

    // 6. Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
    };

    logger.info('checkin.reactivateReservation - Succès', {
      reservationId,
      isOverbooking,
    });

    return {
      success: true,
      data: {
        reservation: result,
        isOverbooking,
      },
      error: null,
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.reactivateReservation - Exception', {
      reservationId,
      error: message,
    });
    return { success: false, data: null, error: message };
  }
}

// ============================================
// ANNULATION DE RÉSERVATION
// ============================================

/** Paramètres pour annuler une réservation */
export interface CancelReservationParams {
  reservationId: string;
  userId: string;
  role: UserRole;
  companyId: string | null;
}

/** Résultat de l'annulation */
export interface CancelReservationResult {
  success: boolean;
  data: CheckinReservation | null;
  error: string | null;
}

/**
 * Annule une réservation confirmée
 * 
 * Fonctionnalités :
 * - Vérifie que la réservation est bien confirmée
 * - Vérifie l'accès au slot
 * - Passe le statut de 'confirmed' à 'cancelled'
 * - Réinitialise le checkin_status à null
 * - Le trigger update_slot_capacity gère l'incrémentation de remaining_capacity
 */
export async function cancelReservationFromPWA(
  params: CancelReservationParams
): Promise<CancelReservationResult> {
  const { reservationId, userId, role, companyId } = params;

  try {
    logger.info('checkin.cancelReservationFromPWA - Début', {
      reservationId,
      userId,
      role,
    });

    const supabase = createClient();

    // 1. Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, slot_id, status')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      logger.warn('checkin.cancelReservationFromPWA - Réservation non trouvée', {
        reservationId,
        error: fetchError,
      });
      return {
        success: false,
        data: null,
        error: 'Réservation non trouvée',
      };
    }

    // 2. Vérifier que la réservation est bien confirmée
    if (reservation.status !== 'confirmed') {
      logger.warn('checkin.cancelReservationFromPWA - Réservation non confirmée', {
        reservationId,
        status: reservation.status,
      });
      return {
        success: false,
        data: null,
        error: 'Cette réservation n\'est pas confirmée',
      };
    }

    // 3. Vérifier l'accès au slot
    const hasAccess = await canAccessSlot(
      reservation.slot_id,
      userId,
      role,
      companyId
    );

    if (!hasAccess) {
      logger.warn('checkin.cancelReservationFromPWA - Accès refusé', {
        reservationId,
        slotId: reservation.slot_id,
        userId,
      });
      return {
        success: false,
        data: null,
        error: 'Accès non autorisé à cette représentation',
      };
    }

    // 4. Annuler la réservation
    const { data: updated, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        checkin_status: null, // Réinitialiser le statut de check-in
      })
      .eq('id', reservationId)
      .select(`
        id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_email_secondary,
        guest_phone,
        guest_phone_secondary,
        guest_function,
        guest_structure,
        guest_address,
        guest_postal_code,
        guest_city,
        guest_afc_number,
        num_places,
        status,
        checkin_status,
        checkin_comment,
        checkin_venue_notes,
        checkin_internal_notes,
        special_requests,
        created_at
      `)
      .single();

    if (updateError || !updated) {
      logger.error('checkin.cancelReservationFromPWA - Erreur mise à jour', {
        reservationId,
        error: updateError,
      });
      return {
        success: false,
        data: null,
        error: updateError?.message || 'Erreur lors de l\'annulation',
      };
    }

    // 5. Transformer et retourner
    const result: CheckinReservation = {
      id: updated.id,
      guestFirstName: updated.guest_first_name,
      guestLastName: updated.guest_last_name,
      guestEmail: updated.guest_email,
      guestEmailSecondary: updated.guest_email_secondary,
      guestPhone: updated.guest_phone,
      guestPhoneSecondary: updated.guest_phone_secondary,
      guestFunction: updated.guest_function,
      guestStructure: updated.guest_structure,
      guestAddress: updated.guest_address,
      guestPostalCode: updated.guest_postal_code,
      guestCity: updated.guest_city,
      guestAfcNumber: updated.guest_afc_number,
      numPlaces: updated.num_places,
      status: updated.status as 'confirmed' | 'cancelled' | 'no_show',
      checkinStatus: updated.checkin_status as import('@/types/database').CheckinStatus | null,
      checkinComment: updated.checkin_comment,
      checkinVenueNotes: updated.checkin_venue_notes,
      checkinInternalNotes: ADMIN_ROLES.includes(role) ? updated.checkin_internal_notes : null,
      specialRequests: updated.special_requests,
      createdAt: updated.created_at,
    };

    logger.info('checkin.cancelReservationFromPWA - Succès', { reservationId });

    return { success: true, data: result, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('checkin.cancelReservationFromPWA - Exception', {
      reservationId,
      error: message,
    });
    return { success: false, data: null, error: message };
  }
}
