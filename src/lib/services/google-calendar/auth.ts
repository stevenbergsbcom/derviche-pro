/**
 * Auth — Service Google Calendar
 * Derviche Diffusion
 *
 * Authentification via OAuth2 avec le compte reservation.derviche@gmail.com.
 *
 * Le refresh_token est lu en priorité depuis app_settings (DB),
 * puis en fallback depuis la variable d'environnement GOOGLE_OAUTH_REFRESH_TOKEN.
 * Cela permet de renouveler le token via /api/auth/google/authorize
 * sans devoir toucher aux env vars Vercel.
 *
 * ⚠️ Si le refresh_token expire (inactivité > 6 mois ou révocation manuelle),
 * relancer la procédure : GET /api/auth/google/authorize
 */

import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';
import type { OAuth2Client } from 'googleapis-common';

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

// ============================================
// HELPERS
// ============================================

/**
 * Construit le redirect URI OAuth Google.
 *
 * En développement : toujours localhost (sinon Google redirige vers la prod).
 * En production : utilise NEXT_PUBLIC_APP_URL.
 *
 * ⚠️ Le redirect URI DOIT correspondre exactement à celui configuré
 * dans Google Cloud Console → Credentials → Authorized redirect URIs.
 */
export function getGoogleRedirectUri(): string {
  const isDev = process.env.NODE_ENV === 'development';
  const appUrl = isDev
    ? 'http://localhost:3000'
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://derviche-pro.fr');
  return `${appUrl}/api/auth/google/callback`;
}

/**
 * Lit le refresh_token depuis app_settings (DB) via service role.
 * Retourne null si absent, vide ou 'none'.
 */
async function getRefreshTokenFromDb(): Promise<string | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'google_calendar_refresh_token')
      .single();

    if (error || !data) return null;

    // La valeur est JSONB — Supabase la désérialise automatiquement
    const raw = data.value;
    if (typeof raw !== 'string') return null;

    const clean = raw.replace(/^"|"$/g, '');
    if (!clean || clean === 'none') return null;

    return clean;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('[GoogleCalendar/Auth] Impossible de lire le token depuis la DB', { error: msg });
    return null;
  }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Retourne un client OAuth2 authentifié.
 *
 * 1. Vérifie que client_id et client_secret sont configurés (env vars)
 * 2. Lit le refresh_token depuis la DB (app_settings), puis fallback env var
 * 3. Lève une erreur explicite si aucun refresh_token disponible
 */
export async function getGoogleAuthClient(): Promise<OAuth2Client> {
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      '[GoogleCalendar] Variables d\'environnement manquantes : ' +
      'GOOGLE_OAUTH_CLIENT_ID et GOOGLE_OAUTH_CLIENT_SECRET sont requis.'
    );
  }

  // Priorité : DB > env var
  const dbToken  = await getRefreshTokenFromDb();
  const envToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const refreshToken = dbToken ?? envToken;

  if (!refreshToken) {
    throw new Error(
      '[GoogleCalendar] Aucun refresh_token disponible. ' +
      'Lancez la procédure d\'autorisation : GET /api/auth/google/authorize'
    );
  }

  const redirectUri = getGoogleRedirectUri();

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    scope:         CALENDAR_SCOPE,
  });

  return oauth2Client;
}
