-- ============================================
-- Migration 105: RPCs de détail + chart pour la page Statistiques admin
-- Derviche Diffusion
-- Session: Statistiques Phase 2 (drill-down + chart)
-- ============================================
--
-- Ajoute trois RPCs :
--   1) get_show_detail_stats   → détail des représentations d'un spectacle
--   2) get_venue_detail_stats  → liste des spectacles joués dans un lieu
--   3) get_stats_chart         → série temporelle (bucket par jour/semaine/mois)
--
-- Toutes les fonctions :
--   - SECURITY DEFINER + search_path = public
--   - Vérifient que l'appelant est admin ou super-admin via is_admin_or_super()
--   - Utilisent des alias de colonnes (slot_id, sl_show_id, sl_venue_id)
--     pour éviter les références ambiguës (cf. migration 104).
-- ============================================

-- ============================================
-- 1) get_show_detail_stats
-- ============================================
--
-- Retourne une ligne par représentation (slot) d'un spectacle donné
-- sur la période [p_from, p_to]. Utilisé par le drawer "Détail spectacle".

DROP FUNCTION IF EXISTS public.get_show_detail_stats(UUID, DATE, DATE, UUID[], UUID[]);

CREATE OR REPLACE FUNCTION public.get_show_detail_stats(
    p_show_id UUID,
    p_from DATE,
    p_to DATE,
    p_company_ids UUID[] DEFAULT NULL,
    p_venue_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    slot_id UUID,
    slot_date DATE,
    slot_time TIME,
    venue_name TEXT,
    venue_city TEXT,
    capacity INT,
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

    IF p_show_id IS NULL OR p_from IS NULL OR p_to IS NULL THEN
        RAISE EXCEPTION 'p_show_id, p_from et p_to sont obligatoires';
    END IF;

    RETURN QUERY
    WITH scoped_slots AS (
        SELECT
            sl.id AS slot_id,
            sl.date AS slot_date,
            sl.time AS slot_time,
            sl.venue_id AS sl_venue_id,
            sl.show_id AS sl_show_id
        FROM public.slots sl
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.show_id = p_show_id
          AND sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
          AND (p_venue_ids IS NULL OR sl.venue_id = ANY(p_venue_ids))
    ),
    reservation_counts AS (
        SELECT
            r.slot_id AS rc_slot_id,
            COUNT(*) FILTER (WHERE r.status = 'confirmed')::BIGINT AS confirmed,
            COUNT(*) FILTER (
                WHERE r.checkin_status IN ('present_loved', 'present_press', 'present_neutral')
            )::BIGINT AS present,
            COUNT(*) FILTER (WHERE r.checkin_status = 'absent')::BIGINT AS absent,
            COUNT(*) FILTER (WHERE r.checkin_status = 'present_press')::BIGINT AS press
        FROM public.reservations r
        INNER JOIN scoped_slots ss ON ss.slot_id = r.slot_id
        GROUP BY r.slot_id
    )
    SELECT
        ss.slot_id,
        ss.slot_date,
        ss.slot_time,
        COALESCE(v.name, '')::TEXT AS venue_name,
        COALESCE(v.city, '')::TEXT AS venue_city,
        COALESCE(v.capacity, 0)::INT AS capacity,
        COALESCE(rc.confirmed, 0)::BIGINT AS confirmed_count,
        COALESCE(rc.present, 0)::BIGINT AS present_count,
        COALESCE(rc.absent, 0)::BIGINT AS absent_count,
        COALESCE(rc.press, 0)::BIGINT AS press_count
    FROM scoped_slots ss
    LEFT JOIN public.venues v ON v.id = ss.sl_venue_id
    LEFT JOIN reservation_counts rc ON rc.rc_slot_id = ss.slot_id
    ORDER BY ss.slot_date, ss.slot_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_show_detail_stats(UUID, DATE, DATE, UUID[], UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_show_detail_stats IS
    'Détail des représentations d''un spectacle sur la période : date, lieu, capacité, confirmées, présents, absents, presse.';

-- ============================================
-- 2) get_venue_detail_stats
-- ============================================
--
-- Retourne une ligne par spectacle joué dans un lieu donné sur la période.
-- Utilisé par le drawer "Détail lieu".

DROP FUNCTION IF EXISTS public.get_venue_detail_stats(UUID, DATE, DATE, UUID[]);

CREATE OR REPLACE FUNCTION public.get_venue_detail_stats(
    p_venue_id UUID,
    p_from DATE,
    p_to DATE,
    p_company_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    show_id UUID,
    show_title TEXT,
    show_slug TEXT,
    company_name TEXT,
    representations_count BIGINT,
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

    IF p_venue_id IS NULL OR p_from IS NULL OR p_to IS NULL THEN
        RAISE EXCEPTION 'p_venue_id, p_from et p_to sont obligatoires';
    END IF;

    RETURN QUERY
    WITH scoped_slots AS (
        SELECT
            sl.id AS slot_id,
            sl.show_id AS sl_show_id,
            sl.venue_id AS sl_venue_id
        FROM public.slots sl
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.venue_id = p_venue_id
          AND sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
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
        COALESCE(c.name, '')::TEXT AS company_name,
        COALESCE(sc.reps, 0)::BIGINT AS representations_count,
        COALESCE(rc.confirmed, 0)::BIGINT AS confirmed_count,
        COALESCE(rc.present, 0)::BIGINT AS present_count,
        COALESCE(rc.absent, 0)::BIGINT AS absent_count,
        COALESCE(rc.press, 0)::BIGINT AS press_count
    FROM public.shows s
    LEFT JOIN public.companies c ON c.id = s.company_id
    LEFT JOIN slot_counts sc ON sc.sl_show_id = s.id
    LEFT JOIN reservation_counts rc ON rc.sl_show_id = s.id
    WHERE s.id IN (SELECT DISTINCT ss.sl_show_id FROM scoped_slots ss)
    ORDER BY s.title;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_venue_detail_stats(UUID, DATE, DATE, UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_venue_detail_stats IS
    'Détail des spectacles joués dans un lieu sur la période : représentations, confirmées, présents, absents, presse.';

-- ============================================
-- 3) get_stats_chart
-- ============================================
--
-- Retourne une série temporelle de réservations confirmées, avec tous
-- les buckets entre p_from et p_to (même ceux à 0) via generate_series.
-- La granularité est fournie par l'appelant ('day' | 'week' | 'month').
-- Le bucket_label est pré-formaté en français.

DROP FUNCTION IF EXISTS public.get_stats_chart(DATE, DATE, TEXT, UUID[], UUID[]);

CREATE OR REPLACE FUNCTION public.get_stats_chart(
    p_from DATE,
    p_to DATE,
    p_granularity TEXT,
    p_company_ids UUID[] DEFAULT NULL,
    p_venue_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    bucket_start DATE,
    bucket_label TEXT,
    confirmed_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_interval INTERVAL;
    v_trunc TEXT;
    v_month_names TEXT[] := ARRAY[
        'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
        'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
    ];
    v_month_names_long TEXT[] := ARRAY[
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
BEGIN
    IF NOT public.is_admin_or_super() THEN
        RAISE EXCEPTION 'Accès refusé — admin requis';
    END IF;

    IF p_from IS NULL OR p_to IS NULL THEN
        RAISE EXCEPTION 'p_from et p_to sont obligatoires';
    END IF;

    IF p_granularity NOT IN ('day', 'week', 'month') THEN
        RAISE EXCEPTION 'p_granularity doit être day, week ou month';
    END IF;

    -- Mapping granularité → interval + cible de date_trunc
    IF p_granularity = 'day' THEN
        v_interval := INTERVAL '1 day';
        v_trunc := 'day';
    ELSIF p_granularity = 'week' THEN
        v_interval := INTERVAL '1 week';
        v_trunc := 'week';
    ELSE
        v_interval := INTERVAL '1 month';
        v_trunc := 'month';
    END IF;

    RETURN QUERY
    WITH scoped_reservations AS (
        SELECT
            r.id,
            sl.date AS slot_date
        FROM public.reservations r
        INNER JOIN public.slots sl ON sl.id = r.slot_id
        INNER JOIN public.shows s ON s.id = sl.show_id
        WHERE sl.date >= p_from
          AND sl.date <= p_to
          AND s.deleted_at IS NULL
          AND r.status = 'confirmed'
          AND (p_company_ids IS NULL OR s.company_id = ANY(p_company_ids))
          AND (p_venue_ids IS NULL OR sl.venue_id = ANY(p_venue_ids))
    ),
    bucketed AS (
        SELECT
            date_trunc(v_trunc, sr.slot_date)::DATE AS b_start,
            COUNT(*)::BIGINT AS cnt
        FROM scoped_reservations sr
        GROUP BY 1
    ),
    all_buckets AS (
        SELECT generate_series(
            date_trunc(v_trunc, p_from),
            date_trunc(v_trunc, p_to),
            v_interval
        )::DATE AS b_start
    )
    SELECT
        ab.b_start AS bucket_start,
        CASE
            WHEN p_granularity = 'day' THEN
                EXTRACT(DAY FROM ab.b_start)::TEXT
                || ' '
                || v_month_names[EXTRACT(MONTH FROM ab.b_start)::INT]
            WHEN p_granularity = 'week' THEN
                'Sem. ' || LPAD(EXTRACT(WEEK FROM ab.b_start)::TEXT, 2, '0')
            ELSE
                v_month_names_long[EXTRACT(MONTH FROM ab.b_start)::INT]
                || ' '
                || EXTRACT(YEAR FROM ab.b_start)::TEXT
        END AS bucket_label,
        COALESCE(b.cnt, 0)::BIGINT AS confirmed_count
    FROM all_buckets ab
    LEFT JOIN bucketed b ON b.b_start = ab.b_start
    ORDER BY ab.b_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_stats_chart(DATE, DATE, TEXT, UUID[], UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_stats_chart IS
    'Série temporelle des réservations confirmées par bucket (jour/semaine/mois). Inclut les buckets à 0.';
