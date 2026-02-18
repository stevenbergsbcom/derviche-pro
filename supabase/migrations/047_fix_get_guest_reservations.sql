-- ============================================
-- Migration 047: Correction get_guest_reservations — ambiguïté colonne "id"
-- Derviche Diffusion
-- Date: 2026-02-18
--
-- Correctif de la migration 046 :
-- La colonne de retour nommée "id" créait une ambiguïté SQL avec les colonnes "id"
-- des tables jointes (reservations, slots, shows, venues).
-- Solution : renommer la colonne de retour en "reservation_id".
--
-- DROP obligatoire : PostgreSQL interdit CREATE OR REPLACE quand le type de retour change.
-- ============================================

DROP FUNCTION IF EXISTS public.get_guest_reservations(TEXT);

CREATE OR REPLACE FUNCTION public.get_guest_reservations(
  p_email TEXT
)
RETURNS TABLE (
  reservation_id UUID,
  show_title     TEXT,
  slot_date      TEXT,
  slot_time      TEXT,
  venue_name     TEXT,
  num_places     INTEGER,
  status         TEXT,
  created_at     TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est bien authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  -- Vérifier que l'email correspond bien à l'utilisateur connecté
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND LOWER(email) = LOWER(TRIM(p_email))
  ) THEN
    RAISE EXCEPTION 'L''email ne correspond pas à l''utilisateur connecté';
  END IF;

  RETURN QUERY
  SELECT
    r.id                         AS reservation_id,
    sh.title                     AS show_title,
    sl.date::TEXT                AS slot_date,
    sl.time::TEXT                AS slot_time,
    v.name                       AS venue_name,
    r.num_places,
    r.status,
    r.created_at
  FROM public.reservations r
  JOIN public.slots sl ON sl.id = r.slot_id
  JOIN public.shows sh ON sh.id = sl.show_id
  LEFT JOIN public.venues v ON v.id = sl.venue_id
  WHERE LOWER(r.guest_email) = LOWER(TRIM(p_email))
    AND r.user_id IS NULL
    AND r.status NOT IN ('cancelled', 'no_show')
  ORDER BY sl.date ASC, sl.time ASC;
END;
$$;

COMMENT ON FUNCTION public.get_guest_reservations IS
  'Retourne les réservations guest orphelines (user_id IS NULL) associées à un email. Colonne de retour renommée reservation_id pour éviter l''ambiguïté SQL avec les colonnes id des tables jointes.';

GRANT EXECUTE ON FUNCTION public.get_guest_reservations(TEXT) TO authenticated;
