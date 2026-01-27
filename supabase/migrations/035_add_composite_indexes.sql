-- ============================================
-- Migration 035: Add composite indexes for performance
-- Derviche Diffusion - PWA Check-in optimization
-- Date: 2025-01-27
-- Session: S89
-- ============================================
-- 
-- Purpose: Optimize query performance for PWA check-in features
-- by adding composite indexes on frequently filtered columns.
--
-- Existing indexes (for reference):
-- - idx_reservations_slot (slot_id) - migration 003
-- - idx_reservations_status (status) - migration 003
-- - idx_slots_show (show_id) - migration 003
-- - idx_slots_date (date) - migration 003
-- - idx_slots_hosted_by_id (hosted_by_id) - migration 012
-- - idx_shows_slug (slug) - migration 003
-- - idx_shows_status (status) - migration 003
-- - idx_shows_deleted_at (deleted_at) WHERE deleted_at IS NULL - migration 003
-- ============================================

-- ============================================
-- COMPOSITE INDEX: reservations(slot_id, status)
-- ============================================
-- Used for: Counting confirmed reservations per slot
-- Query pattern: WHERE slot_id = ? AND status = 'confirmed'
-- Benefits: Avoids sequential scan when counting reservations

CREATE INDEX IF NOT EXISTS idx_reservations_slot_status 
  ON public.reservations(slot_id, status);

COMMENT ON INDEX public.idx_reservations_slot_status IS 
  'Composite index for fast counting of reservations by slot and status (PWA check-in)';

-- ============================================
-- COMPOSITE INDEX: slots(show_id, date)
-- ============================================
-- Used for: Filtering slots by show and date range
-- Query pattern: WHERE show_id = ? AND date >= ? AND date <= ?
-- Benefits: Efficient filtering for show detail pages

CREATE INDEX IF NOT EXISTS idx_slots_show_date 
  ON public.slots(show_id, date);

COMMENT ON INDEX public.idx_slots_show_date IS 
  'Composite index for filtering slots by show and date (PWA check-in)';

-- ============================================
-- COMPOSITE INDEX: shows(status, deleted_at)
-- ============================================
-- Used for: Filtering published and non-deleted shows
-- Query pattern: WHERE status = 'published' AND deleted_at IS NULL
-- Benefits: Fast filtering for catalogue and check-in lists

CREATE INDEX IF NOT EXISTS idx_shows_status_deleted 
  ON public.shows(status, deleted_at);

COMMENT ON INDEX public.idx_shows_status_deleted IS 
  'Composite index for filtering shows by status and soft-delete (PWA check-in)';

-- ============================================
-- VERIFICATION QUERY (for testing)
-- ============================================
-- Run this query to verify indexes were created:
-- 
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('reservations', 'slots', 'shows')
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
