/**
 * Types — Service Rappels Email
 * Derviche Diffusion
 *
 * Définit les types utilisés par les cron jobs et le service d'envoi
 * de rappels automatiques (J-7, J-2, H-4).
 *
 * Architecture :
 *   - ReminderType     : les 3 types de rappels supportés
 *   - ReminderConfig   : configuration d'un type de rappel (toggle, fenêtre temporelle)
 *   - EligibleReservation : données d'une réservation récupérée depuis la DB
 *   - ReminderEmailData   : données passées au builder HTML
 *   - ReminderResult      : résultat d'un envoi unitaire
 *   - ProcessRemindersResult : résultat d'un batch de rappels
 */

// ============================================
// TYPES DE RAPPELS
// ============================================

/**
 * Les 3 types de rappels supportés.
 * Correspond aux template_key dans email_templates
 * et aux type CHECK dans sent_notifications.
 */
export type ReminderType = 'reminder_7d' | 'reminder_2d' | 'reminder_4h';

/**
 * Clé de toggle dans app_settings pour chaque type de rappel.
 */
export type ReminderToggleKey =
  | 'reminder_enabled_7d'
  | 'reminder_enabled_2d'
  | 'reminder_enabled_4h';

// ============================================
// CONFIGURATION DES RAPPELS
// ============================================

/**
 * Configuration d'un type de rappel.
 * Utilisée pour définir la fenêtre temporelle de sélection
 * des réservations éligibles.
 */
export interface ReminderConfig {
  /** Identifiant du rappel (correspond au template_key et au type sent_notifications) */
  type: ReminderType;
  /** Clé du toggle dans app_settings */
  toggleKey: ReminderToggleKey;
  /** Libellé lisible pour les logs */
  label: string;
  /**
   * Début de la fenêtre de détection (en minutes à partir de maintenant).
   * Ex : 7 jours avant = 7 * 24 * 60 = 10080 minutes
   */
  windowStartMinutes: number;
  /**
   * Fin de la fenêtre de détection (en minutes à partir de maintenant).
   * Ex : J-7 → fenêtre [6j23h30, 7j0h30] = [10050, 10110] minutes
   * Ex : H-4 → fenêtre [3h30, 4h30] = [210, 270] minutes
   */
  windowEndMinutes: number;
}

/**
 * Configurations pour les rappels journaliers (J-7 et J-2).
 * Fenêtre de ±30 min autour de l'heure cible (9h Paris).
 * Le cron daily tourne à 7h UTC = 8h Paris hiver / 9h Paris été.
 * On utilise une fenêtre large (±6h) pour les rappels journaliers car
 * on veut cibler les représentations du bon jour, pas une heure précise.
 */
export const DAILY_REMINDER_CONFIGS: Record<'reminder_7d' | 'reminder_2d', ReminderConfig> = {
  reminder_7d: {
    type: 'reminder_7d',
    toggleKey: 'reminder_enabled_7d',
    label: 'Rappel J-7',
    // Représentations entre 6j18h et 7j6h à partir de maintenant
    windowStartMinutes: 6 * 24 * 60 + 18 * 60, // 9720 min
    windowEndMinutes:   7 * 24 * 60 + 6 * 60,  // 10440 min
  },
  reminder_2d: {
    type: 'reminder_2d',
    toggleKey: 'reminder_enabled_2d',
    label: 'Rappel J-2',
    // Représentations entre 1j18h et 2j6h à partir de maintenant
    windowStartMinutes: 1 * 24 * 60 + 18 * 60, // 2520 min
    windowEndMinutes:   2 * 24 * 60 + 6 * 60,  // 3240 min
  },
};

/**
 * Configuration pour le rappel horaire (H-4).
 * Fenêtre de ±30 min autour de 4h avant la représentation.
 * Le cron horaire tourne toutes les heures.
 */
export const HOURLY_REMINDER_CONFIG: ReminderConfig = {
  type: 'reminder_4h',
  toggleKey: 'reminder_enabled_4h',
  label: 'Rappel H-4',
  // Représentations entre 3h30 et 4h30 à partir de maintenant
  windowStartMinutes: 3 * 60 + 30, // 210 min
  windowEndMinutes:   4 * 60 + 30, // 270 min
};

// ============================================
// DONNÉES DES RÉSERVATIONS ÉLIGIBLES
// ============================================

/**
 * Données d'une réservation éligible à un rappel,
 * telles que récupérées depuis la requête Supabase.
 */
export interface EligibleReservation {
  /** ID de la réservation */
  id: string;
  /** Code de réservation affiché au professionnel */
  reservation_code: string;
  /** Nombre de places réservées */
  num_places: number;
  /** Email du professionnel */
  professional_email: string;
  /** Nom complet du professionnel */
  professional_full_name: string;
  /** Titre du spectacle */
  show_title: string;
  /** Slug du spectacle (pour le lien CTA) */
  show_slug: string;
  /** Nom de la compagnie */
  company_name: string;
  /** Date formatée du créneau (ex: "Mardi 10 mars 2026") */
  slot_date_formatted: string;
  /** Heure formatée du créneau (ex: "14h30") */
  slot_time_formatted: string;
  /** Timestamp UTC de début du créneau (pour filtrage) */
  slot_start_at: string;
  /** Nom du lieu */
  venue_name: string;
  /** Ville du lieu */
  venue_city: string;
  /** URL page marketing dervichediffusion.com (utilisée si show_derviche_site_link). */
  derviche_site_url: string | null;
  /** Nom du manager assigné (contact block) */
  manager_name: string | null;
  /** Email du manager assigné (contact block) */
  manager_email: string | null;
  /** Téléphone du manager assigné (contact block) */
  manager_phone: string | null;
}

// ============================================
// DONNÉES POUR LE BUILDER HTML
// ============================================

/**
 * Données passées aux builders HTML de rappel.
 * Interface commune aux 3 types (J-7, J-2, H-4).
 */
export interface ReminderEmailData {
  /** Adresse email du destinataire */
  to: string;
  /** Nom complet du professionnel */
  guestFullName: string;
  /** Code de réservation */
  reservationCode: string;
  /** ID de la réservation (pour logging) */
  reservationId: string;
  /** Titre du spectacle */
  showTitle: string;
  /** Slug du spectacle (pour le lien CTA) */
  showSlug: string;
  /** Nom de la compagnie */
  companyName: string;
  /** Date formatée du créneau */
  slotDateFormatted: string;
  /** Heure formatée du créneau */
  slotTimeFormatted: string;
  /** Nom du lieu */
  venueName: string;
  /** Ville du lieu */
  venueCity: string;
  /** Nombre de places */
  numPlaces: number;
  /** URL page marketing dervichediffusion.com (si show_derviche_site_link). */
  dervisheSiteUrl: string | null;
  /** Nom du manager (contact block) */
  managerName?: string | null;
  /** Email du manager (contact block) */
  managerEmail?: string | null;
  /** Téléphone du manager (contact block) */
  managerPhone?: string | null;
}

// ============================================
// RÉSULTATS
// ============================================

/**
 * Résultat de l'envoi d'un rappel unitaire.
 */
export interface ReminderResult {
  /** ID de la réservation concernée */
  reservationId: string;
  /** Email du destinataire */
  email: string;
  /** Succès ou échec de l'envoi */
  success: boolean;
  /** ID du message Resend (si succès) */
  messageId?: string;
  /** Message d'erreur (si échec) */
  error?: string;
}

/**
 * Résultat du traitement d'un batch de rappels pour un type donné.
 */
export interface ProcessRemindersResult {
  /** Type de rappel traité */
  type: ReminderType;
  /** Toggle activé ou non dans app_settings */
  enabled: boolean;
  /** Nombre de réservations éligibles trouvées */
  eligible: number;
  /** Nombre d'emails envoyés avec succès */
  sent: number;
  /** Nombre d'échecs */
  failed: number;
  /** Détail par réservation */
  results: ReminderResult[];
}
