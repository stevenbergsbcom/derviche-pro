/**
 * Service Public Catalog - Requêtes principales
 * Derviche Diffusion
 *
 * Ce service fournit les données optimisées pour :
 * - La page d'accueil (spectacles en carousel)
 * - Le catalogue public (liste filtrable)
 * - La page détail spectacle
 *
 * Convention capacité :
 * - Supabase : capacity = 999999 signifie "illimité"
 * - Frontend : capacity = null signifie "illimité"
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { ShowStatus, ShowPriceType, SlotHostedBy } from '@/types/database';
import type {
  PublicSlot,
  PublicShow,
  PublicCatalogResult,
  PublicShowResult,
} from './types';
import { convertCapacity, calculateBooked, formatDateFr, extractDistinctVenues } from './transformers';

/**
 * Récupère tous les spectacles publiés avec leurs représentations futures
 * Optimisé pour les pages publiques (accueil et catalogue)
 */
export async function getPublicCatalog(): Promise<PublicCatalogResult> {
  try {
    const supabase = createClient();
    const todayISO = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Récupérer les spectacles publiés avec leur compagnie
    //    Tri éditorial : display_order ASC (NULLS LAST) puis title ASC en tie-break
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        slug,
        title,
        company_id,
        short_description,
        long_description,
        image_url,
        duration_minutes,
        status,
        price_type,
        max_reservations_per_booking,
        is_featured,
        display_order,
        companies!inner(name)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('title', { ascending: true });

    if (showsError) {
      logger.error('Erreur récupération shows publics', showsError);
      return { data: [], error: showsError.message };
    }

    if (!shows || shows.length === 0) {
      return { data: [], error: null };
    }

    const showIds = shows.map(s => s.id);

    // 2. Récupérer les slots futurs avec leurs lieux
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        id,
        show_id,
        date,
        time,
        capacity,
        remaining_capacity,
        hosted_by,
        venues!inner(id, name, city, address, postal_code)
      `)
      .in('show_id', showIds)
      .gte('date', todayISO)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      logger.error('Erreur récupération slots publics', slotsError);
      return { data: [], error: slotsError.message };
    }

    // 3. Récupérer les mappings catégories
    const { data: categoryMappings } = await supabase
      .from('show_category_mapping')
      .select(`
        show_id,
        show_categories!inner(name)
      `)
      .in('show_id', showIds);

    // 4. Récupérer les mappings target audiences
    const { data: audienceMappings } = await supabase
      .from('show_target_audience_mapping')
      .select(`
        show_id,
        target_audiences!inner(name)
      `)
      .in('show_id', showIds);

    // Organiser les slots par show_id
    const slotsByShow: Record<string, PublicSlot[]> = {};
    (slots || []).forEach(slot => {
      const venueData = slot.venues as {
        id: string;
        name: string;
        city: string;
        address: string | null;
        postal_code: string | null;
      } | null;
      const capacity = convertCapacity(slot.capacity);
      const remainingCapacity = convertCapacity(slot.remaining_capacity);
      const booked = calculateBooked(slot.capacity, slot.remaining_capacity);

      const publicSlot: PublicSlot = {
        id: slot.id,
        date: slot.date,
        time: slot.time.slice(0, 5), // HH:MM:SS → HH:MM
        venueId: venueData?.id || '',
        venueName: venueData?.name || 'Lieu inconnu',
        venueCity: venueData?.city || '',
        venueAddress: venueData?.address ?? null,
        venuePostalCode: venueData?.postal_code ?? null,
        capacity,
        remainingCapacity,
        booked: Math.max(0, booked),
        hostedBy: slot.hosted_by as SlotHostedBy,
      };

      if (!slotsByShow[slot.show_id]) {
        slotsByShow[slot.show_id] = [];
      }
      slotsByShow[slot.show_id].push(publicSlot);
    });

    // Organiser les catégories par show_id
    const categoriesByShow: Record<string, string[]> = {};
    (categoryMappings || []).forEach(mapping => {
      const categoryData = mapping.show_categories as { name: string } | null;
      if (categoryData) {
        if (!categoriesByShow[mapping.show_id]) {
          categoriesByShow[mapping.show_id] = [];
        }
        categoriesByShow[mapping.show_id].push(categoryData.name);
      }
    });

    // Organiser les audiences par show_id
    const audiencesByShow: Record<string, string[]> = {};
    (audienceMappings || []).forEach(mapping => {
      const audienceData = mapping.target_audiences as { name: string } | null;
      if (audienceData) {
        if (!audiencesByShow[mapping.show_id]) {
          audiencesByShow[mapping.show_id] = [];
        }
        audiencesByShow[mapping.show_id].push(audienceData.name);
      }
    });

    // Construire les PublicShow
    const publicShows: PublicShow[] = shows.map(show => {
      const companyData = show.companies as { name: string } | null;
      const showSlots = slotsByShow[show.id] || [];

      // Filtrer les créneaux avec places disponibles
      const availableSlots = showSlots.filter(slot => {
        // Illimité = toujours disponible
        if (slot.capacity === null) return true;
        // Sinon, vérifier qu'il reste des places
        return (slot.remainingCapacity ?? 0) > 0;
      });

      // Trouver la prochaine représentation disponible
      const nextSlot = availableSlots[0];

      return {
        id: show.id,
        slug: show.slug,
        title: show.title,
        companyId: show.company_id,
        companyName: companyData?.name || 'Compagnie inconnue',
        shortDescription: show.short_description,
        longDescription: show.long_description,
        imageUrl: show.image_url,
        durationMinutes: show.duration_minutes,
        status: show.status as ShowStatus,
        priceType: show.price_type as ShowPriceType,
        maxReservationsPerBooking: show.max_reservations_per_booking,
        categories: categoriesByShow[show.id] || [],
        targetAudiences: audiencesByShow[show.id] || [],
        venues: extractDistinctVenues(showSlots),
        slots: showSlots,
        availableSlotsCount: availableSlots.length,
        nextDate: nextSlot ? formatDateFr(nextSlot.date) : null,
        nextTime: nextSlot?.time ?? null,
        nextVenue: nextSlot ? nextSlot.venueName : null,
        // Champs détail — non chargés en mode catalogue
        period: null,
        closureDates: null,
        invitationPolicy: null,
        teaserUrl: null,
        dervisheSiteUrl: null,
        dervisheManager: null,
        // Migration 111 — Classement éditorial
        isFeatured: (show as { is_featured?: boolean | null }).is_featured ?? false,
        displayOrder: (show as { display_order?: number | null }).display_order ?? null,
      };
    });

    return { data: publicShows, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getPublicCatalog', { message });
    return { data: [], error: message };
  }
}

/**
 * Récupère un spectacle par son slug avec toutes ses représentations
 * Pour la page détail spectacle
 */
export async function getPublicShowBySlug(slug: string): Promise<PublicShowResult> {
  try {
    const supabase = createClient();

    // 1. Récupérer le spectacle
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        id,
        slug,
        title,
        company_id,
        short_description,
        long_description,
        image_url,
        duration_minutes,
        status,
        price_type,
        max_reservations_per_booking,
        period,
        closure_dates,
        invitation_policy,
        teaser_url,
        derviche_site_url,
        is_featured,
        display_order,
        companies!inner(name),
        profiles!derviche_manager_id(first_name, last_name, phone, email)
      `)
      .eq('slug', slug)
      .is('deleted_at', null)
      .single();

    if (showError) {
      if (showError.code === 'PGRST116') {
        // Not found
        return { data: null, error: null };
      }
      logger.error('Erreur récupération show par slug', { slug, error: showError.message });
      return { data: null, error: showError.message };
    }

    // 2. Récupérer TOUS les slots (futurs uniquement pour les spectacles publiés)
    const todayISO = new Date().toISOString().split('T')[0];

    // Pour les spectacles non publiés (draft), on ne montre pas les slots
    // Pour les spectacles publiés, on montre les slots futurs
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        id,
        show_id,
        date,
        time,
        capacity,
        remaining_capacity,
        hosted_by,
        venues!inner(id, name, city, address, postal_code)
      `)
      .eq('show_id', show.id)
      .gte('date', todayISO)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (slotsError) {
      logger.error('Erreur récupération slots pour show', { showId: show.id, error: slotsError.message });
      return { data: null, error: slotsError.message };
    }

    // 3. Récupérer les catégories
    const { data: categoryMappings } = await supabase
      .from('show_category_mapping')
      .select(`show_categories!inner(name)`)
      .eq('show_id', show.id);

    // 4. Récupérer les audiences
    const { data: audienceMappings } = await supabase
      .from('show_target_audience_mapping')
      .select(`target_audiences!inner(name)`)
      .eq('show_id', show.id);

    // Construire les slots
    const publicSlots: PublicSlot[] = (slots || []).map(slot => {
      const venueData = slot.venues as {
        id: string;
        name: string;
        city: string;
        address: string | null;
        postal_code: string | null;
      } | null;
      const capacity = convertCapacity(slot.capacity);
      const remainingCapacity = convertCapacity(slot.remaining_capacity);
      const booked = calculateBooked(slot.capacity, slot.remaining_capacity);

      return {
        id: slot.id,
        date: slot.date,
        time: slot.time.slice(0, 5),
        venueId: venueData?.id || '',
        venueName: venueData?.name || 'Lieu inconnu',
        venueCity: venueData?.city || '',
        venueAddress: venueData?.address ?? null,
        venuePostalCode: venueData?.postal_code ?? null,
        capacity,
        remainingCapacity,
        booked,
        hostedBy: slot.hosted_by as SlotHostedBy,
      };
    });

    // Filtrer les créneaux disponibles
    const availableSlots = publicSlots.filter(slot => {
      if (slot.capacity === null) return true;
      return (slot.remainingCapacity ?? 0) > 0;
    });

    const nextSlot = availableSlots[0];
    const companyData = show.companies as { name: string } | null;
    const managerData = show.profiles as {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      email: string;
    } | null;
    const dervisheManager: PublicShow['dervisheManager'] = managerData
      ? {
          firstName: managerData.first_name || '',
          lastName: managerData.last_name || '',
          phone: managerData.phone,
          email: managerData.email,
        }
      : null;

    const categories = (categoryMappings || [])
      .map(m => (m.show_categories as { name: string } | null)?.name)
      .filter((name): name is string => !!name);

    const audiences = (audienceMappings || [])
      .map(m => (m.target_audiences as { name: string } | null)?.name)
      .filter((name): name is string => !!name);

    const publicShow: PublicShow = {
      id: show.id,
      slug: show.slug,
      title: show.title,
      companyId: show.company_id,
      companyName: companyData?.name || 'Compagnie inconnue',
      shortDescription: show.short_description,
      longDescription: show.long_description,
      imageUrl: show.image_url,
      durationMinutes: show.duration_minutes,
      status: show.status as ShowStatus,
      priceType: show.price_type as ShowPriceType,
      maxReservationsPerBooking: show.max_reservations_per_booking,
      categories,
      targetAudiences: audiences,
      venues: extractDistinctVenues(publicSlots),
      slots: publicSlots,
      availableSlotsCount: availableSlots.length,
      nextDate: nextSlot ? formatDateFr(nextSlot.date) : null,
      nextTime: nextSlot?.time ?? null,
      nextVenue: nextSlot ? nextSlot.venueName : null,
      period: show.period,
      closureDates: show.closure_dates,
      invitationPolicy: show.invitation_policy,
      teaserUrl: show.teaser_url ?? null,
      dervisheSiteUrl: show.derviche_site_url ?? null,
      dervisheManager,
      // Migration 111 — Classement éditorial
      isFeatured: (show as { is_featured?: boolean | null }).is_featured ?? false,
      displayOrder: (show as { display_order?: number | null }).display_order ?? null,
    };

    return { data: publicShow, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getPublicShowBySlug', { slug, message });
    return { data: null, error: message };
  }
}

/**
 * Récupère la liste des lieux uniques utilisés dans les représentations futures
 * Pour les filtres du catalogue
 */
export async function getPublicVenues(): Promise<{ data: Array<{ id: string; name: string; city: string }>; error: string | null }> {
  try {
    const supabase = createClient();
    const todayISO = new Date().toISOString().split('T')[0];

    // Récupérer les venue_ids utilisés dans les slots futurs
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('venue_id')
      .gte('date', todayISO);

    if (slotsError) {
      logger.error('Erreur récupération venue_ids', slotsError);
      return { data: [], error: slotsError.message };
    }

    // Extraire les IDs uniques
    const venueIds = [...new Set((slots || []).map(s => s.venue_id))];

    if (venueIds.length === 0) {
      return { data: [], error: null };
    }

    // Récupérer les infos des lieux
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, name, city')
      .in('id', venueIds)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (venuesError) {
      logger.error('Erreur récupération venues', venuesError);
      return { data: [], error: venuesError.message };
    }

    return { data: venues || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getPublicVenues', { message });
    return { data: [], error: message };
  }
}
