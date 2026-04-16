/**
 * resolve-compare-bounds - Admin Stats Service
 * Derviche Diffusion
 *
 * Calcule les bornes de la période de comparaison (Phase 3) à partir des
 * bornes courantes, du preset sélectionné et du contexte (période d'origine
 * + paramètres de saison éventuels).
 */

import type { PeriodBounds } from '@/lib/services/admin-dashboard';
import type { SeasonSettings } from '@/lib/services/app-settings';
import type { ComparePreset, StatsPeriod } from '../types';
import { toLocalISO } from './period-bounds';

// ============================================
// UTILS INTERNES
// ============================================

/** Parse une chaîne YYYY-MM-DD en Date locale (minuit). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((s) => Number.parseInt(s, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/**
 * Recule une Date d'un nombre d'années donné.
 * Gère le cas 29 février → 28 février pour années non bissextiles.
 */
function shiftDateByYears(date: Date, years: number): Date {
  const y = date.getFullYear() - years;
  const m = date.getMonth();
  const d = date.getDate();
  const shifted = new Date(y, m, d);
  // Si le décalage entraîne un report (ex. 29/02/2024 → 01/03/2023), on
  // revient au dernier jour valide du mois cible (28/02/2023).
  if (shifted.getMonth() !== m) {
    return new Date(y, m + 1, 0);
  }
  return shifted;
}

/**
 * Décale des bornes d'un nombre d'années entier (années civiles / saisons).
 */
function shiftByYears(bounds: PeriodBounds, years: number): PeriodBounds {
  const start = shiftDateByYears(parseLocalDate(bounds.start), years);
  const end = shiftDateByYears(parseLocalDate(bounds.end), years);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

/**
 * Décale des bornes d'une durée égale à la période en cours.
 * Ex. 2026-03-01 → 2026-03-31 (31 jours) ⇒ 2026-01-29 → 2026-02-28.
 * newStart = start - durée jours ; newEnd = start - 1 jour.
 */
function shiftByDuration(bounds: PeriodBounds): PeriodBounds {
  const start = parseLocalDate(bounds.start);
  const end = parseLocalDate(bounds.end);
  const durationDays =
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const newEnd = new Date(start);
  newEnd.setDate(newEnd.getDate() - 1);

  const newStart = new Date(start);
  newStart.setDate(newStart.getDate() - durationDays);

  return { start: toLocalISO(newStart), end: toLocalISO(newEnd) };
}

/**
 * Décale une saison d'un an. Les saisons Derviche chevauchent typiquement
 * 2 années civiles (ex. 01/09 → 30/06). Un simple shift de -1 an fonctionne
 * pour le cas normal.
 */
function shiftSeason(bounds: PeriodBounds): PeriodBounds {
  return shiftByYears(bounds, 1);
}

// ============================================
// API PUBLIQUE
// ============================================

/**
 * Calcule les bornes de la période de comparaison selon le preset.
 *
 * @param originalBounds Bornes de la période courante
 * @param preset         Type de comparaison
 * @param period         Période d'origine (pour valider `previous_season`)
 * @param season         Paramètres de saison (requis pour `previous_season`)
 * @returns Bornes de la période de comparaison
 */
export function resolveCompareBounds(
  originalBounds: PeriodBounds,
  preset: ComparePreset,
  period: StatsPeriod,
  season?: SeasonSettings,
): PeriodBounds {
  // Le preset 'previous_season' n'a de sens que si la période courante est la
  // saison courante. Sinon fallback sur 'year_before'.
  if (preset === 'previous_season' && period !== 'season_current') {
    return shiftByYears(originalBounds, 1);
  }

  // `season` est accepté dans la signature publique pour compatibilité future
  // (si l'on doit un jour recalculer les bornes d'une saison autrement) ; il
  // n'est pas utilisé par l'implémentation actuelle du décalage.
  void season;

  switch (preset) {
    case 'year_before':
      return shiftByYears(originalBounds, 1);
    case 'previous_equivalent':
      return shiftByDuration(originalBounds);
    case 'previous_season':
      return shiftSeason(originalBounds);
  }
}
