/**
 * Service pour la gestion des professionnels (programmateurs)
 * Derviche Diffusion - Plateforme de réservation professionnelle
 *
 * Fournit les opérations de lecture et écriture pour les comptes
 * de type 'professional' (programmateurs de salles).
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/**
 * Profil complet d'un professionnel avec comptage de réservations.
 * Correspond aux champs de la table `profiles` filtrés sur le rôle 'professional'.
 */
export interface Professional {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email2: string | null;
  phone2: string | null;
  function: string | null;
  structure: string | null;
  afc_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  comments: string | null;
  /** Migration 118 — ID CRM Zoho (contact) */
  crm_id: string | null;
  /** Migration 121 — ID CRM Zoho de la structure du pro */
  crm_structure_id: string | null;
  gdpr_consent: boolean;
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
  /** Nombre total de réservations (tous statuts confondus) */
  reservation_count: number;
}

/** Données pour mettre à jour le profil d'un professionnel */
export interface UpdateProfessionalData {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email2?: string | null;
  phone2?: string | null;
  function?: string | null;
  structure?: string | null;
  afc_number?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  comments?: string | null;
  /** Migration 118 — ID CRM Zoho (contact) */
  crm_id?: string | null;
  /** Migration 121 — ID CRM Zoho de la structure du pro */
  crm_structure_id?: string | null;
}

/** Résultat d'une liste de professionnels */
export interface ProfessionalsListResult {
  data: Professional[];
  error: string | null;
}

/** Résultat d'un professionnel unique */
export interface ProfessionalResult {
  data: Professional | null;
  error: string | null;
}

// ============================================
// FONCTIONS DE LECTURE
// ============================================

/**
 * Récupère tous les professionnels (rôle 'professional') avec
 * leur profil complet et le comptage de leurs réservations.
 *
 * Effectue deux requêtes :
 * 1. Les profils filtrés sur le rôle 'professional'
 * 2. Le comptage des réservations par user_id (agrégé côté client)
 */
export async function getProfessionals(): Promise<ProfessionalsListResult> {
  try {
    logger.info('professionals.getProfessionals - Chargement des professionnels');

    const supabase = createClient();

    // Requête 1 : profils avec jointure user_roles filtrée sur 'professional'
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        email2,
        phone2,
        function,
        structure,
        afc_number,
        address,
        postal_code,
        city,
        country,
        comments,
        crm_id,
        crm_structure_id,
        gdpr_consent,
        created_at,
        last_login_at,
        disabled_at,
        user_roles!inner (
          role
        )
      `)
      .is('deleted_at', null)
      .eq('user_roles.role', 'professional')
      .order('last_name', { ascending: true, nullsFirst: false });

    if (profilesError) {
      logger.error('professionals.getProfessionals - Erreur profils', { error: profilesError });
      return { data: [], error: profilesError.message };
    }

    if (!profilesData || profilesData.length === 0) {
      logger.info('professionals.getProfessionals - Aucun professionnel');
      return { data: [], error: null };
    }

    const professionalIds = profilesData.map((p) => p.id);

    // Requête 2 : réservations pour tous les professionnels (agrégation côté JS)
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select('user_id')
      .in('user_id', professionalIds)
      .not('user_id', 'is', null);

    if (reservationsError) {
      // Non bloquant : on continue avec count = 0
      logger.warn('professionals.getProfessionals - Erreur comptage réservations', {
        error: reservationsError,
      });
    }

    // Construire un map user_id → count
    const reservationCountMap = new Map<string, number>();
    for (const id of professionalIds) {
      reservationCountMap.set(id, 0);
    }
    for (const row of reservationsData ?? []) {
      if (row.user_id) {
        reservationCountMap.set(
          row.user_id,
          (reservationCountMap.get(row.user_id) ?? 0) + 1
        );
      }
    }

    // Assembler les professionnels
    const professionals: Professional[] = profilesData.map((profile) => ({
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      email2: profile.email2,
      phone2: profile.phone2,
      function: profile.function,
      structure: profile.structure,
      afc_number: profile.afc_number,
      address: profile.address,
      postal_code: profile.postal_code,
      city: profile.city,
      country: profile.country,
      comments: profile.comments,
      crm_id: profile.crm_id,
      crm_structure_id: profile.crm_structure_id,
      gdpr_consent: profile.gdpr_consent,
      created_at: profile.created_at,
      last_login_at: profile.last_login_at,
      disabled_at: profile.disabled_at,
      reservation_count: reservationCountMap.get(profile.id) ?? 0,
    }));

    logger.info('professionals.getProfessionals - Succès', { count: professionals.length });
    return { data: professionals, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('professionals.getProfessionals - Exception', { error: message });
    return { data: [], error: message };
  }
}

/**
 * Récupère un professionnel par son ID avec ses réservations comptées.
 */
export async function getProfessionalById(
  professionalId: string
): Promise<ProfessionalResult> {
  try {
    logger.info('professionals.getProfessionalById - Chargement', { professionalId });

    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        email2,
        phone2,
        function,
        structure,
        afc_number,
        address,
        postal_code,
        city,
        country,
        comments,
        crm_id,
        crm_structure_id,
        gdpr_consent,
        created_at,
        last_login_at,
        disabled_at,
        user_roles!inner (
          role
        )
      `)
      .eq('id', professionalId)
      .is('deleted_at', null)
      .eq('user_roles.role', 'professional')
      .single();

    if (error) {
      logger.error('professionals.getProfessionalById - Erreur', { error });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Professionnel non trouvé' };
    }

    // Compter les réservations
    const { count: reservationCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', professionalId);

    const professional: Professional = {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email2: data.email2,
      phone2: data.phone2,
      function: data.function,
      structure: data.structure,
      afc_number: data.afc_number,
      address: data.address,
      postal_code: data.postal_code,
      city: data.city,
      country: data.country,
      comments: data.comments,
      crm_id: data.crm_id,
      crm_structure_id: data.crm_structure_id,
      gdpr_consent: data.gdpr_consent,
      created_at: data.created_at,
      last_login_at: data.last_login_at,
      disabled_at: data.disabled_at,
      reservation_count: reservationCount ?? 0,
    };

    logger.info('professionals.getProfessionalById - Succès', { professionalId });
    return { data: professional, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('professionals.getProfessionalById - Exception', { error: message });
    return { data: null, error: message };
  }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate le nom complet d'un professionnel.
 */
export function formatProfessionalName(professional: Professional): string {
  if (professional.first_name && professional.last_name) {
    return `${professional.first_name} ${professional.last_name}`;
  }
  if (professional.first_name) return professional.first_name;
  if (professional.last_name) return professional.last_name;
  return professional.email;
}

/**
 * Formate le nom abrégé d'un professionnel (Prénom N.).
 */
export function formatProfessionalNameShort(professional: Professional): string {
  if (professional.first_name && professional.last_name) {
    return `${professional.first_name} ${professional.last_name.charAt(0)}.`;
  }
  return formatProfessionalName(professional);
}
