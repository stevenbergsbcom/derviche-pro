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

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Json } from '@/types/supabase';

// ============================================
// TYPES
// ============================================

/** Clés de paramètres organisation */
export type OrganizationSettingKey =
  | 'organization_name'
  | 'organization_logo_url'
  | 'organization_contact_email'
  | 'organization_contact_phone'
  | 'organization_address'
  | 'organization_website';

/** Clés de paramètres email */
export type EmailSettingKey =
  | 'email_from_name'
  | 'email_from_address'
  | 'email_reply_to'
  | 'email_signature'
  | 'email_footer_text';
// Note: email_confirmation_subject et email_cancellation_subject
// ont été migrés vers la table email_templates (migration 051)

/** Clés de paramètres notifications email admin */
export type NotificationSettingKey =
  | 'email_notification_new_reservation'
  | 'email_notification_cancellation'
  | 'email_notification_modification';

/** Clés de paramètres Google Calendar */
export type GoogleCalendarSettingKey =
  | 'google_calendar_enabled'
  | 'google_calendar_notify_on_cancellation'
  | 'google_calendar_notify_on_modification';

/** Clés de paramètres rappels */
export type ReminderSettingKey =
  | 'reminder_enabled_7d'
  | 'reminder_enabled_2d'
  | 'reminder_enabled_12h';

/** Clés de paramètres RGPD */
export type RgpdSettingKey = 'rgpd_data_retention_months' | 'rgpd_inactive_account_months';

/** Clés de paramètres thème et apparence */
export type ThemeSettingKey =
  | 'theme_preset'
  | 'logo_white_url'
  | 'logo_dark_url'
  | 'custom_theme_colors';

/** Clés de paramètres saison (dashboard) */
export type SeasonSettingKey = 'season_start' | 'season_end';

/** Toutes les clés de paramètres */
export type AppSettingKey =
  | OrganizationSettingKey
  | EmailSettingKey
  | NotificationSettingKey
  | GoogleCalendarSettingKey
  | ReminderSettingKey
  | RgpdSettingKey
  | ThemeSettingKey
  | string;

/** Ligne de paramètre depuis la base */
export interface AppSettingRow {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

/** Résultat d'une opération sur les paramètres */
export interface AppSettingResult<T> {
  data: T | null;
  error: string | null;
}

/** Paramètres d'organisation groupés */
export interface OrganizationSettings {
  organization_name: string | null;
  organization_logo_url: string | null;
  organization_contact_email: string | null;
  organization_contact_phone: string | null;
  organization_address: string | null;
  organization_website: string | null;
}

/** Paramètres email groupés */
export interface EmailSettings {
  email_from_name: string | null;
  email_from_address: string | null;
  email_reply_to: string | null;
  email_signature: string | null;
  email_footer_text: string | null;
}

/** Paramètres notifications email admin groupés */
export interface NotificationSettings {
  email_notification_new_reservation: boolean;
  email_notification_cancellation: boolean;
  email_notification_modification: boolean;
}

/** Paramètres Google Calendar groupés */
export interface GoogleCalendarSettings {
  /** Active ou désactive l'intégration Google Calendar */
  google_calendar_enabled: boolean;
  /** Envoyer un email Google lors de l'annulation (la création envoie toujours un email) */
  google_calendar_notify_on_cancellation: boolean;
  /** Envoyer un email Google lors de la modification */
  google_calendar_notify_on_modification: boolean;
}

/** Paramètres rappels groupés */
export interface ReminderSettings {
  reminder_enabled_7d: boolean;
  reminder_enabled_2d: boolean;
  reminder_enabled_12h: boolean;
}

/** Paramètres RGPD groupés */
export interface RgpdSettings {
  rgpd_data_retention_months: number;
  rgpd_inactive_account_months: number;
}

/** Couleurs personnalisées du thème custom (hex) */
export interface CustomThemeColors {
  primary: string;
  accent: string;
  sidebar: string;
}

/** Paramètres thème et apparence groupés */
export interface ThemeSettings {
  theme_preset: string;
  logo_white_url: string | null;
  logo_dark_url: string | null;
  custom_theme_colors: CustomThemeColors | null;
}

/**
 * Paramètres de saison pour le dashboard
 * Format MM-DD (ex: "09-01" = 1er septembre)
 */
export interface SeasonSettings {
  /** Début de saison, format MM-DD */
  season_start: string;
  /** Fin de saison, format MM-DD */
  season_end: string;
}

// ============================================
// CONSTANTES
// ============================================

/** Clés des paramètres organisation */
export const ORGANIZATION_SETTING_KEYS: OrganizationSettingKey[] = [
  'organization_name',
  'organization_logo_url',
  'organization_contact_email',
  'organization_contact_phone',
  'organization_address',
  'organization_website',
];

/** Clés des paramètres email */
export const EMAIL_SETTING_KEYS: EmailSettingKey[] = [
  'email_from_name',
  'email_from_address',
  'email_reply_to',
  'email_signature',
  'email_footer_text',
];

/** Clés des paramètres notifications email admin */
export const NOTIFICATION_SETTING_KEYS: NotificationSettingKey[] = [
  'email_notification_new_reservation',
  'email_notification_cancellation',
  'email_notification_modification',
];

/** Clés des paramètres Google Calendar */
export const GOOGLE_CALENDAR_SETTING_KEYS: GoogleCalendarSettingKey[] = [
  'google_calendar_enabled',
  'google_calendar_notify_on_cancellation',
  'google_calendar_notify_on_modification',
];

/** Clés des paramètres rappels */
export const REMINDER_SETTING_KEYS: ReminderSettingKey[] = [
  'reminder_enabled_7d',
  'reminder_enabled_2d',
  'reminder_enabled_12h',
];

/** Clés des paramètres RGPD */
export const RGPD_SETTING_KEYS: RgpdSettingKey[] = [
  'rgpd_data_retention_months',
  'rgpd_inactive_account_months',
];

/** Clés des paramètres thème et apparence */
export const THEME_SETTING_KEYS: ThemeSettingKey[] = [
  'theme_preset',
  'logo_white_url',
  'logo_dark_url',
  'custom_theme_colors',
];

/** Clés des paramètres saison */
export const SEASON_SETTING_KEYS: SeasonSettingKey[] = [
  'season_start',
  'season_end',
];

/** Labels pour l'affichage des paramètres */
export const SETTING_LABELS: Record<string, string> = {
  organization_name: 'Nom de l\'organisation',
  organization_logo_url: 'URL du logo',
  organization_contact_email: 'Email de contact',
  organization_contact_phone: 'Téléphone de contact',
  organization_address: 'Adresse postale',
  organization_website: 'Site web',
  email_from_name: 'Nom de l\'expéditeur',
  email_from_address: 'Adresse email de l\'expéditeur',
  email_reply_to: 'Adresse de réponse',
  email_signature: 'Signature',
  email_footer_text: 'Pied de page',
  email_catalogue_url: 'URL du catalogue (emails)',

  google_calendar_enabled: 'Activer Google Calendar',
  google_calendar_notify_on_cancellation: 'Email Google à l’annulation',
  google_calendar_notify_on_modification: 'Email Google à la modification',
  reminder_enabled_7d: 'Rappel J-7',
  reminder_enabled_2d: 'Rappel J-2',
  reminder_enabled_12h: 'Rappel H-12',
  rgpd_data_retention_months: 'Durée de conservation des données (mois)',
  rgpd_inactive_account_months: 'Durée avant suppression compte inactif (mois)',
  theme_preset: 'Thème de couleurs',
  logo_white_url: 'Logo version blanche',
  logo_dark_url: 'Logo version sombre',
};

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupère un paramètre global
 */
export async function getAppSetting<T>(key: AppSettingKey): Promise<AppSettingResult<T>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      // PGRST116 = not found
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      logger.error('Erreur récupération paramètre', { key, error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data.value as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAppSetting', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour un paramètre global (super-admin uniquement)
 */
export async function setAppSetting<T>(key: AppSettingKey, value: T): Promise<AppSettingResult<T>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .update({ value: value as Json })
      .eq('key', key)
      .select('value')
      .single();

    if (error) {
      logger.error('Erreur mise à jour paramètre', { key, error: error.message });
      return { data: null, error: error.message };
    }

    logger.info('Paramètre mis à jour', { key });
    return { data: data.value as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setAppSetting', { key, message });
    return { data: null, error: message };
  }
}

/**
 * Récupère plusieurs paramètres en une seule requête
 */
export async function getAppSettings(
  keys: AppSettingKey[]
): Promise<AppSettingResult<Record<string, unknown>>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      logger.error('Erreur récupération paramètres', { keys, error: error.message });
      return { data: null, error: error.message };
    }

    // Transformer en objet clé-valeur
    const settings: Record<string, unknown> = {};
    (data || []).forEach((row: { key: string; value: unknown }) => {
      settings[row.key] = row.value;
    });

    return { data: settings, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAppSettings', { keys, message });
    return { data: null, error: message };
  }
}

/**
 * Met à jour plusieurs paramètres en une seule transaction
 */
export async function setAppSettings(
  settings: Record<string, unknown>
): Promise<AppSettingResult<Record<string, unknown>>> {
  try {
    const supabase = createClient();
    const keys = Object.keys(settings);
    const errors: string[] = [];

    // Mettre à jour chaque paramètre
    for (const key of keys) {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: settings[key] as Json })
        .eq('key', key);

      if (error) {
        errors.push(`${key}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      logger.error('Erreurs mise à jour paramètres', { errors });
      return { data: null, error: errors.join(', ') };
    }

    logger.info('Paramètres mis à jour', { keys });
    return { data: settings, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setAppSettings', { message });
    return { data: null, error: message };
  }
}

/**
 * Récupère tous les paramètres
 */
export async function getAllAppSettings(): Promise<AppSettingResult<AppSettingRow[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('id, key, value, description, updated_at')
      .order('key');

    if (error) {
      logger.error('Erreur récupération tous les paramètres', { error: error.message });
      return { data: null, error: error.message };
    }

    return { data: data as AppSettingRow[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception getAllAppSettings', { message });
    return { data: null, error: message };
  }
}

// ============================================
// FONCTIONS GROUPÉES PAR CATÉGORIE
// ============================================

/**
 * Récupère les paramètres d'organisation
 */
export async function getOrganizationSettings(): Promise<AppSettingResult<OrganizationSettings>> {
  const result = await getAppSettings(ORGANIZATION_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      organization_name: (result.data?.organization_name as string) || null,
      organization_logo_url: (result.data?.organization_logo_url as string) || null,
      organization_contact_email: (result.data?.organization_contact_email as string) || null,
      organization_contact_phone: (result.data?.organization_contact_phone as string) || null,
      organization_address: (result.data?.organization_address as string) || null,
      organization_website: (result.data?.organization_website as string) || null,
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres d'organisation
 */
export async function setOrganizationSettings(
  settings: Partial<OrganizationSettings>
): Promise<AppSettingResult<OrganizationSettings>> {
  const result = await setAppSettings(settings);

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Récupérer les paramètres mis à jour
  return getOrganizationSettings();
}

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

  const parseBool = (val: unknown, fallback: boolean): boolean => {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return fallback;
  };

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

  // Convertit proprement les valeurs JSONB (boolean ou string 'true'/'false')
  const parseBool = (val: unknown, fallback: boolean): boolean => {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return fallback;
  };

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

  // parseBool : gère les valeurs JSONB boolean ET les chaînes 'true'/'false'
  const parseBool = (val: unknown, fallback: boolean): boolean => {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return fallback;
  };

  return {
    data: {
      reminder_enabled_7d:  parseBool(result.data?.reminder_enabled_7d,  true),
      reminder_enabled_2d:  parseBool(result.data?.reminder_enabled_2d,  true),
      reminder_enabled_12h: parseBool(result.data?.reminder_enabled_12h, true),
    },
    error: null,
  };
}

/**
 * Récupère les paramètres RGPD
 */
export async function getRgpdSettings(): Promise<AppSettingResult<RgpdSettings>> {
  const result = await getAppSettings(RGPD_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      rgpd_data_retention_months: (result.data?.rgpd_data_retention_months as number) ?? 36,
      rgpd_inactive_account_months: (result.data?.rgpd_inactive_account_months as number) ?? 24,
    },
    error: null,
  };
}

/**
 * Récupère les paramètres de thème
 * Note: Les chaînes vides sont converties en null pour les URLs
 */
export async function getThemeSettings(): Promise<AppSettingResult<ThemeSettings>> {
  const result = await getAppSettings(THEME_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Convertir les chaînes vides en null pour les URLs
  const logoWhite = result.data?.logo_white_url as string | undefined;
  const logoDark = result.data?.logo_dark_url as string | undefined;

  // Récupérer les couleurs custom (objet JSON ou null)
  const rawCustomColors = result.data?.custom_theme_colors;
  let customColors: CustomThemeColors | null = null;
  if (rawCustomColors && typeof rawCustomColors === 'object' && !Array.isArray(rawCustomColors)) {
    const obj = rawCustomColors as Record<string, unknown>;
    const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
    const p = String(obj.primary);
    const a = String(obj.accent);
    const s = String(obj.sidebar);
    if (HEX_REGEX.test(p) && HEX_REGEX.test(a) && HEX_REGEX.test(s)) {
      customColors = { primary: p, accent: a, sidebar: s };
    }
  }

  return {
    data: {
      theme_preset: (result.data?.theme_preset as string) ?? 'classic',
      logo_white_url: logoWhite && logoWhite.trim() !== '' ? logoWhite : null,
      logo_dark_url: logoDark && logoDark.trim() !== '' ? logoDark : null,
      custom_theme_colors: customColors,
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres de thème
 * Note: Les URLs null sont converties en chaînes vides pour respecter la contrainte NOT NULL
 */
export async function setThemeSettings(
  settings: Partial<ThemeSettings>
): Promise<AppSettingResult<ThemeSettings>> {
  // Convertir les null en chaînes vides pour les URLs (contrainte NOT NULL sur value)
  // et les objets en JSON pour custom_theme_colors
  const sanitizedSettings: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    if ((key === 'logo_white_url' || key === 'logo_dark_url') && value === null) {
      sanitizedSettings[key] = '';
    } else {
      sanitizedSettings[key] = value;
    }
  }

  const result = await setAppSettings(sanitizedSettings);

  if (result.error) {
    return { data: null, error: result.error };
  }

  return getThemeSettings();
}

// ============================================
// SAISON
// ============================================

/** Valeurs par défaut de la saison */
const SEASON_DEFAULTS: SeasonSettings = {
  season_start: '09-01',
  season_end: '06-30',
};

/**
 * Récupère les paramètres de saison
 */
export async function getSeasonSettings(): Promise<AppSettingResult<SeasonSettings>> {
  const result = await getAppSettings(SEASON_SETTING_KEYS);

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Strip des guillemets JSONB si nécessaire
  const strip = (val: unknown, fallback: string): string => {
    if (!val) return fallback;
    return String(val).replace(/^"|"$/g, '') || fallback;
  };

  return {
    data: {
      season_start: strip(result.data?.season_start, SEASON_DEFAULTS.season_start),
      season_end: strip(result.data?.season_end, SEASON_DEFAULTS.season_end),
    },
    error: null,
  };
}

/**
 * Met à jour les paramètres de saison.
 * Utilise upsert pour garantir la création si les clés n'existent pas.
 */
export async function setSeasonSettings(
  settings: Partial<SeasonSettings>
): Promise<AppSettingResult<SeasonSettings>> {
  try {
    const supabase = createClient();
    const entries = Object.entries(settings) as [string, string][];
    const errors: string[] = [];

    for (const [key, value] of entries) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) {
        logger.error('Erreur upsert season setting', { key, error: error.message });
        errors.push(`${key}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return { data: null, error: errors.join(', ') };
    }

    logger.info('Paramètres saison mis à jour', { keys: Object.keys(settings) });
    return getSeasonSettings();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Exception setSeasonSettings', { message });
    return { data: null, error: message };
  }
}
