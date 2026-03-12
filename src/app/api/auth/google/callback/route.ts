/**
 * API Route — Callback OAuth2 Google Calendar
 * GET /api/auth/google/callback
 *
 * Google redirige ici après le consentement de l'utilisateur.
 * Échange le code d'autorisation contre un refresh_token,
 * le stocke dans app_settings et lance un health check.
 *
 * Sécurité :
 *   - Authentification requise (session Supabase)
 *   - Rôle super-admin uniquement
 *   - Vérification CSRF via paramètre `state` + cookie
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getGoogleRedirectUri } from '@/lib/services/google-calendar';
import { checkGoogleCalendarTokenHealth } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';
import type { Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const url       = new URL(request.url);
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const systemUrl = `${appUrl}/admin/systeme`;

  try {
    // 1. Vérification auth + rôle super-admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      logger.warn('[auth/google/callback] Utilisateur non authentifié');
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=unauthenticated`);
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'super-admin') {
      logger.warn('[auth/google/callback] Accès refusé', {
        userId: user.id,
        role: roleData?.role,
      });
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=forbidden`);
    }

    // 2. Vérification CSRF (state)
    const stateParam  = url.searchParams.get('state');
    const stateCookie = request.headers.get('cookie')
      ?.split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('google_oauth_state='))
      ?.split('=')[1];

    if (!stateParam || !stateCookie || stateParam !== stateCookie) {
      logger.warn('[auth/google/callback] State CSRF invalide', {
        hasParam: !!stateParam,
        hasCookie: !!stateCookie,
      });
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=csrf`);
    }

    // 3. Vérifier si Google a retourné une erreur
    const errorParam = url.searchParams.get('error');
    if (errorParam) {
      logger.warn('[auth/google/callback] Consentement refusé par Google', {
        error: errorParam,
        userId: user.id,
      });
      return NextResponse.redirect(`${systemUrl}?google_auth=denied`);
    }

    // 4. Récupérer le code d'autorisation
    const code = url.searchParams.get('code');
    if (!code) {
      logger.error('[auth/google/callback] Paramètre code manquant');
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=no_code`);
    }

    // 5. Échanger le code contre les tokens
    const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('[auth/google/callback] Env vars OAuth manquantes');
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=config`);
    }

    const redirectUri  = getGoogleRedirectUri();
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      logger.error('[auth/google/callback] Pas de refresh_token dans la réponse', {
        hasAccessToken: !!tokens.access_token,
        userId: user.id,
      });
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=no_refresh_token`);
    }

    // 6. Stocker le nouveau refresh_token dans app_settings
    const adminClient = createAdminClient();

    const { error: upsertErr } = await adminClient
      .from('app_settings')
      .update({ value: tokens.refresh_token as Json })
      .eq('key', 'google_calendar_refresh_token');

    if (upsertErr) {
      logger.error('[auth/google/callback] Erreur écriture refresh_token', {
        error: upsertErr.message,
      });
      return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=db_write`);
    }

    logger.info('[auth/google/callback] Nouveau refresh_token stocké avec succès', {
      userId: user.id,
    });

    // 7. Lancer un health check pour valider immédiatement le nouveau token
    try {
      await checkGoogleCalendarTokenHealth();
    } catch (healthErr) {
      // Non-bloquant — le token est stocké même si le health check échoue
      const msg = healthErr instanceof Error ? healthErr.message : String(healthErr);
      logger.warn('[auth/google/callback] Health check post-autorisation échoué', { error: msg });
    }

    // 8. Supprimer le cookie state et rediriger
    const response = NextResponse.redirect(`${systemUrl}?google_auth=success`);
    response.cookies.set('google_oauth_state', '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   0,
      path:     '/api/auth/google',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[auth/google/callback] Exception non gérée', { message });
    return NextResponse.redirect(`${systemUrl}?google_auth=error&reason=exception`);
  }
}
