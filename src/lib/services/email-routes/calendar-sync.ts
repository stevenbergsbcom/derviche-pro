/**
 * Synchronisation Google Calendar — routes email
 * Derviche Diffusion
 *
 * Factorise le bloc répété dans 3 routes email (confirmation, cancellation,
 * modification) :
 *   - Lecture du setting `google_calendar_enabled`
 *   - Lecture optionnelle du setting `google_calendar_notify_on_{event}`
 *   - Appel de l'action Calendar correspondante
 *   - Pour createCalendarEvent : mise à jour du champ
 *     reservations.google_calendar_event_id
 *
 * Toutes les opérations sont non-bloquantes : les erreurs sont loggées mais
 * n'interrompent pas la route appelante.
 */

import { logger } from '@/lib/logger';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventData,
} from '@/lib/services/google-calendar';
import type { AdminClient } from './types';

const isBoolTrue = (v: unknown) => v === true || v === 'true';

async function isCalendarEnabled(adminClient: AdminClient): Promise<boolean> {
  const { data } = await adminClient
    .from('app_settings')
    .select('value')
    .eq('key', 'google_calendar_enabled')
    .maybeSingle();
  return isBoolTrue(data?.value);
}

async function isNotifyOnEventEnabled(
  adminClient: AdminClient,
  key:
    | 'google_calendar_notify_on_cancellation'
    | 'google_calendar_notify_on_modification',
): Promise<boolean> {
  const { data } = await adminClient
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return isBoolTrue(data?.value);
}

/**
 * Crée un événement Calendar pour une réservation (si Google Calendar activé).
 * En cas de succès, met à jour `reservations.google_calendar_event_id`.
 * Non-bloquant.
 */
export async function maybeCreateCalendarEvent(params: {
  adminClient: AdminClient;
  reservationId: string;
  eventData: CalendarEventData;
  routeLabel: string;
}): Promise<void> {
  const { adminClient, reservationId, eventData, routeLabel } = params;
  try {
    if (!(await isCalendarEnabled(adminClient))) return;
    const result = await createCalendarEvent(eventData);
    if (result.success) {
      await adminClient
        .from('reservations')
        .update({ google_calendar_event_id: result.eventId })
        .eq('id', reservationId);
    }
  } catch (calErr) {
    logger.error(`${routeLabel} Exception Calendar create (non-bloquant)`, {
      message: calErr instanceof Error ? calErr.message : String(calErr),
    });
  }
}

/**
 * Met à jour un événement Calendar lié à une réservation (si activé).
 * `sendEmailNotification` est injecté automatiquement depuis le setting
 * `google_calendar_notify_on_modification`.
 * Non-bloquant.
 */
export async function maybeUpdateCalendarEvent(params: {
  adminClient: AdminClient;
  googleCalendarEventId: string | null;
  /** Données de l'événement sans le flag `sendEmailNotification` (calculé ici). */
  eventData: Omit<CalendarEventData, 'sendEmailNotification'>;
  routeLabel: string;
}): Promise<void> {
  const { adminClient, googleCalendarEventId, eventData, routeLabel } = params;
  if (!googleCalendarEventId) return;

  try {
    if (!(await isCalendarEnabled(adminClient))) return;
    const notify = await isNotifyOnEventEnabled(
      adminClient,
      'google_calendar_notify_on_modification',
    );
    await updateCalendarEvent(googleCalendarEventId, {
      ...eventData,
      sendEmailNotification: notify,
    });
  } catch (calErr) {
    logger.error(`${routeLabel} Exception Calendar update (non-bloquant)`, { calErr });
  }
}

/**
 * Supprime un événement Calendar lié à une réservation annulée (si activé).
 * `sendEmailNotification` est injecté depuis le setting
 * `google_calendar_notify_on_cancellation`.
 * Non-bloquant.
 */
export async function maybeDeleteCalendarEvent(params: {
  adminClient: AdminClient;
  googleCalendarEventId: string | null;
  routeLabel: string;
}): Promise<void> {
  const { adminClient, googleCalendarEventId, routeLabel } = params;
  if (!googleCalendarEventId) return;

  try {
    if (!(await isCalendarEnabled(adminClient))) return;
    const notify = await isNotifyOnEventEnabled(
      adminClient,
      'google_calendar_notify_on_cancellation',
    );
    await deleteCalendarEvent(googleCalendarEventId, notify);
  } catch (calErr) {
    logger.error(`${routeLabel} Exception Calendar delete (non-bloquant)`, { calErr });
  }
}
