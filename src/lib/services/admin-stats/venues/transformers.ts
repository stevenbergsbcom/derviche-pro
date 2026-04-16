/**
 * Transformers - Venues stats
 * Derviche Diffusion
 */

import type { VenueStats } from '../types';

/** Forme brute retournée par la RPC `get_venues_stats`. */
export interface VenuesStatsRow {
  venue_id: string;
  venue_name: string;
  venue_city: string;
  representations_count: number | string | null;
  shows_count: number | string | null;
  confirmed_count: number | string | null;
  present_count: number | string | null;
  absent_count: number | string | null;
  press_count: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function toVenueStats(row: VenuesStatsRow): VenueStats {
  return {
    venueId: row.venue_id,
    venueName: row.venue_name,
    venueCity: row.venue_city ?? '',
    representationsCount: toNumber(row.representations_count),
    showsCount: toNumber(row.shows_count),
    confirmedCount: toNumber(row.confirmed_count),
    presentCount: toNumber(row.present_count),
    absentCount: toNumber(row.absent_count),
    pressCount: toNumber(row.press_count),
  };
}
