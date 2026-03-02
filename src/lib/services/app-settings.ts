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
  | 'organization_address';

/** Clés de paramètres email */
export type EmailSettingKey = 'email_from_name' | 'email_from_address';

/** Clés de paramètres notifications email admin */
export type NotificationSettingKey =
  | 'email_notification_new_reservation'
  | 'email_notification_cancellation'
  | 'email_notification_modification';

/** Clés de paramètres rappels */
export type ReminderSettingKey =
  | 'reminder_enabled_7d'
  | 'reminder_enabled_2d'
  | 'reminder_enabled_12h';

/** Clés de paramètres RGPD */
export type RgpdSettingKey = 'rgpd_data_retention_months' | 'rgpd_inactive_account_months';

/** Clés de paramètres thème et apparence */
export type ThemeSettingKey = 'theme_preset' | 'logo_white_url' | 'logo_dark_url';

/** Toutes les clés de paramètres */
export type AppSettingKey =
  | OrganizationSettingKey
  | EmailSettingKey
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
}

/** Paramètres email groupés */
export interface EmailSettings {
  email_from_name: string | null;
  email_from_address: string | null;
}

/** Paramètres notifications email admin groupés */
export interface NotificationSettings {
  email_notification_new_reservation: boolean;
  email_notification_cancellation: boolean;
  email_notification_modification: boolean;
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

/** Paramètres thème et apparence groupés */
export interface ThemeSettings {
  theme_preset: string;
  logo_white_url: string | null;
  logo_dark_url: string | null;
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
];

/** Clés des paramètres email */
export const EMAIL_SETTING_KEYS: EmailSettingKey[] = ['email_from_name', 'email_from_address'];

/** Clés des paramètres notifications email admin */
export const NOTIFICATION_SETTING_KEYS: NotificationSettingKey[] = [
  'email_notification_new_reservation',
  'email_notification_cancellation',
  'email_notification_modification',
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
];

/** Labels pour l'affichage des paramètres */
export const SETTING_LABELS: Record<string, string> = {
  organization_name: 'Nom de l\'organisation',
  organization_logo_url: 'URL du logo',
  organization_contact_email: 'Email de contact',
  organization_contact_phone: 'Téléphone de contact',
  organization_address: 'Adresse',
  email_from_name: 'Nom de l\'expéditeur',
  email_from_address: 'Adresse email de l\'expéditeur',
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

  return {
    data: {
      reminder_enabled_7d: (result.data?.reminder_enabled_7d as boolean) ?? true,
      reminder_enabled_2d: (result.data?.reminder_enabled_2d as boolean) ?? true,
      reminder_enabled_12h: (result.data?.reminder_enabled_12h as boolean) ?? true,
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

  return {
    data: {
      theme_preset: (result.data?.theme_preset as string) ?? 'classic',
      logo_white_url: logoWhite && logoWhite.trim() !== '' ? logoWhite : null,
      logo_dark_url: logoDark && logoDark.trim() !== '' ? logoDark : null,
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
