/**
 * Period bounds - Admin Stats Service
 * Derviche Diffusion
 *
 * Convertit une `StatsPeriod` (avec bornes custom éventuelles) en
 * `PeriodBounds` { start, end } au format YYYY-MM-DD.
 *
 * Les périodes prédéfinies sont calculées en heure locale pour rester
 * alignées avec les dates stockées en base (sl.date = DATE pur).
 */

import { computePeriodBounds } from '@/lib/services/admin-dashboard/period';
import type { PeriodBounds } from '@/lib/services/admin-dashboard';
import type { SeasonSettings } from '@/lib/services/app-settings';
import { ALL_PERIOD_FROM, ALL_PERIOD_TO } from '../constants';
import type { StatsPeriod } from '../types';

// ============================================
// UTILS INTERNES
// ============================================

/** Formate une Date en YYYY-MM-DD en heure locale. */
export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================
// CALCULS PAR PÉRIODE
// ============================================

function monthCurrentBounds(): PeriodBounds {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

function monthPreviousBounds(): PeriodBounds {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

function yearCurrentBounds(): PeriodBounds {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return { start: toLocalISO(start), end: toLocalISO(end) };
}

function allBounds(): PeriodBounds {
  return { start: ALL_PERIOD_FROM, end: ALL_PERIOD_TO };
}

// ============================================
// API PUBLIQUE
// ============================================

export interface ResolvePeriodInput {
  period: StatsPeriod;
  /** Obligatoire si period = 'custom'. */
  from?: string;
  /** Obligatoire si period = 'custom'. */
  to?: string;
  /** Paramètres de saison (pour 'season_current'). */
  season: SeasonSettings;
}

/**
 * Résout les bornes { start, end } à partir d'une `StatsPeriod`.
 * Pour `custom` : utilise `from` / `to` fournis (fallback mois en cours).
 */
export function resolveStatsBounds(input: ResolvePeriodInput): PeriodBounds {
  switch (input.period) {
    case 'month_current':
      return monthCurrentBounds();
    case 'month_previous':
      return monthPreviousBounds();
    case 'year_current':
      return yearCurrentBounds();
    case 'season_current':
      return computePeriodBounds('season', input.season);
    case 'all':
      return allBounds();
    case 'custom':
      if (input.from && input.to) {
        return { start: input.from, end: input.to };
      }
      return monthCurrentBounds();
  }
}
