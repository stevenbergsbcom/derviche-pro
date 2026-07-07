-- ============================================
-- Migration 127: RPC get_admin_unread_count — badge notifications 1 round-trip
-- Derviche Diffusion
-- Date: 2026-07-07
-- ============================================
-- CONTEXTE (optimisation Fluid CPU Vercel) :
-- Le badge de notifications admin est rafraîchi en boucle (polling). L'ancien
-- chemin appelait getAdminNotifications(1, 1) qui déclenchait ~4 allers-retours
-- DB (dismissed_at + requête liste avec count exact + 1 ligne jetée + count
-- total + count lus) juste pour obtenir UN entier. Multiplié par le nombre
-- d'admins connectés × la fréquence du polling, c'était le poste n°1 de
-- consommation Fluid Active CPU.
--
-- SOLUTION :
-- Une RPC qui calcule le nombre de non-lus en UN SEUL aller-retour, via un
-- anti-join (NOT EXISTS) : compte les notifications visibles (postérieures au
-- dismissed_at de l'admin) que l'admin courant n'a pas encore lues.
--
-- SÉCURITÉ :
-- - SECURITY DEFINER : bypass RLS pour compter efficacement, MAIS on scope
--   explicitement les lectures (reads) + le dismissed_at à auth.uid().
-- - Réservé aux rôles admin/super-admin (is_admin_or_super).
-- - GRANT EXECUTE aux authentifiés uniquement.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_admin_unread_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_id UUID;
  v_dismissed_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Réservé aux admins (mêmes rôles que les RLS des tables notifs)
  IF NOT public.is_admin_or_super() THEN
    RETURN 0;
  END IF;

  -- dismissed_at de l'admin courant (NULL s'il n'a jamais « Vidé »)
  SELECT dismissed_at INTO v_dismissed_at
  FROM public.admin_notification_dismissals
  WHERE user_id = v_user_id;

  -- Non-lus = notifications visibles (après dismissed_at) sans read de cet admin
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.admin_notifications n
  WHERE (v_dismissed_at IS NULL OR n.created_at > v_dismissed_at)
    AND NOT EXISTS (
      SELECT 1
      FROM public.admin_notification_reads r
      WHERE r.notification_id = n.id
        AND r.user_id = v_user_id
    );

  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON FUNCTION public.get_admin_unread_count IS
  'Nombre de notifications admin non lues par l''utilisateur courant, en un '
  'seul aller-retour (anti-join). Tient compte du dismissed_at. Réservé '
  'admin/super-admin. Utilisé par le polling léger du badge (optim Fluid CPU).';

GRANT EXECUTE ON FUNCTION public.get_admin_unread_count TO authenticated;
