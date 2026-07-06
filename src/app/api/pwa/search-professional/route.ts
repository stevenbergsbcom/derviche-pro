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
import {
  requireAuth,
  serverErrorResponse,
  getErrorMessage,
} from '@/lib/api';

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
  country: string | null;
  /** Migration 118 — ID CRM Zoho du profil (contact). */
  crmId: string | null;
  /** Migration 121 — ID CRM Zoho de la structure du pro. */
  crmStructureId: string | null;
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

/** Échappe les métacaractères ILIKE (% et _) pour éviter des résultats inattendus */
function escapeLike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Prépare un token pour interpolation dans une clause PostgREST `.or()`.
 *
 * La syntaxe `.or('col.ilike.%v%,col2.ilike.%v%')` utilise la virgule
 * comme séparateur de conditions et les parenthèses pour le groupement.
 * Un token contenant `,` `(` `)` `"` casserait donc la clause (voire
 * injecterait une condition parasite). On retire ces caractères
 * structurels — ils n'ont aucun sens dans une recherche nom/email/tél —
 * puis on applique l'échappement ILIKE habituel.
 *
 * Retourne `null` si le token devient vide après nettoyage (à ignorer).
 */
function sanitizeOrToken(token: string): string | null {
  const stripped = token.replace(/[(),"]/g, '').trim();
  if (!stripped) return null;
  return escapeLike(stripped);
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

    // 2. Auth + rôle
    const userClient = await createServerClient();
    const auth = await requireAuth(
      userClient,
      ['super-admin', 'admin', 'externe'],
      '[pwa/search-professional]'
    );
    if (!auth.ok) return auth.response;

    // 3. Service role client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API search-professional] SUPABASE_SERVICE_ROLE_KEY manquant');
      return serverErrorResponse('Configuration serveur manquante');
    }

    const adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Requête selon le mode (email ou nom/multi-tokens)
    const SELECT = `
      id, email, first_name, last_name, structure,
      phone, phone2, email2, afc_number, function,
      address, postal_code, city, country, crm_id, crm_structure_id, deleted_at
    `;

    // Recherche par nom : on split par espaces pour supporter "Jean Dupont"
    // (chaque token doit matcher au moins une colonne parmi last_name,
    // first_name, email, phone, structure). On applique les tokens en
    // filtres successifs — Supabase les combine en AND automatiquement,
    // donc "Jean Dupont" = tous les profils dont AU MOINS UN champ matche
    // "Jean" ET AU MOINS UN champ matche "Dupont". C'est le comportement
    // attendu par le staff qui tape prénom+nom.
    const buildNameQuery = (tokens: string[]) => {
      let queryB = adminClient
        .from('profiles')
        .select(SELECT)
        .is('deleted_at', null);

      // Chaque token = un groupe .or() ; Supabase combine les groupes en AND.
      for (const esc of tokens) {
        queryB = queryB.or(
          [
            `last_name.ilike.%${esc}%`,
            `first_name.ilike.%${esc}%`,
            `email.ilike.%${esc}%`,
            `phone.ilike.%${esc}%`,
            `structure.ilike.%${esc}%`,
          ].join(','),
        );
      }
      return queryB
        .order('last_name', { ascending: true })
        .limit(10);
    };

    // Sanitize les tokens (retire ,()" qui casseraient la clause .or()).
    const nameTokens = q
      .split(/\s+/)
      .map(sanitizeOrToken)
      .filter((t): t is string => t !== null);

    // Cas dégénéré : recherche par nom mais tous les tokens neutralisés
    // (ex: requête « (,) »). On court-circuite AVANT d'exécuter une requête
    // sans filtre .or() qui renverrait des profils au hasard (fuite RGPD).
    if (!isEmailQuery(q) && nameTokens.length === 0) {
      return NextResponse.json({ found: false } satisfies SearchProfessionalResult);
    }

    const { data: profiles, error: profileError } = await (
      isEmailQuery(q)
        ? adminClient
            .from('profiles')
            .select(SELECT)
            .eq('email', q.toLowerCase())
            .is('deleted_at', null)
            .limit(1)
        : buildNameQuery(nameTokens)
    );

    if (profileError) {
      logger.error('[API search-professional] Erreur requête', { error: profileError.message });
      return serverErrorResponse('Erreur serveur');
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ found: false } satisfies SearchProfessionalResult);
    }

    // 5. Filtrer uniquement les professionnels
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

    // 6. Transformation
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
        country: string | null;
        crm_id: string | null;
        crm_structure_id: string | null;
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
        country: p.country,
        crmId: p.crm_id,
        crmStructureId: p.crm_structure_id,
      })),
    };

    logger.info('[API search-professional] Résultats', {
      query: isEmailQuery(q) ? 'email' : 'nom',
      count: filteredProfiles.length,
    });

    return NextResponse.json(result);

  } catch (err) {
    logger.error('[API search-professional] Exception', { err: getErrorMessage(err) });
    return serverErrorResponse('Erreur serveur');
  }
}
