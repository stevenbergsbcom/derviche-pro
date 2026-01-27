-- ============================================
-- Migration 037: RPC get_accessible_slots for PWA check-in
-- Derviche Diffusion - Performance optimization
-- Date: 2025-01-27
-- Session: S91
-- ============================================
-- 
-- Purpose: Replace client-side reservation counting with server-side SQL.
-- Uses COUNT with FILTER for efficient aggregation.
--
-- Performance gains:
-- - Uses idx_reservations_slot_status for fast counting
-- - No longer transfers all reservations to client
-- - Aggregates confirmed/checked-in counts server-side
-- ============================================

-- ============================================
-- TYPE: Returned structure for each slot
-- ============================================

DROP TYPE IF EXISTS public.accessible_slot_result CASCADE;

CREATE TYPE public.accessible_slot_result AS (
  id UUID,
  date DATE,
  time TIME,
  capacity INTEGER,
  remaining_capacity INTEGER,
  hosted_by TEXT,
  hosted_by_id UUID,
  -- Venue info
  venue_id UUID,
  venue_name TEXT,
  venue_city TEXT,
  -- Show info
  show_id UUID,
  show_slug TEXT,
  show_title TEXT,
  -- Reservation counts (computed server-side)
  confirmed_count INTEGER,
  checked_in_count INTEGER
);

-- ============================================
-- FUNCTION: get_accessible_slots
-- ============================================

CREATE OR REPLACE FUNCTION public.get_accessible_slots(
  p_show_slug TEXT,
  p_user_id UUID,
  p_role TEXT,
  p_company_id UUID DEFAULT NULL,
  p_past_days_limit INTEGER DEFAULT 30,
  p_upcoming_only BOOLEAN DEFAULT FALSE,
  p_include_all_past BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.accessible_slot_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_show_id UUID;
  v_show_company_id UUID;
  v_today DATE := CURRENT_DATE;
  v_min_date DATE;
  v_admin_roles TEXT[] := ARRAY['super-admin', 'admin'];
BEGIN
  -- Validate role
  IF p_role NOT IN ('super-admin', 'admin', 'externe', 'company') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Validate company role has company_id
  IF p_role = 'company' AND p_company_id IS NULL THEN
    RAISE EXCEPTION 'Company role requires company_id';
  END IF;

  -- Get show by slug
  SELECT id, company_id INTO v_show_id, v_show_company_id
  FROM shows
  WHERE slug = p_show_slug
    AND deleted_at IS NULL;

  IF v_show_id IS NULL THEN
    RAISE EXCEPTION 'Show not found: %', p_show_slug;
  END IF;

  -- Check company access
  IF p_role = 'company' AND v_show_company_id != p_company_id THEN
    RAISE EXCEPTION 'Access denied to this show';
  END IF;

  -- Calculate min date based on options
  -- Priority: p_include_all_past > p_upcoming_only > p_past_days_limit
  IF p_include_all_past THEN
    v_min_date := NULL;
  ELSIF p_upcoming_only THEN
    v_min_date := v_today;
  ELSE
    v_min_date := v_today - p_past_days_limit;
  END IF;

  RETURN QUERY
  WITH slot_reservations AS (
    -- Pre-aggregate reservation counts per slot
    -- Uses idx_reservations_slot_status for performance
    SELECT 
      r.slot_id,
      COUNT(*) FILTER (WHERE r.status = 'confirmed') AS confirmed_count,
      COUNT(*) FILTER (
        WHERE r.status = 'confirmed' 
          AND r.checkin_status IS NOT NULL 
          AND r.checkin_status != 'absent'
      ) AS checked_in_count
    FROM reservations r
    INNER JOIN slots sl ON sl.id = r.slot_id
    WHERE sl.show_id = v_show_id
    GROUP BY r.slot_id
  )
  SELECT 
    sl.id,
    sl.date,
    sl.time,
    sl.capacity,
    sl.remaining_capacity,
    sl.hosted_by,
    sl.hosted_by_id,
    v.id AS venue_id,
    v.name AS venue_name,
    COALESCE(v.city, '') AS venue_city,
    s.id AS show_id,
    s.slug AS show_slug,
    s.title AS show_title,
    COALESCE(sr.confirmed_count, 0)::INTEGER AS confirmed_count,
    COALESCE(sr.checked_in_count, 0)::INTEGER AS checked_in_count
  FROM slots sl
  INNER JOIN shows s ON s.id = sl.show_id
  INNER JOIN venues v ON v.id = sl.venue_id
  LEFT JOIN slot_reservations sr ON sr.slot_id = sl.id
  WHERE sl.show_id = v_show_id
    -- Date filter
    AND (v_min_date IS NULL OR sl.date >= v_min_date)
    -- Role-based filter
    AND (
      (p_role = ANY(v_admin_roles))
      OR
      (p_role = 'externe' AND sl.hosted_by_id = p_user_id)
      OR
      (p_role = 'company' AND sl.hosted_by = 'company')
    )
  ORDER BY sl.date ASC, sl.time ASC;
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_accessible_slots(TEXT, UUID, TEXT, UUID, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.get_accessible_slots IS 
  'Returns accessible slots for a show in PWA check-in.
   Includes server-side aggregated reservation counts.
   - Admin roles: all slots for the show
   - Externe: slots where user is hosted_by_id
   - Company: slots where hosted_by = company
   
   Options:
   - p_past_days_limit: How many days of past slots to include (default: 30)
   - p_upcoming_only: Only return future slots (ignores past_days_limit)
   - p_include_all_past: Include all historical slots (ignores past_days_limit)';

COMMENT ON TYPE public.accessible_slot_result IS 
  'Return type for get_accessible_slots RPC function';
