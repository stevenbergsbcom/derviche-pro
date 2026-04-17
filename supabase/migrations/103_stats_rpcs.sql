-- ============================================
-- Migration 103: RPCs d'agrégation pour la page Statistiques admin
-- Derviche Diffusion
-- Session: Statistiques Phase 1 (MVP)
-- ============================================
--
-- Crée trois RPCs pour l'agrégation statistique utilisée par
-- /admin/statistiques. Les RPCs s'appuient sur les index existants
-- (slots.date, reservations.slot_id/status/checkin_status).
--
-- Toutes les fonctions :
--   - SECURITY DEFINER + search_path = public
--   - Vérifient que l'appelant est admin ou super-admin via
--     is_admin_or_super() (définie en migration 001)
--   - Acceptent des tableaux nullables (NULL = pas de filtre)
--   - Ne comptent que les créneaux dans la fenêtre [p_from, p_to]
-- ============================================

-- ============================================
-- 1) get_stats_kpis
-- ============================================

DROP FUNCTION IF EXISTS public.get_stats_kpis(DATE, DATE, UUID[], UUID[]);

CREATE OR REPLACE FUNCTION public.get_stats_kpis(
    p_from DATE,
    p_to DATE,
    p_company_ids UUID[] DEFAULT NULL,
    p_venue_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    total_confirmed BIGINT,
    total_cancelled BIGINT,
    total_places_confirmed BIGINT,
    total_shows BIGINT
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
    WITH scoped_reservations AS (
        SELECT
            r.id,
            r.status,
            r.num_places,
            sl.show_id
        FROM public.reservations r
        INNER JOIN public.slots sl ON sl.id = r.slot_id
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
          AND (p_venue_ids IS NULL OR sl.venue_id = ANY(p_venue_ids))
    )
    SELECT
        COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT AS total_confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT AS total_cancelled,
        COALESCE(SUM(num_places) FILTER (WHERE status = 'confirmed'), 0)::BIGINT AS total_places_confirmed,
        COUNT(DISTINCT show_id)::BIGINT AS total_shows
    FROM scoped_reservations;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_stats_kpis(DATE, DATE, UUID[], UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_stats_kpis IS
    'Agrégats KPIs pour la page Statistiques admin : total confirmées, annulées, places, nb spectacles distincts.';

-- ============================================
-- 2) get_shows_stats
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
        SELECT sl.id, sl.show_id
        FROM public.slots sl
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
          AND (p_venue_ids IS NULL OR sl.venue_id = ANY(p_venue_ids))
    ),
    slot_counts AS (
        SELECT show_id, COUNT(*)::BIGINT AS reps
        FROM scoped_slots
        GROUP BY show_id
    ),
    reservation_counts AS (
        SELECT
            sl.show_id,
            COUNT(*) FILTER (WHERE r.status = 'confirmed')::BIGINT AS confirmed,
            COUNT(*) FILTER (WHERE r.status = 'cancelled')::BIGINT AS cancelled,
            COUNT(*) FILTER (
                WHERE r.checkin_status IN ('present_loved', 'present_press', 'present_neutral')
            )::BIGINT AS present,
            COUNT(*) FILTER (WHERE r.checkin_status = 'absent')::BIGINT AS absent,
            COUNT(*) FILTER (WHERE r.checkin_status = 'present_press')::BIGINT AS press
        FROM public.reservations r
        INNER JOIN scoped_slots sl ON sl.id = r.slot_id
        GROUP BY sl.show_id
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
    LEFT JOIN slot_counts sc ON sc.show_id = s.id
    LEFT JOIN reservation_counts rc ON rc.show_id = s.id
    WHERE s.id IN (SELECT DISTINCT show_id FROM scoped_slots);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shows_stats(DATE, DATE, UUID[], UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_shows_stats IS
    'Agrégats par spectacle sur la période : représentations, confirmées, annulées, présents, absents, presse.';

-- ============================================
-- 3) get_venues_stats
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
        SELECT sl.id, sl.venue_id, sl.show_id
        FROM public.slots sl
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
    ),
    slot_counts AS (
        SELECT
            venue_id,
            COUNT(*)::BIGINT AS reps,
            COUNT(DISTINCT show_id)::BIGINT AS shows
        FROM scoped_slots
        GROUP BY venue_id
    ),
    reservation_counts AS (
        SELECT
            sl.venue_id,
            COUNT(*) FILTER (WHERE r.status = 'confirmed')::BIGINT AS confirmed,
            COUNT(*) FILTER (
                WHERE r.checkin_status IN ('present_loved', 'present_press', 'present_neutral')
            )::BIGINT AS present,
            COUNT(*) FILTER (WHERE r.checkin_status = 'absent')::BIGINT AS absent,
            COUNT(*) FILTER (WHERE r.checkin_status = 'present_press')::BIGINT AS press
        FROM public.reservations r
        INNER JOIN scoped_slots sl ON sl.id = r.slot_id
        GROUP BY sl.venue_id
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
    LEFT JOIN slot_counts sc ON sc.venue_id = v.id
    LEFT JOIN reservation_counts rc ON rc.venue_id = v.id
    WHERE v.id IN (SELECT DISTINCT venue_id FROM scoped_slots);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_venues_stats(DATE, DATE, UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_venues_stats IS
    'Agrégats par lieu sur la période : représentations, spectacles distincts, confirmées, présents, absents, presse.';
