/**
 * API Route - Recherche d'un professionnel par email ou nom
 * GET /api/pwa/search-professional?q=...
 *
 * Mode auto selon la valeur de `q` :
 *   - Contient "@" → recherche par email exact
 *   - Sinon        → recherche par nom/prénom (ILIKE)
 *
 * Sécurité :
 *   - Authentification requise (admin, super-admin, externe)
 *   - Service role pour contourner RLS
 *   - Résultats limités à 10 max (protection RGPD)
 *   - Retourne uniquement les champs nécessaires
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import type { UserRole } from '@/types/database';

// ============================================
// VALIDATION
// ============================================

const querySchema = z.object({
  q: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Requête trop longue')
    .transform((s) => s.trim()),
});

// ============================================
// TYPES
// ============================================

export interface FoundProfile {
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
}

export type SearchProfessionalResult =
  | { found: true; profiles: FoundProfile[] }
  | { found: false };

// ============================================
// HELPERS
// ============================================

/** Détermine si la requête est une recherche par email */
function isEmailQuery(q: string): boolean {
  return q.includes('@');
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 1. Validation
    const { searchParams } = new URL(request.url);
    const parseResult = querySchema.safeParse({ q: searchParams.get('q') ?? '' });

    if (!parseResult.success) {
      return NextResponse.json(
        { found: false, error: parseResult.error.issues[0]?.message ?? 'Paramètre invalide' },
        { status: 400 }
      );
    }

    const { q } = parseResult.data;

    // 2. Auth
    const userClient = await createServerClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ found: false, error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Service role client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API search-professional] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json({ found: false, error: 'Configuration serveur manquante' }, { status: 500 });
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Vérification du rôle
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = userRoleData?.role as UserRole | undefined;
    const isAuthorized =
      userRole === 'super-admin' || userRole === 'admin' || userRole === 'externe';

    if (!isAuthorized) {
      return NextResponse.json({ found: false, error: 'Accès refusé' }, { status: 403 });
    }

    // 5. Requête selon le mode (email ou nom)
    const SELECT = `
      id, email, first_name, last_name, structure,
      phone, phone2, email2, afc_number, function,
      address, postal_code, city, deleted_at
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profilesQuery: any;

    if (isEmailQuery(q)) {
      // Recherche exacte par email
      profilesQuery = adminClient
        .from('profiles')
        .select(SELECT)
        .eq('email', q.toLowerCase())
        .is('deleted_at', null)
        .limit(1);
    } else {
      // Recherche par nom OU prénom (insensible accents via ILIKE)
      profilesQuery = adminClient
        .from('profiles')
        .select(SELECT)
        .or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%`)
        .is('deleted_at', null)
        .order('last_name', { ascending: true })
        .limit(10);
    }

    const { data: profiles, error: profileError } = await profilesQuery;

    if (profileError) {
      logger.error('[API search-professional] Erreur requête', { error: profileError.message });
      return NextResponse.json({ found: false, error: 'Erreur serveur' }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ found: false } satisfies SearchProfessionalResult);
    }

    // 6. Filtrer uniquement les professionnels
    // On récupère les rôles en une seule requête (IN)
    const profileIds = profiles.map((p: { id: string }) => p.id);
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', profileIds);

    const professionalIds = new Set(
      (roles ?? [])
        .filter((r: { role: string }) => r.role === 'professional')
        .map((r: { user_id: string }) => r.user_id)
    );

    const filteredProfiles = profiles.filter((p: { id: string }) =>
      professionalIds.has(p.id)
    );

    if (filteredProfiles.length === 0) {
      return NextResponse.json({ found: false } satisfies SearchProfessionalResult);
    }

    // 7. Transformation
    const result: SearchProfessionalResult = {
      found: true,
      profiles: filteredProfiles.map((p: {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        structure: string | null;
        phone: string | null;
        phone2: string | null;
        email2: string | null;
        afc_number: string | null;
        function?: string | null;
        address: string | null;
        postal_code: string | null;
        city: string | null;
      }) => ({
        id: p.id,
        email: p.email,
        firstName: p.first_name,
        lastName: p.last_name,
        organization: p.structure,
        phone: p.phone,
        phone2: p.phone2,
        email2: p.email2,
        afcNumber: p.afc_number,
        function: p.function ?? null,
        address: p.address,
        postalCode: p.postal_code,
        city: p.city,
      })),
    };

    logger.info('[API search-professional] Résultats', {
      query: isEmailQuery(q) ? 'email' : 'nom',
      count: filteredProfiles.length,
    });

    return NextResponse.json(result);

  } catch (err) {
    logger.error('[API search-professional] Exception', { err: String(err) });
    return NextResponse.json({ found: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
