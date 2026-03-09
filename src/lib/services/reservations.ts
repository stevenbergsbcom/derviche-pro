/**
 * Service Reservations - Création et gestion des réservations
 * Derviche Diffusion
 * 
 * Gère la création de réservations pour les visiteurs (connectés ou non)
 * et la mise à jour des capacités des créneaux.
 */

import { createClient } from '@/lib/supabase/client';
import type { ReservationRow } from '@/types/database';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Données du formulaire de réservation public */
export interface PublicReservationFormData {
  firstName: string;
  lastName: string;
  email: string;
  emailSecondary?: string;
  phone: string;
  phoneSecondary?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  organization?: string;
  function?: string;
  afcNumber?: string;
  comment?: string;
}

/** Données pour créer une réservation */
export interface CreateReservationData {
  slotId: string;
  numPlaces: number;
  formData: PublicReservationFormData;
  /** ID utilisateur si connecté (null pour guest) */
  userId?: string | null;
}

/** Codes d'erreur structurés pour une gestion fine côté UI */
export type CreateReservationErrorCode = 'CAPACITY_FULL' | 'DUPLICATE' | 'GENERIC';

/** Résultat de la création de réservation */
export interface CreateReservationResult {
  success: boolean;
  data?: {
    reservationId: string;
    code: string;
  };
  error?: string;
  /** Code machine pour permettre un affichage UI adapté (ex: HTTP 409) */
  errorCode?: CreateReservationErrorCode;
}

// ============================================
// HELPERS
// ============================================

/**
 * Générer un code de réservation lisible
 * Format: DD-XXXXXX (6 caractères alphanumériques)
 */
function generateReservationCode(reservationId: string): string {
  // Prendre les 6 premiers caractères de l'UUID (sans tirets)
  const shortId = reservationId.replace(/-/g, '').substring(0, 6).toUpperCase();
  return `DD-${shortId}`;
}

// ============================================
// SERVICE PRINCIPAL
// ============================================

/**
 * Créer une nouvelle réservation
 * 
 * Cette fonction:
 * 1. Appelle la RPC create_public_reservation (verrou atomique FOR UPDATE)
 * 2. La RPC crée la réservation et le trigger décrémente remaining_capacity
 * 3. Retourne l'ID et le code de réservation, ou un errorCode structuré
 * 
 * @param data - Données de la réservation
 * @returns Résultat avec l'ID de réservation ou une erreur
 */
export async function createReservation(
  data: CreateReservationData
): Promise<CreateReservationResult> {
  const { slotId, numPlaces, formData } = data;
  // Note: userId sera utilisé plus tard pour lier la réservation à un utilisateur connecté

  logger.info('[reservations] Création réservation', { 
    slotId, 
    numPlaces, 
    email: formData.email 
  });

  try {
    // Obtenir le client Supabase
    const supabase = createClient();

    // ============================================
    // 1. Créer la réservation via RPC (bypass RLS)
    // ============================================
    // La RPC create_public_reservation effectue un SELECT ... FOR UPDATE
    // sur le slot AVANT l'INSERT, garantissant l'atomicité même en cas
    // de réservations simultanées (migration 074).
    // Plus besoin de pré-vérification côté client (non-atomique).
    const { data: reservationId, error: rpcError } = await supabase
      .rpc('create_public_reservation', {
        p_slot_id: slotId,
        p_num_places: numPlaces,
        p_first_name: formData.firstName.trim(),
        p_last_name: formData.lastName.trim(),
        p_email: formData.email.trim().toLowerCase(),
        p_phone: formData.phone.trim() || undefined,
        p_email_secondary: formData.emailSecondary?.trim() || undefined,
        p_phone_secondary: formData.phoneSecondary?.trim() || undefined,
        p_address: formData.address?.trim() || undefined,
        p_postal_code: formData.postalCode?.trim() || undefined,
        p_city: formData.city?.trim() || undefined,
        p_country: formData.country?.trim() || undefined,
        p_organization: formData.organization?.trim() || undefined,
        p_function: formData.function?.trim() || undefined,
        p_afc_number: formData.afcNumber?.trim() || undefined,
        p_comment: formData.comment?.trim() || undefined,
      });

    if (rpcError) {
      // Créneau complet au moment de l'INSERT (verrou atomique migration 074)
      // Format : "CAPACITY_FULL:N place(s) restante(s)"
      if (rpcError.message?.includes('CAPACITY_FULL:')) {
        const remaining = rpcError.message.split('CAPACITY_FULL:')[1]?.split(' ')[0] ?? '0';
        logger.warn('[reservations] Créneau complet (concurrence)', { slotId, remaining });
        return {
          success: false,
          errorCode: 'CAPACITY_FULL',
          error:
            remaining === '0'
              ? 'Ce créneau est complet. Il ne reste plus aucune place disponible.'
              : `Ce créneau est complet. Il ne reste que ${remaining} place(s) disponible(s).`,
        };
      }

      // Détecter l'erreur de doublon email/slot (R-RESA-04)
      if (rpcError.message?.includes('DUPLICATE_EMAIL_SLOT:')) {
        const email = rpcError.message.split('DUPLICATE_EMAIL_SLOT:')[1]?.trim() || formData.email;
        logger.warn('[reservations] Doublon email/slot détecté', { slotId, email });
        return {
          success: false,
          errorCode: 'DUPLICATE',
          error: `Vous avez déjà une réservation pour ce créneau avec l'adresse ${email}. Si vous souhaitez modifier votre réservation, veuillez nous contacter.`,
        };
      }

      logger.error('[reservations] Erreur création réservation via RPC', {
        error: rpcError,
      });
      return {
        success: false,
        errorCode: 'GENERIC',
        error: 'Une erreur est survenue lors de la création de votre réservation. Veuillez réessayer.',
      };
    }

    if (!reservationId) {
      logger.error('[reservations] Pas d\'ID retourné par la RPC');
      return {
        success: false,
        error: 'Une erreur est survenue lors de la création de votre réservation. Veuillez réessayer.',
      };
    }

    // NOTE: Le trigger 'update_slot_capacity' gère automatiquement
    // la décrémentation de remaining_capacity lors de l'INSERT.
    // Le verrou FOR UPDATE de la RPC garantit que ce trigger opère
    // sur la bonne valeur même en cas de concurrence.
    const reservation = { id: reservationId as string };

    // ============================================
    // 2. Retourner le succès
    // ============================================
    const code = generateReservationCode(reservation.id);

    logger.info('[reservations] Réservation créée avec succès', {
      reservationId: reservation.id,
      code,
    });

    return {
      success: true,
      data: {
        reservationId: reservation.id,
        code,
      },
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[reservations] Exception création réservation', { error: message });
    return {
      success: false,
      error: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    };
  }
}

/**
 * Enrichit le profil de l'utilisateur connecté avec les données du formulaire de réservation.
 * Ne met à jour que les champs encore vides dans profiles (jamais d'écrasement).
 * Appelé de manière non-bloquante après une réservation réussie.
 *
 * @param formData - Données saisies dans le formulaire de réservation
 */
export async function enrichUserProfile(
  formData: PublicReservationFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guest : rien à faire
    if (!user) return { success: false };

    // Lire le profil actuel
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('phone, email2, phone2, address, postal_code, city, country, structure, function, afc_number')
      .eq('id', user.id)
      .single();

    if (fetchError || !profile) {
      logger.warn('[enrichUserProfile] Profil introuvable', { userId: user.id });
      return { success: false };
    }

    // Construire les mises à jour : champ vide en BDD + non vide dans le formulaire
    const updates: Record<string, string> = {};

    if (!profile.phone && formData.phone?.trim())
      updates.phone = formData.phone.trim();
    if (!profile.email2 && formData.emailSecondary?.trim())
      updates.email2 = formData.emailSecondary.trim();
    if (!profile.phone2 && formData.phoneSecondary?.trim())
      updates.phone2 = formData.phoneSecondary.trim();
    if (!profile.address && formData.address?.trim())
      updates.address = formData.address.trim();
    if (!profile.postal_code && formData.postalCode?.trim())
      updates.postal_code = formData.postalCode.trim();
    if (!profile.city && formData.city?.trim())
      updates.city = formData.city.trim();
    if (!profile.country && formData.country?.trim())
      updates.country = formData.country.trim();
    if (!profile.structure && formData.organization?.trim())
      updates.structure = formData.organization.trim();
    if (!profile.function && formData.function?.trim())
      updates.function = formData.function.trim();
    if (!profile.afc_number && formData.afcNumber?.trim())
      updates.afc_number = formData.afcNumber.trim();

    if (Object.keys(updates).length === 0) {
      logger.info('[enrichUserProfile] Aucun champ à enrichir', { userId: user.id });
      return { success: true };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      logger.error('[enrichUserProfile] Erreur mise à jour profil', {
        error: updateError.message,
      });
      return { success: false, error: updateError.message };
    }

    logger.info('[enrichUserProfile] Profil enrichi', {
      userId: user.id,
      updatedFields: Object.keys(updates),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[enrichUserProfile] Exception', { message });
    return { success: false };
  }
}

/**
 * Récupérer une réservation par son ID
 * Utile pour la page de confirmation
 */
export async function getReservationById(
  reservationId: string
): Promise<{ data: ReservationRow | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error) {
      logger.error('[reservations] Erreur lecture réservation', { 
        reservationId, 
        error 
      });
      return { data: null, error: 'Réservation non trouvée.' };
    }

    return { data: data as ReservationRow, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[reservations] Exception lecture réservation', { error: message });
    // SÉCURITÉ: Ne pas exposer les détails techniques
    return { data: null, error: 'Impossible de récupérer la réservation.' };
  }
}
