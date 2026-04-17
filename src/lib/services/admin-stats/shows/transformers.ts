/**
 * Transformers - Shows stats
 * Derviche Diffusion
 */

import type { ShowStats } from '../types';

/** Forme brute retournée par la RPC `get_shows_stats`. */
export interface ShowsStatsRow {
  show_id: string;
  show_title: string;
  show_slug: string;
  company_id: string | null;
  company_name: string;
  representations_count: number | string | null;
  confirmed_count: number | string | null;
  cancelled_count: number | string | null;
  present_count: number | string | null;
  absent_count: number | string | null;
  press_count: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function toShowStats(row: ShowsStatsRow): ShowStats {
  return {
    showId: row.show_id,
    showTitle: row.show_title,
    showSlug: row.show_slug,
    companyId: row.company_id,
    companyName: row.company_name ?? '',
    representationsCount: toNumber(row.representations_count),
    confirmedCount: toNumber(row.confirmed_count),
    cancelledCount: toNumber(row.cancelled_count),
    presentCount: toNumber(row.present_count),
    absentCount: toNumber(row.absent_count),
    pressCount: toNumber(row.press_count),
  };
}
