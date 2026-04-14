/**
 * Types et interfaces pour les paramètres de l'application
 * Derviche Diffusion
 */

import type { Json } from '@/types/supabase';

// Re-export Json for use by other modules in this package
export type { Json };

// ============================================
// TYPES
// ============================================

/** Clés de paramètres organisation */
export type OrganizationSettingKey =
  | 'organization_name'
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
  | 'email_footer_text'
  | 'email_footer_show_email'
  | 'email_footer_show_phone'
  | 'email_footer_show_address'
  | 'email_footer_show_website';
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
  | 'reminder_enabled_4h';

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

/** Clés de paramètres page d'accueil */
export type HomepageSettingKey =
  | 'homepage_hero'
  | 'homepage_avantages'
  | 'homepage_spectacles'
  | 'homepage_impact'
  | 'homepage_contact'
  | 'homepage_footer';

/** Clés de paramètres pages légales */
export type LegalSettingKey = 'legal_mentions' | 'legal_privacy' | 'legal_cgu';

/** Toutes les clés de paramètres */
export type AppSettingKey =
  | OrganizationSettingKey
  | EmailSettingKey
  | NotificationSettingKey
  | GoogleCalendarSettingKey
  | ReminderSettingKey
  | RgpdSettingKey
  | ThemeSettingKey
  | HomepageSettingKey
  | LegalSettingKey
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
  email_footer_show_email: boolean;
  email_footer_show_phone: boolean;
  email_footer_show_address: boolean;
  email_footer_show_website: boolean;
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
  reminder_enabled_4h: boolean;
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
// TYPES — PAGE D'ACCUEIL
// ============================================

/** Structure Hero de la page d'accueil */
export interface HomepageHero {
  title: string;
  description: string;
  secondary_text: string;
  cta_primary_text: string;
  cta_primary_url: string;
  cta_secondary_text: string;
  cta_secondary_url: string;
}

/** Carte avantage (icône + titre + description) */
export interface HomepageAvantageCard {
  /** Nom de l'icône Lucide : 'search' | 'calendar' | 'message-circle' etc. */
  icon: string;
  title: string;
  description: string;
}

/** Structure section Avantages */
export interface HomepageAvantages {
  label: string;
  title: string;
  cards: HomepageAvantageCard[];
}

/** Structure section Spectacles */
export interface HomepageSpectacles {
  label: string;
  title: string;
  subtitle: string;
  cta_text: string;
}

/** Carte stat (chiffre + label) */
export interface HomepageStatCard {
  number: string;
  label: string;
}

/** Structure section Chiffres clés / Impact */
export interface HomepageImpact {
  /** Afficher ou masquer cette section sur la homepage */
  enabled: boolean;
  label: string;
  title: string;
  description: string;
  stats: HomepageStatCard[];
}

/** Structure section Contact (coordonnées depuis Organisation) */
export interface HomepageContact {
  label: string;
  title: string;
  description: string;
}

/** Structure Footer */
export interface HomepageFooter {
  description: string;
  facebook_url: string;
  instagram_url: string;
  /** Texte du copyright — {year} est remplacé par l'année courante au rendu */
  copyright_text: string;
}

/** Tous les paramètres homepage groupés */
export interface HomepageSettings {
  homepage_hero: HomepageHero;
  homepage_avantages: HomepageAvantages;
  homepage_spectacles: HomepageSpectacles;
  homepage_impact: HomepageImpact;
  homepage_contact: HomepageContact;
  homepage_footer: HomepageFooter;
}

/** Paramètres des pages légales (texte brut, éditable depuis admin) */
export interface LegalSettings {
  legal_mentions: string;
  legal_privacy: string;
  legal_cgu: string;
}
