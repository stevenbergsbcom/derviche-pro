/**
 * API Route - Recherche d'un professionnel par email
 * GET /api/pwa/search-professional?email=...
 *
 * Utilisée par la PWA lors de la création d'une réservation walk-in :
 * permet de savoir si un professionnel a déjà un compte avant de créer une réservation guest.
 *
 * Sécurité :
 * - Authentification requise (admin, super-admin ou externe)
 * - Service role côté serveur pour contourner les RLS
 * - Retourne uniquement les données nécessaires (pas de données sensibles)
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

const querySchema = z.object({
  email: z.string().email('Email invalide'),
});

// ============================================
// TYPE DE RETOUR
// ============================================

export type SearchProfessionalResult =
  | {
      found: true;
      profile: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        organization: string | null;
        phone: string | null;
        phone2: string | null;
        email2: string | null;
        afcNumber: string | null;
        function: string | null;
        address: string | null;
        postalCode: string | null;
        city: string | null;
      };
    }
  | { found: false };

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 1. Extraire et valider le query param
    const { searchParams } = new URL(request.url);
    const rawParams = { email: searchParams.get('email') ?? '' };
    const parseResult = querySchema.safeParse(rawParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Email invalide ou manquant' },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    // 2. Vérifier l'authentification
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Client service role (nécessaire pour lire les profils sans restriction RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API /pwa/search-professional] SUPABASE_SERVICE_ROLE_KEY manquant');
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

    // 5. Rechercher le profil par email (uniquement les professionnels actifs)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        structure,
        phone,
        phone2,
        email2,
        afc_number,
        function,
        address,
        postal_code,
        city,
        deleted_at
      `)
      .eq('email', email.toLowerCase().trim())
      .is('deleted_at', null)
      .maybeSingle();

    if (profileError) {
      logger.error('[API /pwa/search-professional] Erreur requête profil', { error: profileError.message });
      return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }

    // 6. Vérifier que c'est bien un professionnel (rôle "professional")
    if (profile) {
      const { data: roleData } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .maybeSingle();

      // Si le compte trouvé n'est pas un professionnel, on traite comme "not found"
      // (pas de raison d'accéder aux données staff depuis ce formulaire)
      if (!roleData || roleData.role !== 'professional') {
        logger.info('[API /pwa/search-professional] Email trouvé mais rôle non professionnel', {
          userId: profile.id,
          role: roleData?.role,
        });
        return NextResponse.json({ found: false } satisfies SearchProfessionalResult);
      }

      const result: SearchProfessionalResult = {
        found: true,
        profile: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          organization: profile.structure,
          phone: profile.phone,
          phone2: profile.phone2,
          email2: profile.email2,
          afcNumber: profile.afc_number,
          function: (profile as unknown as { function?: string | null }).function ?? null,
          address: profile.address,
          postalCode: profile.postal_code,
          city: profile.city,
        },
      };

      logger.info('[API /pwa/search-professional] Professionnel trouvé', { userId: profile.id });
      return NextResponse.json(result);
    }

    // 7. Aucun compte trouvé
    return NextResponse.json({ found: false } satisfies SearchProfessionalResult);

  } catch (err) {
    logger.error('[API /pwa/search-professional] Exception', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
