-- ============================================
-- Migration 104: Fix ambiguous column references in stats RPCs
-- Derviche Diffusion
-- ============================================
-- Les RPCs get_shows_stats et get_venues_stats avaient des références
-- ambiguës ("show_id", "venue_id") entre :
--   - les colonnes de sortie RETURNS TABLE
--   - les colonnes des CTE (slot_counts, reservation_counts)
--   - les colonnes des tables jointes
--
-- Fix : préfixer toutes les références dans les CTE et le SELECT final
-- avec des alias distincts (sl_show_id, sc_reps, rc_confirmed, etc.).
-- ============================================

-- ============================================
-- 1) get_shows_stats
-- ============================================

DROP FUNCTION IF EXISTS public.get_shows_stats(DATE, DATE, UUID[], UUID[]);

CREATE OR REPLACE FUNCTION public.get_shows_stats(
    p_from DATE,
    p_to DATE,
    p_company_ids UUID[] DEFAULT NULL,
    p_venue_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    show_id UUID,
    show_title TEXT,
    show_slug TEXT,
    company_id UUID,
    company_name TEXT,
    representations_count BIGINT,
    confirmed_count BIGINT,
    cancelled_count BIGINT,
    present_count BIGINT,
    absent_count BIGINT,
    press_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin_or_super() THEN
        RAISE EXCEPTION 'Accès refusé — admin requis';
    END IF;

    IF p_from IS NULL OR p_to IS NULL THEN
        RAISE EXCEPTION 'p_from et p_to sont obligatoires';
    END IF;

    RETURN QUERY
    WITH scoped_slots AS (
        SELECT sl.id AS slot_id, sl.show_id AS sl_show_id
        FROM public.slots sl
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
          AND (p_venue_ids IS NULL OR sl.venue_id = ANY(p_venue_ids))
    ),
    slot_counts AS (
        SELECT ss.sl_show_id, COUNT(*)::BIGINT AS reps
        FROM scoped_slots ss
        GROUP BY ss.sl_show_id
    ),
    reservation_counts AS (
        SELECT
            ss.sl_show_id,
            COUNT(*) FILTER (WHERE r.status = 'confirmed')::BIGINT AS confirmed,
            COUNT(*) FILTER (WHERE r.status = 'cancelled')::BIGINT AS cancelled,
            COUNT(*) FILTER (
                WHERE r.checkin_status IN ('present_loved', 'present_press', 'present_neutral')
            )::BIGINT AS present,
            COUNT(*) FILTER (WHERE r.checkin_status = 'absent')::BIGINT AS absent,
            COUNT(*) FILTER (WHERE r.checkin_status = 'present_press')::BIGINT AS press
        FROM public.reservations r
        INNER JOIN scoped_slots ss ON ss.slot_id = r.slot_id
        GROUP BY ss.sl_show_id
    )
    SELECT
        s.id AS show_id,
        s.title AS show_title,
        s.slug AS show_slug,
        s.company_id,
        COALESCE(c.name, '')::TEXT AS company_name,
        COALESCE(sc.reps, 0)::BIGINT AS representations_count,
        COALESCE(rc.confirmed, 0)::BIGINT AS confirmed_count,
        COALESCE(rc.cancelled, 0)::BIGINT AS cancelled_count,
        COALESCE(rc.present, 0)::BIGINT AS present_count,
        COALESCE(rc.absent, 0)::BIGINT AS absent_count,
        COALESCE(rc.press, 0)::BIGINT AS press_count
    FROM public.shows s
    LEFT JOIN public.companies c ON c.id = s.company_id
    LEFT JOIN slot_counts sc ON sc.sl_show_id = s.id
    LEFT JOIN reservation_counts rc ON rc.sl_show_id = s.id
    WHERE s.id IN (SELECT DISTINCT ss.sl_show_id FROM scoped_slots ss);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shows_stats(DATE, DATE, UUID[], UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_shows_stats IS
    'Agrégats par spectacle sur la période : représentations, confirmées, annulées, présents, absents, presse.';

-- ============================================
-- 2) get_venues_stats
-- ============================================

DROP FUNCTION IF EXISTS public.get_venues_stats(DATE, DATE, UUID[]);

CREATE OR REPLACE FUNCTION public.get_venues_stats(
    p_from DATE,
    p_to DATE,
    p_company_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    venue_id UUID,
    venue_name TEXT,
    venue_city TEXT,
    representations_count BIGINT,
    shows_count BIGINT,
    confirmed_count BIGINT,
    present_count BIGINT,
    absent_count BIGINT,
    press_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin_or_super() THEN
        RAISE EXCEPTION 'Accès refusé — admin requis';
    END IF;

    IF p_from IS NULL OR p_to IS NULL THEN
        RAISE EXCEPTION 'p_from et p_to sont obligatoires';
    END IF;

    RETURN QUERY
    WITH scoped_slots AS (
        SELECT sl.id AS slot_id, sl.venue_id AS sl_venue_id, sl.show_id AS sl_show_id
        FROM public.slots sl
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
    ),
    slot_counts AS (
        SELECT
            ss.sl_venue_id,
            COUNT(*)::BIGINT AS reps,
            COUNT(DISTINCT ss.sl_show_id)::BIGINT AS shows
        FROM scoped_slots ss
        GROUP BY ss.sl_venue_id
    ),
    reservation_counts AS (
        SELECT
            ss.sl_venue_id,
            COUNT(*) FILTER (WHERE r.status = 'confirmed')::BIGINT AS confirmed,
            COUNT(*) FILTER (
                WHERE r.checkin_status IN ('present_loved', 'present_press', 'present_neutral')
            )::BIGINT AS present,
            COUNT(*) FILTER (WHERE r.checkin_status = 'absent')::BIGINT AS absent,
            COUNT(*) FILTER (WHERE r.checkin_status = 'present_press')::BIGINT AS press
        FROM public.reservations r
        INNER JOIN scoped_slots ss ON ss.slot_id = r.slot_id
        GROUP BY ss.sl_venue_id
    )
    SELECT
        v.id AS venue_id,
        v.name AS venue_name,
        COALESCE(v.city, '')::TEXT AS venue_city,
        COALESCE(sc.reps, 0)::BIGINT AS representations_count,
        COALESCE(sc.shows, 0)::BIGINT AS shows_count,
        COALESCE(rc.confirmed, 0)::BIGINT AS confirmed_count,
        COALESCE(rc.present, 0)::BIGINT AS present_count,
        COALESCE(rc.absent, 0)::BIGINT AS absent_count,
        COALESCE(rc.press, 0)::BIGINT AS press_count
    FROM public.venues v
    LEFT JOIN slot_counts sc ON sc.sl_venue_id = v.id
    LEFT JOIN reservation_counts rc ON rc.sl_venue_id = v.id
    WHERE v.id IN (SELECT DISTINCT ss.sl_venue_id FROM scoped_slots ss);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_venues_stats(DATE, DATE, UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_venues_stats IS
    'Agrégats par lieu sur la période : représentations, spectacles distincts, confirmées, présents, absents, presse.';
