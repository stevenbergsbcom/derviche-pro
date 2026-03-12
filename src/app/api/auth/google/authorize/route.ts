/**
 * API Route — Lancement du flux OAuth2 Google Calendar
 * GET /api/auth/google/authorize
 *
 * Génère l'URL de consentement Google et redirige le navigateur.
 * Le super-admin autorise le compte reservation.derviche@gmail.com,
 * puis Google redirige vers /api/auth/google/callback avec un code.
 *
 * Sécurité :
 *   - Authentification requise (session Supabase)
 *   - Rôle super-admin uniquement
 *   - CSRF : paramètre `state` stocké en cookie httpOnly
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getGoogleRedirectUri, CALENDAR_SCOPE } from '@/lib/services/google-calendar';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    // 1. Vérification auth + rôle super-admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'super-admin') {
      logger.warn('[auth/google/authorize] Accès refusé', {
        userId: user.id,
        role: roleData?.role,
      });
      return NextResponse.json({ error: 'Accès réservé au super-admin' }, { status: 403 });
    }

    // 2. Vérifier que les env vars OAuth sont configurées
    const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET requis' },
        { status: 500 },
      );
    }

    // 3. Générer le state CSRF
    const state = crypto.randomUUID();

    // 4. Construire l'URL de consentement
    const redirectUri = getGoogleRedirectUri();

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',        // Pour obtenir un refresh_token
      prompt:      'consent',         // Forcer le re-consentement (nouveau refresh_token)
      scope:       [CALENDAR_SCOPE],
      state,
    });

    logger.info('[auth/google/authorize] Redirection vers Google OAuth', {
      userId: user.id,
      redirectUri,
    });

    // 5. Stocker le state dans un cookie httpOnly (validité 10 min)
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   600, // 10 minutes
      path:     '/api/auth/google',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('[auth/google/authorize] Exception', { message });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
