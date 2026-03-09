/**
 * Queries — Service Logs
 * Derviche Diffusion
 *
 * Insertion dans app_logs via le client admin Supabase (service_role).
 *
 * IMPORTANT : toutes les fonctions sont non-bloquantes.
 * Elles capturent leur propre exception sans la propager.
 * Une erreur d'insertion de log ne doit JAMAIS faire échouer
 * l'opération métier appelante.
 *
 * Usage côté serveur uniquement (Route Handlers, services).
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';
import type { InsertLogParams, EmailLogDetails, CalendarLogDetails } from './types';

// ── Fonction bas niveau ───────────────────────────────────────────────────────

/**
 * Insère une entrée dans app_logs.
 * Fire & forget : les erreurs sont loggées en console uniquement.
 */
async function insertLog(params: InsertLogParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('app_logs').insert({
      category:       params.category,
      level:          params.level,
      action:         params.action,
      status:         params.status,
      actor_id:       params.actor_id       ?? null,
      actor_role:     params.actor_role     ?? null,
      reservation_id: params.reservation_id ?? null,
      details:        params.details        ?? {},
    });

    if (error) {
      // On log l'erreur en console seulement — pas de throw
      logger.warn('[logs] Erreur insertion app_logs', {
        action: params.action,
        error: error.message,
      });
    }
  } catch (err) {
    // Capture complète : l'opération métier ne doit jamais être affectée
    logger.warn('[logs] Exception insertLog', {
      action: params.action,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Fonctions publiques ───────────────────────────────────────────────────────

/**
 * Loguer un envoi d'email (succès ou erreur).
 *
 * @param action   - Type d'email envoyé (ex: 'send_confirmation')
 * @param success  - true si Resend a accepté l'email
 * @param details  - { to, resend_id, template_key, error_message }
 * @param reservationId - UUID réservation concernée (optionnel)
 * @param actorId  - UUID de l'utilisateur déclencheur (null = cron)
 * @param actorRole - Rôle de l'utilisateur déclencheur (null = cron)
 */
export async function logEmail(
  action: string,
  success: boolean,
  details: EmailLogDetails,
  reservationId?: string | null,
  actorId?: string | null,
  actorRole?: string | null,
): Promise<void> {
  await insertLog({
    category:       'email',
    level:          success ? 'info' : 'error',
    action,
    status:         success ? 'success' : 'error',
    actor_id:       actorId,
    actor_role:     actorRole,
    reservation_id: reservationId,
    details:        details as Record<string, unknown>,
  });
}

/**
 * Loguer une opération Google Calendar (succès ou erreur).
 *
 * @param action   - Opération effectuée (ex: 'calendar_create')
 * @param success  - true si Google Calendar a accepté la requête
 * @param details  - { event_id, reservation_id, error_message }
 */
export async function logCalendar(
  action: string,
  success: boolean,
  details: CalendarLogDetails,
): Promise<void> {
  await insertLog({
    category:       'calendar',
    level:          success ? 'info' : 'error',
    action,
    status:         success ? 'success' : 'error',
    reservation_id: details.reservation_id,
    details:        details as Record<string, unknown>,
  });
}

/**
 * Loguer un événement système générique.
 *
 * @param action  - Nom de l'action (libre)
 * @param level   - 'info' | 'warning' | 'error'
 * @param details - Contexte libre
 */
export async function logSystem(
  action: string,
  level: 'info' | 'warning' | 'error',
  details?: Record<string, unknown>,
): Promise<void> {
  await insertLog({
    category: 'system',
    level,
    action,
    status: level === 'error' ? 'error' : 'success',
    details,
  });
}
