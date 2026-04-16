/**
 * Constantes - Admin Stats Service
 * Derviche Diffusion
 */

import type { StatsPeriod } from './types';

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
