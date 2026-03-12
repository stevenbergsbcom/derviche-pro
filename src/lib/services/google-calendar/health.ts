/**
 * Health — Service Google Calendar
 * Derviche Diffusion
 *
 * Valide le refresh_token en demandant un access_token à Google.
 * Stocke le résultat dans app_settings pour affichage dans /admin/systeme.
 * En cas d'échec : notification admin + log dans app_logs.
 *
 * Double fonction :
 *   1. Détecte proactivement un token expiré/révoqué
 *   2. Empêche l'expiration par inactivité (> 6 mois) en utilisant le token
 *
 * Utilisé par :
 *   - Cron quotidien : /api/cron/google-calendar-health
 *   - Vérification manuelle : /api/admin/google-calendar/health
 *
 * Serveur uniquement (service_role pour écrire dans app_settings).
 */

import { getGoogleAuthClient } from './auth';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';
import { logCalendar } from '@/lib/services/logs';
import { createAdminNotification } from '@/lib/services/notifications';
import type { Json } from '@/types/supabase';

// ============================================
// TYPES
// ============================================

export interface GoogleCalendarHealthResult {
  /** Statut du token : valid, invalid, ou error (erreur technique) */
  status: 'valid' | 'invalid' | 'error';
  /** Timestamp ISO de la vérification */
  checkedAt: string;
  /** Date d'expiration de l'access token (si disponible) */
  accessTokenExpiry?: string;
  /** Message d'erreur si invalide ou error */
  errorMessage?: string;
}

// ============================================
// HELPER — Écriture dans app_settings
// ============================================

/**
 * Met à jour les clés health dans app_settings via service role (bypass RLS).
 * Non-bloquant — fire & forget.
 */
async function writeHealthStatus(
  status: string,
  checkedAt: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();

    await Promise.all([
      supabase
        .from('app_settings')
        .update({ value: status as Json })
        .eq('key', 'google_calendar_token_status'),
      supabase
        .from('app_settings')
        .update({ value: checkedAt as Json })
        .eq('key', 'google_calendar_last_health_check'),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[GoogleCalendar/Health] Erreur écriture app_settings', { error: message });
  }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Vérifie la validité du refresh_token Google Calendar.
 *
 * 1. Crée un OAuth2Client avec le refresh_token
 * 2. Tente d'obtenir un access_token (force un refresh)
 * 3. Stocke le résultat dans app_settings
 * 4. Si échec : notification admin + log erreur
 */
export async function checkGoogleCalendarTokenHealth(): Promise<GoogleCalendarHealthResult> {
  const now = new Date().toISOString();

  try {
    // Obtenir le client OAuth2 (lève une erreur si env vars manquantes)
    const oauth2Client = await getGoogleAuthClient();

    // Forcer un refresh du token — c'est la validation clé
    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      const errorMessage = 'Access token obtenu mais vide';

      await writeHealthStatus('invalid', now);

      void logCalendar('calendar_health_check', false, {
        error_message: errorMessage,
      });

      void createAdminNotification({
        type: 'calendar_error',
        reservation_id: null,
        professional_name: 'Système',
        show_title: 'Google Calendar',
        slot_date: null,
        message: `Vérification token échouée : ${errorMessage}. Relancez la procédure d'autorisation.`,
      });

      return { status: 'invalid', checkedAt: now, errorMessage };
    }

    // Succès — token valide
    const expiryDate = oauth2Client.credentials.expiry_date;
    const accessTokenExpiry = expiryDate
      ? new Date(expiryDate).toISOString()
      : undefined;

    await writeHealthStatus('valid', now);

    void logCalendar('calendar_health_check', true, {});

    logger.info('[GoogleCalendar/Health] Token valide', {
      accessTokenExpiry: accessTokenExpiry ?? 'non disponible',
    });

    return { status: 'valid', checkedAt: now, accessTokenExpiry };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await writeHealthStatus('invalid', now);

    void logCalendar('calendar_health_check', false, {
      error_message: errorMessage,
    });

    void createAdminNotification({
      type: 'calendar_error',
      reservation_id: null,
      professional_name: 'Système',
      show_title: 'Google Calendar',
      slot_date: null,
      message: `Token Google Calendar invalide ou expiré : ${errorMessage}. Relancez la procédure d'autorisation via /api/auth/google/authorize.`,
    });

    logger.error('[GoogleCalendar/Health] Token invalide', { error: errorMessage });

    return { status: 'invalid', checkedAt: now, errorMessage };
  }
}
