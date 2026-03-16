/**
 * Paramètres email, Google Calendar, notifications et rappels
 * Derviche Diffusion
 */

import type {
  AppSettingResult,
  EmailSettings,
  GoogleCalendarSettings,
  NotificationSettings,
  ReminderSettings,
} from './types';
import {
  EMAIL_SETTING_KEYS,
  GOOGLE_CALENDAR_SETTING_KEYS,
  NOTIFICATION_SETTING_KEYS,
  REMINDER_SETTING_KEYS,
} from './constants';
import { getAppSettings } from './core';
import { parseBool } from './helpers';

/**
 * Récupère les paramètres email
 */
export async function getEmailSettings(): Promise<AppSettingResult<EmailSettings>> {
  const result = await getAppSettings(EMAIL_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      email_from_name: (result.data?.email_from_name as string) || null,
      email_from_address: (result.data?.email_from_address as string) || null,
      email_reply_to: (result.data?.email_reply_to as string) || null,
      email_signature: (result.data?.email_signature as string) || null,
      email_footer_text: (result.data?.email_footer_text as string) || null,
      email_footer_show_email: parseBool(result.data?.email_footer_show_email, true),
      email_footer_show_phone: parseBool(result.data?.email_footer_show_phone, true),
      email_footer_show_address: parseBool(result.data?.email_footer_show_address, true),
      email_footer_show_website: parseBool(result.data?.email_footer_show_website, true),
    },
    error: null,
  };
}

/**
 * Récupère les paramètres Google Calendar
 */
export async function getGoogleCalendarSettings(): Promise<AppSettingResult<GoogleCalendarSettings>> {
  const result = await getAppSettings(GOOGLE_CALENDAR_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      google_calendar_enabled:               parseBool(result.data?.google_calendar_enabled,               false),
      google_calendar_notify_on_cancellation: parseBool(result.data?.google_calendar_notify_on_cancellation, false),
      google_calendar_notify_on_modification: parseBool(result.data?.google_calendar_notify_on_modification, false),
    },
    error: null,
  };
}

/**
 * Récupère les paramètres de notifications email admin
 */
export async function getNotificationSettings(): Promise<AppSettingResult<NotificationSettings>> {
  const result = await getAppSettings(NOTIFICATION_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      email_notification_new_reservation: parseBool(
        result.data?.email_notification_new_reservation,
        true
      ),
      email_notification_cancellation: parseBool(
        result.data?.email_notification_cancellation,
        true
      ),
      email_notification_modification: parseBool(
        result.data?.email_notification_modification,
        false
      ),
    },
    error: null,
  };
}

/**
 * Récupère les paramètres de rappels
 */
export async function getReminderSettings(): Promise<AppSettingResult<ReminderSettings>> {
  const result = await getAppSettings(REMINDER_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      reminder_enabled_7d:  parseBool(result.data?.reminder_enabled_7d,  true),
      reminder_enabled_2d:  parseBool(result.data?.reminder_enabled_2d,  true),
      reminder_enabled_12h: parseBool(result.data?.reminder_enabled_12h, true),
    },
    error: null,
  };
}
