/**
 * Process — Service Rappels Email
 * Derviche Diffusion
 *
 * Orchestrateur d'un batch de rappels pour un type donné.
 * Appelé par les routes cron (/api/cron/reminders/daily et /hourly).
 *
 * Flux :
 *   1. Lire le toggle dans app_settings (via service role — bypass RLS)
 *   2. Récupérer les réservations éligibles (queries.ts)
 *   3. Envoyer chaque rappel (send.ts) — séquentiel avec délai
 *   4. Retourner un résumé (ProcessRemindersResult)
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { getEligibleReservations } from './queries';
import { sendReminderEmail } from './send';
import type {
  ReminderConfig,
  ReminderEmailData,
  ReminderResult,
  ProcessRemindersResult,
} from './types';

// ============================================
// HELPERS
// ============================================

/** Délai entre chaque envoi pour éviter le rate-limiting Resend (2 req/s en free) */
const SEND_DELAY_MS = 600;

/**
 * Lit un toggle dans app_settings via le service role Supabase (bypass RLS).
 *
 * Pourquoi ne pas utiliser getAppSetting() ?
 * → getAppSetting() utilise createClient() depuis @/lib/supabase/client (clé anon).
 * → En contexte cron (sans session utilisateur), la RLS sur app_settings bloque la lecture.
 * → Le service role bypasse la RLS et peut toujours lire app_settings.
 */
async function readToggleServerSide(toggleKey: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    logger.warn('[reminders/process] Variables Supabase manquantes — toggle activé par défaut', {
      toggleKey,
    });
    return true;
  }

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', toggleKey)
      .single();

    if (error || data === null) return true; // Défaut : activé

    // Gérer boolean ET chaînes JSONB ('true' / 'false')
    const val = data.value;
    if (typeof val === 'boolean') return val;
    if (val === 'false') return false;
    return true;
  } catch {
    logger.warn('[reminders/process] Erreur lecture toggle — activé par défaut', { toggleKey });
    return true;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Convertit une EligibleReservation en ReminderEmailData */
function toEmailData(
  reservation: Awaited<ReturnType<typeof getEligibleReservations>>[number]
): ReminderEmailData {
  return {
    to:                reservation.professional_email,
    guestFullName:     reservation.professional_full_name,
    reservationCode:   reservation.reservation_code,
    reservationId:     reservation.id,
    showTitle:         reservation.show_title,
    showSlug:          reservation.show_slug,
    companyName:       reservation.company_name,
    slotDateFormatted: reservation.slot_date_formatted,
    slotTimeFormatted: reservation.slot_time_formatted,
    venueName:         reservation.venue_name,
    venueCity:         reservation.venue_city,
    venueAddress:      reservation.venue_address,
    venuePostalCode:   reservation.venue_postal_code,
    numPlaces:         reservation.num_places,
    dervisheSiteUrl:   reservation.derviche_site_url,
    managerName:       reservation.manager_name,
    managerEmail:      reservation.manager_email,
    managerPhone:      reservation.manager_phone,
  };
}

// ============================================
// ORCHESTRATEUR PRINCIPAL
// ============================================

/**
 * Traite un batch de rappels pour un type donné.
 *
 * @param config - Configuration du rappel (type, toggleKey, fenêtre temporelle)
 * @returns Résumé du traitement (sent, failed, eligible, results)
 */
export async function processReminders(
  config: ReminderConfig
): Promise<ProcessRemindersResult> {
  const baseResult: ProcessRemindersResult = {
    type:     config.type,
    enabled:  false,
    eligible: 0,
    sent:     0,
    failed:   0,
    results:  [],
  };

  // ── 1. Vérifier le toggle (service role pour bypasser RLS) ────────────────
  const isEnabled = await readToggleServerSide(config.toggleKey);

  if (!isEnabled) {
    logger.info('[reminders/process] Toggle désactivé — rappels ignorés', {
      type:      config.type,
      toggleKey: config.toggleKey,
    });
    return { ...baseResult, enabled: false };
  }

  // ── 2. Récupérer les réservations éligibles ───────────────────────────────
  logger.info('[reminders/process] Démarrage batch', { type: config.type });

  const reservations = await getEligibleReservations(config);

  if (reservations.length === 0) {
    logger.info('[reminders/process] Aucune réservation éligible', { type: config.type });
    return { ...baseResult, enabled: true, eligible: 0 };
  }

  logger.info(`[reminders/process] ${reservations.length} réservation(s) à traiter`, {
    type: config.type,
  });

  // ── 3. Envoyer les rappels séquentiellement ───────────────────────────────
  const results: ReminderResult[] = [];
  let sent   = 0;
  let failed = 0;

  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const emailData   = toEmailData(reservation);
    const result      = await sendReminderEmail(config.type, emailData);

    results.push(result);

    if (result.success) {
      sent++;
    } else {
      failed++;
      logger.warn('[reminders/process] Échec envoi réservation', {
        type:          config.type,
        reservationId: reservation.id,
        error:         result.error,
      });
    }

    // Délai anti rate-limit entre chaque envoi (sauf après le dernier)
    if (i < reservations.length - 1) {
      await sleep(SEND_DELAY_MS);
    }
  }

  // ── 4. Résumé ─────────────────────────────────────────────────────────────
  logger.info('[reminders/process] Batch terminé', {
    type:     config.type,
    eligible: reservations.length,
    sent,
    failed,
  });

  return {
    type:     config.type,
    enabled:  true,
    eligible: reservations.length,
    sent,
    failed,
    results,
  };
}

/**
 * Traite plusieurs types de rappels en séquence.
 * Utilisé par le cron daily pour J-7 + J-2 en un seul appel.
 */
export async function processMultipleReminders(
  configs: ReminderConfig[]
): Promise<ProcessRemindersResult[]> {
  const results: ProcessRemindersResult[] = [];
  for (const config of configs) {
    results.push(await processReminders(config));
  }
  return results;
}
