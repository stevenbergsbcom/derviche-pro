-- ============================================
-- MIGRATION 077 : RPCs historique d'un professionnel
-- Derviche Diffusion
--
-- Deux fonctions :
--   1. get_professional_reservation_history → page admin /admin/professionnels/[id]
--      Retourne TOUTES les réservations (tous statuts)
--      Colonnes : spectacle, date, statut résa, statut checkin
--
--   2. get_professional_recent_reservations → PWA /accueil CheckinDrawer
--      Retourne les 20 dernières réservations
--      Mêmes colonnes (sans infos confidentielles)
--
-- Sécurité :
--   - SECURITY DEFINER pour bypasser RLS (admin uniquement côté API)
--   - search_path fixé à public
--   - Accès accordé uniquement au service_role (appelé côté serveur)
-- ============================================

-- ============================================
-- FONCTION 1 : Historique complet (admin)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_professional_reservation_history(
  p_user_id UUID
)
RETURNS TABLE (
  reservation_id    UUID,
  show_title        TEXT,
  slot_date         DATE,
  slot_time         TIME,
  reservation_status TEXT,
  checkin_status    TEXT,
  num_places        INTEGER,
  created_at        TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id                  AS reservation_id,
    s.title               AS show_title,
    sl.date               AS slot_date,
    sl.time               AS slot_time,
    r.status              AS reservation_status,
    r.checkin_status      AS checkin_status,
    r.num_places          AS num_places,
    r.created_at          AS created_at
  FROM reservations r
  INNER JOIN slots sl ON sl.id = r.slot_id
  INNER JOIN shows  s  ON s.id  = sl.show_id
  WHERE r.user_id = p_user_id
  ORDER BY sl.date DESC, sl.time DESC;
$$;

-- Accès réservé au service_role (appelé depuis API Next.js côté serveur)
REVOKE ALL ON FUNCTION public.get_professional_reservation_history(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_professional_reservation_history(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_professional_reservation_history(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_professional_reservation_history(UUID) TO service_role;

COMMENT ON FUNCTION public.get_professional_reservation_history IS
  'Historique complet des réservations d''un professionnel — usage admin uniquement (service_role)';

-- ============================================
-- FONCTION 2 : 20 dernières réservations (PWA)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_professional_recent_reservations(
  p_user_id UUID
)
RETURNS TABLE (
  reservation_id    UUID,
  show_title        TEXT,
  slot_date         DATE,
  slot_time         TIME,
  reservation_status TEXT,
  checkin_status    TEXT,
  num_places        INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id                  AS reservation_id,
    s.title               AS show_title,
    sl.date               AS slot_date,
    sl.time               AS slot_time,
    r.status              AS reservation_status,
    r.checkin_status      AS checkin_status,
    r.num_places          AS num_places
  FROM reservations r
  INNER JOIN slots sl ON sl.id = r.slot_id
  INNER JOIN shows  s  ON s.id  = sl.show_id
  WHERE r.user_id = p_user_id
  ORDER BY sl.date DESC, sl.time DESC
  LIMIT 20;
$$;

-- Accès service_role uniquement (appelé depuis API Next.js)
REVOKE ALL ON FUNCTION public.get_professional_recent_reservations(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_professional_recent_reservations(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_professional_recent_reservations(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_professional_recent_reservations(UUID) TO service_role;

COMMENT ON FUNCTION public.get_professional_recent_reservations IS
  '20 dernières réservations d''un professionnel — usage PWA accueil (service_role)';
