/**
 * Service App Settings - Gestion des paramètres globaux de l'application
 * Derviche Diffusion
 *
 * Stocke et récupère les paramètres globaux depuis Supabase (table app_settings)
 * Exemples: infos organisation, configuration emails, paramètres RGPD, etc.
 *
 * Permissions RLS:
 * - super-admin: lecture + écriture
 * - admin: lecture seule
 */

// Types
export type {
  OrganizationSettingKey,
  EmailSettingKey,
  NotificationSettingKey,
  GoogleCalendarSettingKey,
  ReminderSettingKey,
  RgpdSettingKey,
  ThemeSettingKey,
  SeasonSettingKey,
  HomepageSettingKey,
  LegalSettingKey,
  AppSettingKey,
  AppSettingRow,
  AppSettingResult,
  OrganizationSettings,
  EmailSettings,
  NotificationSettings,
  GoogleCalendarSettings,
  ReminderSettings,
  RgpdSettings,
  CustomThemeColors,
  ThemeSettings,
  SeasonSettings,
  HomepageHero,
  HomepageAvantageCard,
  HomepageAvantages,
  HomepageSpectacles,
  HomepageStatCard,
  HomepageImpact,
  HomepageContact,
  HomepageFooter,
  HomepageSettings,
  LegalSettings,
} from './types';

// Constants
export {
  ORGANIZATION_SETTING_KEYS,
  EMAIL_SETTING_KEYS,
  NOTIFICATION_SETTING_KEYS,
  GOOGLE_CALENDAR_SETTING_KEYS,
  REMINDER_SETTING_KEYS,
  RGPD_SETTING_KEYS,
  THEME_SETTING_KEYS,
  SEASON_SETTING_KEYS,
  HOMEPAGE_SETTING_KEYS,
  LEGAL_SETTING_KEYS,
  HOMEPAGE_DEFAULTS,
  SETTING_LABELS,
  SEASON_DEFAULTS,
  LEGAL_DEFAULTS,
} from './constants';

// Core CRUD
export {
  getAppSetting,
  setAppSetting,
  getAppSettings,
  setAppSettings,
  getAllAppSettings,
} from './core';

// Organization
export { getOrganizationSettings, setOrganizationSettings } from './organization';

// Email, Google Calendar, Notifications, Reminders
export {
  getEmailSettings,
  getGoogleCalendarSettings,
  getNotificationSettings,
  getReminderSettings,
} from './email';

// RGPD
export { getRgpdSettings } from './rgpd';

// Theme
export { getThemeSettings, setThemeSettings } from './theme';

// Season
export { getSeasonSettings, setSeasonSettings } from './season';

// Homepage
export { getHomepageSettings, setHomepageSettings } from './homepage';

// Legal
export { getLegalSettings, setLegalSettings } from './legal';
