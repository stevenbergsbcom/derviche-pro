/**
 * Transformers - Detail stats
 * Derviche Diffusion
 *
 * Conversion snake_case (Postgres) → camelCase (TypeScript) pour les
 * RPCs `get_show_detail_stats` et `get_venue_detail_stats`.
 */

import type { ShowDetailRow, VenueDetailRow } from '../types';

// ============================================
// ROWS BRUTES (forme RPC)
// ============================================

export interface ShowDetailRawRow {
  slot_id: string;
  slot_date: string;
  slot_time: string;
  venue_name: string;
  venue_city: string;
  capacity: number | string | null;
  confirmed_count: number | string | null;
  present_count: number | string | null;
  absent_count: number | string | null;
  press_count: number | string | null;
}

export interface VenueDetailRawRow {
  show_id: string;
  show_title: string;
  show_slug: string;
  company_name: string;
  representations_count: number | string | null;
  confirmed_count: number | string | null;
  present_count: number | string | null;
  absent_count: number | string | null;
  press_count: number | string | null;
}

// ============================================
// HELPERS
// ============================================

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

// ============================================
// MAPPERS
// ============================================

export function toShowDetailRow(row: ShowDetailRawRow): ShowDetailRow {
  return {
    slotId: row.slot_id,
    slotDate: row.slot_date,
    slotTime: row.slot_time,
    venueName: row.venue_name ?? '',
    venueCity: row.venue_city ?? '',
    capacity: toNumber(row.capacity),
    confirmedCount: toNumber(row.confirmed_count),
    presentCount: toNumber(row.present_count),
    absentCount: toNumber(row.absent_count),
    pressCount: toNumber(row.press_count),
  };
}

export function toVenueDetailRow(row: VenueDetailRawRow): VenueDetailRow {
  return {
    showId: row.show_id,
    showTitle: row.show_title,
    showSlug: row.show_slug,
    companyName: row.company_name ?? '',
    representationsCount: toNumber(row.representations_count),
    confirmedCount: toNumber(row.confirmed_count),
    presentCount: toNumber(row.present_count),
    absentCount: toNumber(row.absent_count),
    pressCount: toNumber(row.press_count),
  };
}
