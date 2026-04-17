/**
 * resolve-compare-bounds - Admin Stats Service
 * Derviche Diffusion
 *
 * Calcule les bornes de la période de comparaison (Phase 3) à partir des
 * bornes courantes, du preset sélectionné et du contexte (période d'origine
 * + paramètres de saison éventuels).
 */

import type { PeriodBounds } from '@/lib/services/admin-dashboard';
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
 * Décale une saison d'un an pour obtenir la saison précédente.
 *
 * Implémentation : shift de -1 an sur les 2 bornes. C'est sémantiquement
 * équivalent à « saison N-1 » car les saisons Derviche sont stables (mêmes
 * mois/jours de début et fin chaque année, ex. 01/09 → 30/06). Le paramètre
 * `season` (accepté par le point d'entrée public `resolveCompareBounds`) n'a
 * donc pas besoin d'être consulté ici.
 *
 * Si le modèle de saison évoluait (ex. bornes dynamiques par année), ce
 * helper devrait recalculer les bornes via `resolveStatsBounds({ period:
 * 'season_current', season: shiftedSeason })` plutôt que de shifter.
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
 * Note : aucun paramètre `season` n'est nécessaire car les saisons Derviche
 * sont stables dans le temps (mêmes mois/jours chaque année). Voir le commentaire
 * de `shiftSeason` si ce modèle doit évoluer.
 *
 * @param originalBounds Bornes de la période courante
 * @param preset         Type de comparaison
 * @param period         Période d'origine (pour valider `previous_season`)
 * @returns Bornes de la période de comparaison
 */
export function resolveCompareBounds(
  originalBounds: PeriodBounds,
  preset: ComparePreset,
  period: StatsPeriod,
): PeriodBounds {
  // Le preset 'previous_season' n'a de sens que si la période courante est la
  // saison courante. Sinon fallback sur 'year_before' (comportement cohérent
  // avec l'UI qui désactive cette option hors saison).
  if (preset === 'previous_season' && period !== 'season_current') {
    return shiftByYears(originalBounds, 1);
  }

  switch (preset) {
    case 'year_before':
      return shiftByYears(originalBounds, 1);
    case 'previous_equivalent':
      return shiftByDuration(originalBounds);
    case 'previous_season':
      return shiftSeason(originalBounds);
  }
}
