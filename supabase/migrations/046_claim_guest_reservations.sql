-- ============================================
-- Migration 046: Rapatriement des réservations guest
-- Derviche Diffusion
-- Date: 2026-02-18
--
-- Quand un professionnel a réservé en tant que guest (user_id IS NULL)
-- avant de créer son compte, ses réservations n'apparaissent pas dans
-- son dashboard. Ces deux fonctions permettent :
--   1. de lister les réservations guest orphelines associées à son email
--   2. de les rapatrier sélectivement (l'utilisateur choisit lesquelles)
-- ============================================

-- ============================================
-- FONCTION 1 : get_guest_reservations
-- Retourne les réservations guest orphelines pour un email donné
-- ============================================
CREATE OR REPLACE FUNCTION public.get_guest_reservations(
  p_email TEXT
)
RETURNS TABLE (
  id             UUID,
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
    r.id,
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
  'Retourne les réservations guest orphelines (user_id IS NULL) associées à un email. Vérifie que l''email correspond à l''utilisateur authentifié pour éviter tout accès non autorisé.';

-- ============================================
-- FONCTION 2 : claim_selected_reservations
-- Rapatrie les réservations guest sélectionnées vers le compte connecté
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_selected_reservations(
  p_user_id        UUID,
  p_email          TEXT,
  p_reservation_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier que l'utilisateur est bien authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  -- Vérifier que p_user_id correspond à l'utilisateur connecté
  -- (empêche un utilisateur de réclamer des réservations pour un autre compte)
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Opération non autorisée';
  END IF;

  -- Vérifier que l'email correspond bien à l'utilisateur connecté
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND LOWER(email) = LOWER(TRIM(p_email))
  ) THEN
    RAISE EXCEPTION 'L''email ne correspond pas à l''utilisateur connecté';
  END IF;

  -- Vérifier qu'une liste d'IDs est fournie
  IF p_reservation_ids IS NULL OR array_length(p_reservation_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Rapatriement : mise à jour user_id uniquement
  -- guest_email est conservé intentionnellement (historique/audit)
  UPDATE public.reservations
  SET user_id = p_user_id
  WHERE id = ANY(p_reservation_ids)
    AND LOWER(guest_email) = LOWER(TRIM(p_email))   -- double sécurité : email doit correspondre
    AND user_id IS NULL                               -- ne jamais écraser un user_id existant
    AND status NOT IN ('cancelled', 'no_show');

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.claim_selected_reservations IS
  'Rapatrie une sélection de réservations guest vers le compte de l''utilisateur connecté. Met à jour user_id, conserve guest_email pour audit. Double vérification email + user_id IS NULL pour éviter tout écrasement non autorisé.';

-- ============================================
-- GRANTS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_guest_reservations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_selected_reservations(UUID, TEXT, UUID[]) TO authenticated;
