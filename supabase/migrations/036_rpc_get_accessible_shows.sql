-- ============================================
-- Migration 036: RPC get_accessible_shows for PWA check-in
-- Derviche Diffusion - Performance optimization
-- Date: 2025-01-27
-- Session: S90
-- ============================================
-- 
-- Purpose: Replace multiple JavaScript queries with a single optimized
-- PostgreSQL function that returns shows with slot counts and next/last slot info.
--
-- Performance gains:
-- - Uses composite indexes (idx_slots_show_date, idx_reservations_slot_status)
-- - Aggregates data server-side instead of client-side
-- - Reduces data transfer from ~5000 rows to ~50 rows
-- ============================================

-- ============================================
-- TYPE: Returned structure for each show
-- ============================================

-- Drop type if exists (for re-running migration during development)
DROP TYPE IF EXISTS public.accessible_show_result CASCADE;

CREATE TYPE public.accessible_show_result AS (
  id UUID,
  slug TEXT,
  title TEXT,
  image_url TEXT,
  company_id UUID,
  company_name TEXT,
  upcoming_slots_count INTEGER,
  past_slots_count INTEGER,
  -- Next slot info (nullable)
  next_slot_id UUID,
  next_slot_date DATE,
  next_slot_time TIME,
  next_slot_venue_name TEXT,
  -- Last slot info (nullable)
  last_slot_id UUID,
  last_slot_date DATE,
  last_slot_time TIME,
  last_slot_venue_name TEXT
);

-- ============================================
-- FUNCTION: get_accessible_shows
-- ============================================

CREATE OR REPLACE FUNCTION public.get_accessible_shows(
  p_user_id UUID,
  p_role TEXT,
  p_company_id UUID DEFAULT NULL
)
RETURNS SETOF public.accessible_show_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
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

  RETURN QUERY
  WITH 
  -- Step 1: Filter shows based on role
  accessible_shows AS (
    SELECT DISTINCT s.id
    FROM shows s
    INNER JOIN slots sl ON sl.show_id = s.id
    WHERE s.deleted_at IS NULL
      AND s.status = 'published'
      AND (
        -- Admin: all shows
        (p_role = ANY(v_admin_roles))
        OR
        -- Externe: only slots where user is hosted_by_id
        (p_role = 'externe' AND sl.hosted_by_id = p_user_id)
        OR
        -- Company: own company shows with hosted_by = 'company'
        (p_role = 'company' AND s.company_id = p_company_id AND sl.hosted_by = 'company')
      )
  ),
  
  -- Step 2: Count upcoming and past slots per show
  slot_counts AS (
    SELECT 
      sl.show_id,
      COUNT(*) FILTER (WHERE sl.date >= v_today) AS upcoming_count,
      COUNT(*) FILTER (WHERE sl.date < v_today) AS past_count
    FROM slots sl
    INNER JOIN accessible_shows a ON a.id = sl.show_id
    WHERE (
      -- Apply same role-based filter for slot counting
      (p_role = ANY(v_admin_roles))
      OR
      (p_role = 'externe' AND sl.hosted_by_id = p_user_id)
      OR
      (p_role = 'company' AND sl.hosted_by = 'company')
    )
    GROUP BY sl.show_id
  ),
  
  -- Step 3: Get next slot (first upcoming) per show
  next_slots AS (
    SELECT DISTINCT ON (sl.show_id)
      sl.show_id,
      sl.id AS slot_id,
      sl.date,
      sl.time,
      v.name AS venue_name
    FROM slots sl
    INNER JOIN accessible_shows a ON a.id = sl.show_id
    INNER JOIN venues v ON v.id = sl.venue_id
    WHERE sl.date >= v_today
      AND (
        (p_role = ANY(v_admin_roles))
        OR
        (p_role = 'externe' AND sl.hosted_by_id = p_user_id)
        OR
        (p_role = 'company' AND sl.hosted_by = 'company')
      )
    ORDER BY sl.show_id, sl.date ASC, sl.time ASC
  ),
  
  -- Step 4: Get last slot (most recent past) per show
  last_slots AS (
    SELECT DISTINCT ON (sl.show_id)
      sl.show_id,
      sl.id AS slot_id,
      sl.date,
      sl.time,
      v.name AS venue_name
    FROM slots sl
    INNER JOIN accessible_shows a ON a.id = sl.show_id
    INNER JOIN venues v ON v.id = sl.venue_id
    WHERE sl.date < v_today
      AND (
        (p_role = ANY(v_admin_roles))
        OR
        (p_role = 'externe' AND sl.hosted_by_id = p_user_id)
        OR
        (p_role = 'company' AND sl.hosted_by = 'company')
      )
    ORDER BY sl.show_id, sl.date DESC, sl.time DESC
  )
  
  -- Final query: join all CTEs
  SELECT 
    s.id,
    s.slug,
    s.title,
    s.image_url,
    c.id AS company_id,
    c.name AS company_name,
    COALESCE(sc.upcoming_count, 0)::INTEGER AS upcoming_slots_count,
    COALESCE(sc.past_count, 0)::INTEGER AS past_slots_count,
    ns.slot_id AS next_slot_id,
    ns.date AS next_slot_date,
    ns.time AS next_slot_time,
    ns.venue_name AS next_slot_venue_name,
    ls.slot_id AS last_slot_id,
    ls.date AS last_slot_date,
    ls.time AS last_slot_time,
    ls.venue_name AS last_slot_venue_name
  FROM shows s
  INNER JOIN companies c ON c.id = s.company_id
  INNER JOIN accessible_shows a ON a.id = s.id
  LEFT JOIN slot_counts sc ON sc.show_id = s.id
  LEFT JOIN next_slots ns ON ns.show_id = s.id
  LEFT JOIN last_slots ls ON ls.show_id = s.id
  ORDER BY ns.date ASC NULLS LAST, ns.time ASC NULLS LAST, s.title ASC;
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_accessible_shows(UUID, TEXT, UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.get_accessible_shows IS 
  'Returns accessible shows for PWA check-in based on user role. 
   Optimized to replace client-side aggregation with server-side SQL.
   - Admin roles: all published shows with slots
   - Externe: shows where user is hosted_by_id on at least one slot
   - Company: company shows where hosted_by = company';

COMMENT ON TYPE public.accessible_show_result IS 
  'Return type for get_accessible_shows RPC function';
