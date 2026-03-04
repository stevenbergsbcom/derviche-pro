/**
 * Queries — Service Rappels Email
 * Derviche Diffusion
 *
 * Sélection des réservations éligibles à un rappel automatique.
 *
 * Critères d'éligibilité :
 *   1. statut = 'confirmed'
 *   2. représentation dans la fenêtre temporelle du type de rappel
 *   3. rappel du même type PAS déjà envoyé (anti-doublon via sent_notifications)
 *
 * Anti-doublon : on utilise la table sent_notifications existante.
 *   Son type CHECK inclut déjà 'reminder_7d', 'reminder_2d', 'reminder_12h'.
 *
 * Sécurité : utilise le service role Supabase (bypass RLS).
 *   Ce module ne doit être appelé que depuis les routes /api/cron/*.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { formatDateFr, formatTimeFr } from '@/lib/utils/format-date';
import type { EligibleReservation, ReminderConfig } from './types';

// ============================================
// CLIENT SERVICE ROLE (bypass RLS)
// ============================================

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('[reminders/queries] Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Génère le code de réservation affiché dans les emails.
 * Format : DD-XXXXXX (6 premiers caractères de l'UUID sans tirets, en majuscules)
 * Doit être identique au code généré côté client dans confirmation/page.tsx
 */
function buildReservationCode(reservationId: string): string {
  return `DD-${reservationId.replace(/-/g, '').substring(0, 6).toUpperCase()}`;
}

/**
 * Calcule les bornes de la fenêtre de détection en timestamps UTC.
 * @param windowStartMinutes - Début de la fenêtre (minutes à partir de maintenant)
 * @param windowEndMinutes - Fin de la fenêtre (minutes à partir de maintenant)
 */
function buildTimeWindow(
  windowStartMinutes: number,
  windowEndMinutes: number
): { windowStart: string; windowEnd: string } {
  const now = Date.now();
  const windowStart = new Date(now + windowStartMinutes * 60 * 1000).toISOString();
  const windowEnd   = new Date(now + windowEndMinutes   * 60 * 1000).toISOString();
  return { windowStart, windowEnd };
}

// ============================================
// TYPE INTERMÉDIAIRE (réponse brute Supabase)
// ============================================

interface RawReservationRow {
  id: string;
  num_places: number;
  user_id: string | null;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  slots: {
    date: string;
    time: string;
    shows: {
      title: string;
      slug: string;
      derviche_manager_id: string | null;
      companies: {
        name: string;
      } | null;
    } | null;
    venues: {
      name: string;
      city: string;
    } | null;
  } | null;
}

interface ManagerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
}

// ============================================
// REQUÊTE PRINCIPALE
// ============================================

/**
 * Récupère les réservations éligibles pour un type de rappel donné.
 *
 * @param config - Configuration du rappel (type, fenêtre temporelle)
 * @returns Liste des réservations éligibles, prêtes à l'envoi
 */
export async function getEligibleReservations(
  config: ReminderConfig
): Promise<EligibleReservation[]> {
  const supabase = getServiceClient();
  const { windowStart, windowEnd } = buildTimeWindow(
    config.windowStartMinutes,
    config.windowEndMinutes
  );

  logger.info(`[reminders/queries] Recherche réservations éligibles`, {
    type: config.type,
    windowStart,
    windowEnd,
  });

  // ── 1. Récupérer les IDs déjà traités (anti-doublon) ─────────────────────
  // On récupère d'abord les reservation_id déjà présents dans sent_notifications
  // pour ce type de rappel, afin de les exclure.
  const { data: alreadySentData, error: alreadySentError } = await supabase
    .from('sent_notifications')
    .select('reservation_id')
    .eq('type', config.type);

  if (alreadySentError) {
    logger.error('[reminders/queries] Erreur lecture sent_notifications', {
      error: alreadySentError.message,
      type: config.type,
    });
    return [];
  }

  const alreadySentIds = new Set(
    (alreadySentData ?? []).map((row) => row.reservation_id as string)
  );

  // ── 2. Récupérer les réservations éligibles ───────────────────────────────
  // On filtre par :
  //   - status = 'confirmed'
  //   - créneau dans la fenêtre temporelle (date + time combinés)
  //   - réservation NON déjà traitée (filtrée côté JS via alreadySentIds)
  //
  // Note : Supabase ne supporte pas nativement les filtres sur colonnes calculées
  // (date::timestamp + time::interval). On filtre d'abord par date approximative
  // côté SQL, puis on raffine côté JS pour la précision à la minute près.
  const startDate = windowStart.split('T')[0]; // 'YYYY-MM-DD'
  const endDate   = windowEnd.split('T')[0];   // 'YYYY-MM-DD'

  const { data: rawData, error: queryError } = await supabase
    .from('reservations')
    .select(`
      id,
      num_places,
      user_id,
      guest_first_name,
      guest_last_name,
      guest_email,
      profiles:user_id (
        email,
        first_name,
        last_name
      ),
      slots!inner (
        date,
        time,
        shows!inner (
          title,
          slug,
          derviche_manager_id,
          companies!inner (
            name
          )
        ),
        venues!inner (
          name,
          city
        )
      )
    `)
    .eq('status', 'confirmed')
    .gte('slots.date', startDate)
    .lte('slots.date', endDate);

  if (queryError) {
    logger.error('[reminders/queries] Erreur requête réservations', {
      error: queryError.message,
      type: config.type,
    });
    return [];
  }

  if (!rawData || rawData.length === 0) {
    logger.info('[reminders/queries] Aucune réservation candidate', { type: config.type });
    return [];
  }

  // ── 3. Filtrer précisément par fenêtre temporelle + anti-doublon ──────────
  const windowStartTs = new Date(windowStart).getTime();
  const windowEndTs   = new Date(windowEnd).getTime();

  const eligible: EligibleReservation[] = [];

  for (const row of rawData as unknown as RawReservationRow[]) {
    // Exclure si déjà traité
    if (alreadySentIds.has(row.id)) continue;

    const slot  = row.slots;
    const show  = slot?.shows;
    const venue = slot?.venues;

    if (!slot || !show || !venue) continue;

    // Calculer le timestamp exact du créneau (UTC)
    // Ex: date = "2026-03-10", time = "14:00:00" → "2026-03-10T14:00:00.000Z"
    // On traite slots.date + slots.time comme du temps local Paris
    // En attendant l'implémentation timezone complète, on compare en UTC naïf
    const slotTimestamp = new Date(`${slot.date}T${slot.time}`).getTime();
    if (isNaN(slotTimestamp)) continue;

    // Vérifier que le créneau est bien dans la fenêtre
    if (slotTimestamp < windowStartTs || slotTimestamp > windowEndTs) continue;

    // Résoudre email et nom complet (profil connecté ou invité)
    const email    = row.profiles?.email ?? row.guest_email;
    const firstName = row.profiles?.first_name ?? row.guest_first_name;
    const lastName  = row.profiles?.last_name  ?? row.guest_last_name;

    if (!email) {
      logger.warn('[reminders/queries] Réservation sans email, ignorée', { reservationId: row.id });
      continue;
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Professionnel';

    eligible.push({
      id:                   row.id,
      reservation_code:     buildReservationCode(row.id),
      num_places:           row.num_places,
      professional_email:   email,
      professional_full_name: fullName,
      show_title:           show.title,
      show_slug:            show.slug,
      company_name:         show.companies?.name ?? '',
      slot_date_formatted:  formatDateFr(slot.date),
      slot_time_formatted:  formatTimeFr(slot.time),
      slot_start_at:        `${slot.date}T${slot.time}`,
      venue_name:           venue.name,
      venue_city:           venue.city,
      // Manager résolu séparément (cf. enrichWithManagers)
      manager_name:   null,
      manager_email:  null,
      manager_phone:  null,
    });
  }

  // ── 4. Enrichir avec les données managers (batch) ─────────────────────────
  if (eligible.length > 0) {
    await enrichWithManagers(eligible, rawData as unknown as RawReservationRow[]);
  }

  logger.info('[reminders/queries] Réservations éligibles trouvées', {
    type: config.type,
    count: eligible.length,
  });

  return eligible;
}

// ============================================
// ENRICHISSEMENT MANAGERS (batch)
// ============================================

/**
 * Enrichit les réservations éligibles avec les données du manager Derviche.
 * Fait une seule requête batch pour éviter le N+1.
 * Crée son propre client service role pour éviter les conflits de types.
 */
async function enrichWithManagers(
  eligible: EligibleReservation[],
  rawData: RawReservationRow[]
): Promise<void> {
  const supabase = getServiceClient();
  // Collecter les IDs managers uniques (non-null)
  const managerIds = new Set<string>();
  for (const row of rawData) {
    const managerId = row.slots?.shows?.derviche_manager_id;
    if (managerId) managerIds.add(managerId);
  }

  if (managerIds.size === 0) return;

  // Batch query
  const { data: managers, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone')
    .in('id', Array.from(managerIds));

  if (error) {
    logger.warn('[reminders/queries] Erreur récupération managers (non-bloquant)', {
      error: error.message,
    });
    return;
  }

  // Index managers par ID
  const managerMap = new Map<string, ManagerRow>();
  for (const mgr of (managers ?? []) as ManagerRow[]) {
    managerMap.set(mgr.id, mgr);
  }

  // Construire un index reservationId → managerId depuis les rawData
  const reservationManagerMap = new Map<string, string>();
  for (const row of rawData) {
    const managerId = row.slots?.shows?.derviche_manager_id;
    if (managerId) reservationManagerMap.set(row.id, managerId);
  }

  // Injecter les données manager dans chaque réservation éligible
  for (const reservation of eligible) {
    const managerId = reservationManagerMap.get(reservation.id);
    if (!managerId) continue;

    const mgr = managerMap.get(managerId);
    if (!mgr) continue;

    reservation.manager_name  = [mgr.first_name, mgr.last_name].filter(Boolean).join(' ') || null;
    reservation.manager_email = mgr.email;
    reservation.manager_phone = mgr.phone;
  }
}

// ============================================
// LOGGING DES ENVOIS
// ============================================

/**
 * Enregistre un rappel envoyé dans sent_notifications.
 * Appelé après chaque envoi réussi pour garantir l'anti-doublon.
 *
 * @param reservationId - ID de la réservation
 * @param type - Type de rappel ('reminder_7d' | 'reminder_2d' | 'reminder_12h')
 * @param recipientEmail - Email du destinataire
 * @param emailProviderId - ID du message Resend (optionnel)
 */
export async function logReminderSent(
  reservationId: string,
  type: string,
  recipientEmail: string,
  emailProviderId?: string
): Promise<void> {
  try {
    const supabase = getServiceClient();

    const { error } = await supabase
      .from('sent_notifications')
      .insert({
        reservation_id:    reservationId,
        type,
        recipient_email:   recipientEmail,
        email_provider_id: emailProviderId ?? null,
      });

    if (error) {
      logger.error('[reminders/queries] Erreur log sent_notifications', {
        error: error.message,
        reservationId,
        type,
      });
    }
  } catch (err) {
    logger.error('[reminders/queries] Exception logReminderSent', { err, reservationId, type });
  }
}
