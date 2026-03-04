/**
 * Queries — Service Google Calendar
 * Derviche Diffusion
 *
 * Trois opérations : createEvent, updateEvent, deleteEvent.
 * Toutes sont non-bloquantes : les erreurs sont loggées et retournées
 * sans jamais faire échouer la réservation.
 *
 * Utilisé uniquement côté serveur (Route Handlers).
 */

import { google } from 'googleapis';
import { getGoogleAuthClient } from './auth';
import { logger } from '@/lib/logger';
import type { CalendarEventData, CalendarResult } from './types';

// Durée par défaut si shows.duration_minutes est null
const DEFAULT_DURATION_MINUTES = 120;

// ============================================
// HELPERS
// ============================================

/**
 * Construit une date ISO 8601 complète à partir d'une date "YYYY-MM-DD"
 * et d'une heure "HH:MM" ou "HH:MM:SS", en heure de Paris.
 *
 * Google Calendar API attend le format : "2025-07-10T20:00:00+02:00"
 * On utilise Europe/Paris — l'offset est calculé dynamiquement pour
 * gérer correctement l'heure d'été / heure d'hiver.
 */
function buildDateTimeWithParisTz(date: string, time: string): string {
  // Normalise l'heure en "HH:MM:SS"
  const normalizedTime = time.length === 5 ? `${time}:00` : time;

  // Calcule l'offset UTC de Paris pour cette date précise
  const testDate  = new Date(`${date}T${normalizedTime}Z`);
  const parisStr  = testDate.toLocaleString('en-CA', { timeZone: 'Europe/Paris', hour12: false });
  const utcStr    = testDate.toLocaleString('en-CA', { timeZone: 'UTC',           hour12: false });

  const parisMs = new Date(parisStr).getTime();
  const utcMs   = new Date(utcStr).getTime();
  const offsetMs = parisMs - utcMs;

  const offsetHours   = Math.floor(Math.abs(offsetMs) / 3_600_000);
  const offsetMinutes = Math.floor((Math.abs(offsetMs) % 3_600_000) / 60_000);
  const sign          = offsetMs >= 0 ? '+' : '-';
  const offsetString  = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  return `${date}T${normalizedTime}${offsetString}`;
}

/**
 * Construit le corps de l'événement Google Calendar.
 */
function buildEventBody(data: CalendarEventData) {
  const startDateTime = buildDateTimeWithParisTz(data.slotDate, data.slotTime);
  const duration      = data.durationMinutes ?? DEFAULT_DURATION_MINUTES;

  // Calcule la fin en ajoutant la durée directement en temps LOCAL Paris.
  // NE PAS utiliser toISOString() (UTC) puis repasser buildDateTimeWithParisTz :
  // ça crée un double décalage qui inverse start/end ("time range is empty").
  const normalizedSlotTime = data.slotTime.length === 5 ? `${data.slotTime}:00` : data.slotTime;
  const [h, m, s]          = normalizedSlotTime.split(':').map(Number);
  const startTotalMin      = h * 60 + m + (s ?? 0) / 60;
  const endTotalMin        = startTotalMin + duration;

  const endH      = Math.floor(endTotalMin / 60) % 24;
  const endM      = Math.floor(endTotalMin % 60);
  const extraDays = Math.floor(endTotalMin / (60 * 24));

  // Gère le dépassement de minuit
  let endDateStr = data.slotDate;
  if (extraDays > 0) {
    const d = new Date(data.slotDate);
    d.setUTCDate(d.getUTCDate() + extraDays);
    endDateStr = d.toISOString().slice(0, 10);
  }

  const endTimeStr  = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
  const endDateTime = buildDateTimeWithParisTz(endDateStr, endTimeStr);

  const placesLabel = data.numPlaces > 1 ? `${data.numPlaces} places` : '1 place';
  const summary     = `${data.showTitle} – ${data.guestFullName} (${placesLabel})`;

  const descriptionLines = [
    'Réservation professionnelle — Derviche Diffusion',
    '',
    `Spectacle  : ${data.showTitle}`,
    `Réservé par : ${data.guestFullName}`,
    data.guestStructure ? `Structure  : ${data.guestStructure}` : null,
    `Email      : ${data.guestEmail}`,
    `Places     : ${placesLabel}`,
    `Réservation ID : ${data.reservationId}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const location = [data.venueName, data.venueCity].filter(Boolean).join(', ');

  return {
    summary,
    description: descriptionLines,
    location,
    start:     { dateTime: startDateTime, timeZone: 'Europe/Paris' },
    end:       { dateTime: endDateTime,   timeZone: 'Europe/Paris' },
    attendees: [{ email: data.guestEmail }],
    sendUpdates: data.sendEmailNotification ? 'all' : 'none',
  };
}

// ============================================
// OPÉRATIONS PRINCIPALES
// ============================================

/**
 * Crée un événement dans le calendrier DD.
 * Appelé après une confirmation de réservation.
 * Envoie toujours un email Google à l'invité (sendEmailNotification=true).
 */
export async function createCalendarEvent(
  data: CalendarEventData
): Promise<CalendarResult> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    return { success: false, error: 'GOOGLE_CALENDAR_ID manquant' };
  }

  try {
    const auth     = getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const body     = buildEventBody(data);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: body,
      sendUpdates: body.sendUpdates as 'all' | 'none',
    });

    const eventId = response.data.id;

    if (!eventId) {
      return { success: false, error: 'Événement créé sans ID retourné' };
    }

    logger.info('[GoogleCalendar] Événement créé', {
      eventId,
      reservationId: data.reservationId,
    });

    return { success: true, eventId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[GoogleCalendar] Erreur création événement', {
      reservationId: data.reservationId,
      error: message,
    });
    return { success: false, error: message };
  }
}

/**
 * Met à jour un événement existant dans le calendrier DD.
 * Appelé après une modification de créneau.
 * Envoie un email Google à l'invité selon la préférence sendEmailNotification.
 */
export async function updateCalendarEvent(
  eventId: string,
  data: CalendarEventData
): Promise<CalendarResult> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    return { success: false, error: 'GOOGLE_CALENDAR_ID manquant' };
  }

  try {
    const auth     = getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const body     = buildEventBody(data);

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: body,
      sendUpdates: body.sendUpdates as 'all' | 'none',
    });

    logger.info('[GoogleCalendar] Événement mis à jour', {
      eventId,
      reservationId: data.reservationId,
    });

    return { success: true, eventId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[GoogleCalendar] Erreur mise à jour événement', {
      eventId,
      reservationId: data.reservationId,
      error: message,
    });
    return { success: false, error: message };
  }
}

/**
 * Supprime un événement du calendrier DD.
 * Appelé après une annulation de réservation.
 * Envoie un email Google à l'invité selon la préférence sendEmailNotification.
 */
export async function deleteCalendarEvent(
  eventId: string,
  sendEmailNotification: boolean
): Promise<CalendarResult> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    return { success: false, error: 'GOOGLE_CALENDAR_ID manquant' };
  }

  try {
    const auth     = getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: sendEmailNotification ? 'all' : 'none',
    });

    logger.info('[GoogleCalendar] Événement supprimé', { eventId });

    return { success: true, eventId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[GoogleCalendar] Erreur suppression événement', {
      eventId,
      error: message,
    });
    return { success: false, error: message };
  }
}
