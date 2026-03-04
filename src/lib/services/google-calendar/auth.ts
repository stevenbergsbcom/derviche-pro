/**
 * Auth — Service Google Calendar
 * Derviche Diffusion
 *
 * Authentification via OAuth2 avec le compte reservation.derviche@gmail.com.
 * Le refresh_token est stocké en variable d'environnement et permet d'obtenir
 * automatiquement un access_token à chaque appel sans intervention manuelle.
 *
 * ⚠️ Si le refresh_token expire (inactivité > 6 mois ou révocation manuelle),
 * relancer la procédure : GET /api/auth/google/authorize
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

/**
 * Retourne un client OAuth2 authentifié.
 * Lève une erreur explicite si les variables d'environnement sont absentes.
 */
export function getGoogleAuthClient(): OAuth2Client {
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      '[GoogleCalendar] Variables d\'environnement manquantes : ' +
      'GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET et GOOGLE_OAUTH_REFRESH_TOKEN sont requis.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    // Redirect URI non utilisé pour les appels serveur-à-serveur
    'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    scope:         CALENDAR_SCOPE,
  });

  return oauth2Client;
}
