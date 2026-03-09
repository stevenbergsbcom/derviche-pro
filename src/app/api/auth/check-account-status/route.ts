/**
 * API Route - Vérification du statut d'un compte après connexion
 * POST /api/auth/check-account-status
 *
 * Appelée côté client juste après signInWithPassword.
 * Reçoit l'access_token pour authentifier la requête (les cookies ne sont
 * pas encore propagés côté serveur au moment du premier appel post-login).
 *
 * Sécurité :
 * - Rate limiting : 5 req / 15 min par IP (anti brute-force sur le login)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NEXT_PUBLIC_SUPABASE_URL } from '@/lib/env';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSystem } from '@/lib/services/logs';

const bodySchema = z.object({
  userId: z.string().uuid(),
  accessToken: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 0. Rate limiting
    const rl = await checkRateLimit('auth', request);
    if (!rl.success) {
      void logSystem('rate_limit_blocked', 'warning', {
        route: '/api/auth/check-account-status',
        identifier: rl.identifier,
        limit: rl.limit,
      });
      return rateLimitResponse(rl);
    }

    // 1. Valider le body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ status: 'not_found' }, { status: 400 });
    }

    const parseResult = bodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ status: 'not_found' }, { status: 400 });
    }

    const { userId, accessToken } = parseResult.data;

    // 2. Service role : vérifier que le token est valide ET appartient au userId
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('[API check-account-status] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json({ status: 'ok' }); // fail-open, middleware prend le relais
    }

    const adminClient = createSupabaseClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Vérifier le token avec getUser (ne dépend pas des cookies)
    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);

    if (userError || !user) {
      logger.warn('[API check-account-status] Token invalide');
      return NextResponse.json({ status: 'not_found' }, { status: 401 });
    }

    // Sécurité : le userId du body doit correspondre au token
    if (user.id !== userId) {
      logger.warn('[API check-account-status] userId ne correspond pas au token');
      return NextResponse.json({ status: 'not_found' }, { status: 403 });
    }

    // 3. Lire le profil (service role bypasse RLS deleted_at IS NULL)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('disabled_at, deleted_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      logger.error('[API check-account-status] Erreur lecture profil', { error: profileError.message });
      return NextResponse.json({ status: 'ok' });
    }

    if (!profile)          return NextResponse.json({ status: 'not_found' });
    if (profile.deleted_at)  return NextResponse.json({ status: 'deleted' });
    if (profile.disabled_at) return NextResponse.json({ status: 'disabled' });

    return NextResponse.json({ status: 'ok' });

  } catch (err) {
    logger.error('[API check-account-status] Exception non gérée', { err });
    return NextResponse.json({ status: 'ok' }); // fail-open
  }
}
