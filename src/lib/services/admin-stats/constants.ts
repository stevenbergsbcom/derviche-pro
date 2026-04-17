/**
 * Constantes - Admin Stats Service
 * Derviche Diffusion
 */

import type { ComparePreset, StatsPeriod } from './types';

/** Période par défaut sélectionnée au chargement de la page. */
export const DEFAULT_STATS_PERIOD: StatsPeriod = 'month_current';

/** Taille de page par défaut pour les tableaux (spectacles, lieux). */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Borne inférieure utilisée lorsqu'on sélectionne la période "all".
 * Antérieure à toute donnée de production — sert de "no lower bound".
 */
export const ALL_PERIOD_FROM = '2020-01-01';

/**
 * Borne supérieure utilisée lorsqu'on sélectionne la période "all".
 * Date future lointaine pour inclure toutes les représentations à venir.
 */
export const ALL_PERIOD_TO = '2099-12-31';

/** Libellés FR des périodes (utilisés dans le select + les exports). */
export const STATS_PERIOD_LABELS: Record<StatsPeriod, string> = {
  month_current: 'Mois en cours',
  month_previous: 'Mois précédent',
  season_current: 'Saison en cours',
  year_current: 'Année civile',
  all: 'Tout',
  custom: 'Personnalisée',
};

/** Libellés FR des presets de comparaison. */
export const COMPARE_PRESET_LABELS: Record<ComparePreset, string> = {
  year_before: 'Année précédente (N-1)',
  previous_equivalent: 'Période équivalente précédente',
  previous_season: 'Saison précédente',
};

/**
 * Couleurs utilisées dans le chart (bar chart recharts).
 *
 * `main` : accent Derviche (aligné sur PDF_COLORS.accent).
 * `compare` : gris slate-400 — choix d'un hex explicite (et non d'une var CSS)
 * pour garantir un rendu cohérent dans html2canvas lors de l'export PDF.
 */
export const CHART_COLORS = {
  main: '#1e3a5f',
  compare: '#94a3b8',
} as const;
