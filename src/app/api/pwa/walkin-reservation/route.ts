/**
 * API Route - Création d'une réservation walk-in depuis la PWA
 * POST /api/pwa/walkin-reservation
 *
 * Permet à un admin ou externe de créer une réservation on-the-spot
 * lors de l'accueil physique d'un professionnel sans réservation préalable.
 *
 * Fonctionnalités spécifiques vs admin classique :
 *   - Check-in status optionnel à la création
 *   - Override de capacité (admin/super-admin uniquement)
 *   - Retour d'avertissement capacité avant override
 *   - Envoi email confirmation (non-bloquant, switch ON/OFF)
 *
 * Sécurité :
 *   - Authentification requise (admin, super-admin ou externe)
 *   - Vérification assignation show pour les externes (via RPC)
 *   - Service role côté serveur uniquement
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import type { UserRole } from '@/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const CHECKIN_STATUS_VALUES = ['present_loved', 'present_press', 'present_neutral', 'absent'] as const;

const bodySchema = z.object({
  // Créneau
  slotId: z.string().uuid('slotId invalide'),
  numPlaces: z.number().int().min(1, 'numPlaces doit être ≥ 1'),

  // Données professionnelles (au moins nom + prénom + email)
  firstName: z.string().min(1, 'Prénom obligatoire').max(100),
  lastName: z.string().min(1, 'Nom obligatoire').max(100),
  email: z.string().email('Email invalide').max(255),
  phone: z.string().max(50).optional().nullable(),
  emailSecondary: z.string().email('Email secondaire invalide').max(255).optional().nullable(),
  phoneSecondary: z.string().max(50).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  organization: z.string().max(255).optional().nullable(),
  function: z.string().max(100).optional().nullable(),
  afcNumber: z.string().max(50).optional().nullable(),

  // Notes réservation
  specialRequests: z.string().max(1000).optional().nullable(),
  checkinVenueNotes: z.string().max(1000).optional().nullable(),
  checkinInternalNotes: z.string().max(1000).optional().nullable(),

  // Check-in optionnel à la création
  checkinStatus: z.enum(CHECKIN_STATUS_VALUES).optional().nullable(),

  // Comportement
  overrideCapacity: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
  syncCalendar: z.boolean().default(false),
});

// ============================================
// TYPE RÉSULTAT RPC
// ============================================

interface WalkInRpcResult {
  success: boolean;
  reservation_id?: string;
  capacity_warning?: boolean;
  remaining?: number;
  requested?: number;
  error?: string;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Valider le body
    const rawBody: unknown = await request.json();
    const parseResult = bodySchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? 'Données invalides' },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 2. Vérifier l'authentification
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Client service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /pwa/walkin-reservation] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json({ success: false, error: 'Configuration serveur manquante' }, { status: 500 });
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Vérifier le rôle de l'utilisateur
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = userRoleData?.role as UserRole | undefined;
    const isAuthorized =
      userRole === 'super-admin' ||
      userRole === 'admin' ||
      userRole === 'externe';

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 5. Appel à la RPC create_walkin_reservation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcResult, error: rpcError } = await (adminClient.rpc as any)(
      'create_walkin_reservation',
      {
        p_slot_id: data.slotId,
        p_num_places: data.numPlaces,
        p_first_name: data.firstName.trim(),
        p_last_name: data.lastName.trim(),
        p_email: data.email.trim().toLowerCase(),
        p_phone: data.phone?.trim() || null,
        p_email_secondary: data.emailSecondary?.trim() || null,
        p_phone_secondary: data.phoneSecondary?.trim() || null,
        p_address: data.address?.trim() || null,
        p_postal_code: data.postalCode?.trim() || null,
        p_city: data.city?.trim() || null,
        p_organization: data.organization?.trim() || null,
        p_function: data.function?.trim() || null,
        p_afc_number: data.afcNumber?.trim() || null,
        p_special_requests: data.specialRequests?.trim() || null,
        p_checkin_venue_notes: data.checkinVenueNotes?.trim() || null,
        p_checkin_internal_notes: data.checkinInternalNotes?.trim() || null,
        p_checkin_status: data.checkinStatus ?? null,
        p_override_capacity: data.overrideCapacity,
      }
    );

    if (rpcError) {
      logger.error('[API /pwa/walkin-reservation] Erreur RPC', { error: rpcError.message });
      return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
    }

    const result = rpcResult as WalkInRpcResult;

    // 6. Avertissement capacité (retour sans créer)
    if (!result.success && result.capacity_warning) {
      logger.info('[API /pwa/walkin-reservation] Avertissement capacité', {
        slotId: data.slotId,
        remaining: result.remaining,
        requested: result.requested,
      });
      return NextResponse.json({
        success: false,
        capacityWarning: true,
        remaining: result.remaining ?? 0,
        requested: result.requested ?? data.numPlaces,
      });
    }

    // 7. Échec RPC (autre erreur)
    if (!result.success || !result.reservation_id) {
      logger.error('[API /pwa/walkin-reservation] Échec RPC', { error: result.error });
      return NextResponse.json(
        { success: false, error: result.error ?? 'Erreur lors de la création' },
        { status: 422 }
      );
    }

    const reservationId = result.reservation_id;
    logger.info('[API /pwa/walkin-reservation] Réservation créée', { reservationId });

    // 8. Email de confirmation (non-bloquant, fire-and-forget)
    if (data.sendEmail) {
      void fetch(
        new URL('/api/emails/send-confirmation-by-id', request.url).toString(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId,
            syncCalendar: data.syncCalendar,
          }),
        }
      ).catch((err) => {
        logger.warn('[API /pwa/walkin-reservation] Email confirmation non envoyé (non-bloquant)', {
          err: String(err),
          reservationId,
        });
      });
    }

    return NextResponse.json({
      success: true,
      reservationId,
      capacityWarning: result.capacity_warning ?? false,
    });

  } catch (err) {
    logger.error('[API /pwa/walkin-reservation] Exception', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
