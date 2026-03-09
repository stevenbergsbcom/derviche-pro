/**
 * Period - Admin Dashboard Service
 * Derviche Diffusion
 *
 * Calcule les bornes de dates pour chaque période du dashboard.
 * Lit les paramètres de saison depuis app_settings.
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { DashboardPeriod, PeriodBounds } from './types';
import type { SeasonSettings } from '@/lib/services/app-settings';

// Valeurs par défaut si app_settings non configuré
const DEFAULT_SEASON_START = '09-01'; // 1er septembre
const DEFAULT_SEASON_END = '06-30';   // 30 juin

// ============================================
// LECTURE DES PARAMÈTRES DE SAISON
// ============================================

/**
 * Lit les paramètres season_start / season_end depuis app_settings.
 * Retourne les valeurs par défaut en cas d'erreur.
 */
export async function getSeasonSettings(): Promise<SeasonSettings> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['season_start', 'season_end']);

    if (error || !data) {
      logger.error('Erreur lecture season settings', { error: error?.message });
      return { season_start: DEFAULT_SEASON_START, season_end: DEFAULT_SEASON_END };
    }

    const settings: Record<string, string> = {};
    for (const row of data) {
      // Les valeurs JSONB sont stockées avec guillemets → on strip
      settings[row.key] = String(row.value).replace(/^"|"$/g, '');
    }

    return {
      season_start: settings['season_start'] ?? DEFAULT_SEASON_START,
      season_end: settings['season_end'] ?? DEFAULT_SEASON_END,
    };
  } catch (err) {
    logger.error('Exception getSeasonSettings', {
      message: err instanceof Error ? err.message : 'Erreur inconnue',
    });
    return { season_start: DEFAULT_SEASON_START, season_end: DEFAULT_SEASON_END };
  }
}

// ============================================
// CALCUL DES BORNES DE PÉRIODE
// ============================================

/**
 * Calcule les bornes de dates pour une période donnée.
 * 
 * - 7d  : aujourd'hui - 6 jours → aujourd'hui
 * - 30d : aujourd'hui - 29 jours → aujourd'hui
 * - season : du season_start au season_end de la saison courante
 *
 * La "saison courante" est déterminée par la date du jour :
 * si on est après season_start → saison en cours (ex: sept 2025 → juin 2026)
 * si on est avant season_start → saison précédente (ex: août 2025 → sept 2024 → juin 2025)
 */
/** Formate une Date en YYYY-MM-DD en heure locale (pas UTC). */
function toLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computePeriodBounds(
  period: DashboardPeriod,
  season: SeasonSettings
): PeriodBounds {
  const now = new Date();
  const todayISO = toLocalDateISO(now);

  if (period === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return {
      start: toLocalDateISO(start),
      end: todayISO,
    };
  }

  if (period === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return {
      start: toLocalDateISO(start),
      end: todayISO,
    };
  }

  // Saison : calcul dynamique
  // season_start format MM-DD (ex: "09-01")
  const [startMonth, startDay] = season.season_start.split('-').map(Number);
  const [endMonth, endDay] = season.season_end.split('-').map(Number);

  const year = now.getFullYear();

  // Date de début de saison pour l'année courante
  const seasonStartThisYear = new Date(year, (startMonth ?? 9) - 1, startDay ?? 1);

  // Si la saison start est après la saison end (ex: sept → juin),
  // et qu'on est après le début de saison → saison year/year+1
  // sinon → saison (year-1)/year
  let seasonStartDate: Date;
  let seasonEndDate: Date;

  const startM = startMonth ?? 9;
  const startD = startDay ?? 1;
  const endM = endMonth ?? 6;
  const endD = endDay ?? 30;

  if (startM > endM) {
    // Saison à cheval sur deux années (ex: sept → juin)
    if (now >= seasonStartThisYear) {
      seasonStartDate = new Date(year, startM - 1, startD);
      seasonEndDate = new Date(year + 1, endM - 1, endD);
    } else {
      seasonStartDate = new Date(year - 1, startM - 1, startD);
      seasonEndDate = new Date(year, endM - 1, endD);
    }
  } else {
    // Saison dans la même année (ex: janv → déc)
    seasonStartDate = new Date(year, startM - 1, startD);
    seasonEndDate = new Date(year, endM - 1, endD);
  }

  return {
    start: toLocalDateISO(seasonStartDate),
    end: toLocalDateISO(seasonEndDate),
  };
}

/**
 * Génère un tableau de toutes les dates ISO entre start et end (inclus).
 * Limité à 366 jours pour éviter les boucles infinies.
 */
export function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  // Passer par UTC pour construire les objets Date depuis des strings YYYY-MM-DD
  // puis utiliser les méthodes UTC pour éviter tout décalage
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);

  const current = new Date(sy!, (sm! - 1), sd!);
  const endDate = new Date(ey!, (em! - 1), ed!);

  const maxDays = 366;
  let iterations = 0;

  while (current <= endDate && iterations < maxDays) {
    dates.push(toLocalDateISO(current));
    current.setDate(current.getDate() + 1);
    iterations++;
  }

  return dates;
}
