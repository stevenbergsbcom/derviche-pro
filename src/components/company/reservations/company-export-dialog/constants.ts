/**
 * Constantes pour le composant CompanyExportDialog
 */

import type { PeriodOptionData } from './types';

// ============================================
// OPTIONS DE PÉRIODE
// ============================================

/**
 * Options de période pour l'export (sans icons JSX)
 * Les icons sont ajoutés au moment du rendu dans PeriodSelector
 */
export const PERIOD_OPTIONS_DATA: readonly PeriodOptionData[] = [
  {
    value: 'all',
    label: 'Toutes',
    description: 'Exporter toutes les réservations',
  },
  {
    value: 'upcoming',
    label: 'À venir',
    description: 'Représentations futures uniquement',
  },
  {
    value: 'past',
    label: 'Passées',
    description: 'Représentations passées uniquement',
  },
] as const;

// ============================================
// LABELS ET TEXTES
// ============================================

/** Labels pour les formats d'export */
export const FORMAT_LABELS = {
  xlsx: {
    title: 'Excel (.xlsx)',
    description: "Recommandé pour l'analyse",
  },
  csv: {
    title: 'CSV (.csv)',
    description: 'Compatible avec tout logiciel',
  },
} as const;

/** Labels pour les statuts de réservation (export) */
export const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  no_show: 'No-show',
} as const;

/** Labels pour les statuts de check-in (export) */
export const CHECKIN_STATUS_LABELS: Record<string, string> = {
  present_loved: 'A aimé',
  present_press: 'Presse',
  present_neutral: 'Neutre',
  absent: 'Absent',
} as const;

// ============================================
// LIMITES ET PARAMÈTRES
// ============================================

/** Nombre maximum de lignes dans l'aperçu */
export const PREVIEW_MAX_ROWS = 5;

/** Nombre maximum de colonnes affichées dans l'aperçu */
export const PREVIEW_MAX_COLUMNS = 6;

/** Longueurs de troncature pour l'aperçu */
export const TRUNCATE_LENGTHS = {
  spectacle: 25,
  venue: 20,
  email: 20,
  organization: 20,
  address: 25,
  specialRequests: 15,
} as const;
