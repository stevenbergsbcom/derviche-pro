-- ============================================
-- Migration 081 : RPCs de maintenance
-- Derviche Diffusion — Derviche Pro
--
-- 1. purge_old_notifications(days_old INT)
--    Hard delete des notifications admin > N jours
--
-- 2. reset_data(options JSONB)
--    Remise à zéro des données transactionnelles
--    (réservations, notifications, emails, profils, spectacles)
--
-- Accès : super-admin uniquement (vérifié dans la fonction)
-- ============================================

-- ============================================
-- 1. PURGE DES NOTIFICATIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.purge_old_notifications(days_old INT DEFAULT 90)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_user_role TEXT;
  v_count     INT;
  v_cutoff    TIMESTAMPTZ;
BEGIN
  -- Vérification super-admin
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id AND role = 'super-admin'
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Accès refusé — super-admin requis');
  END IF;

  -- Calcul de la date limite
  v_cutoff := NOW() - (days_old || ' days')::INTERVAL;

  -- Comptage avant suppression
  SELECT COUNT(*) INTO v_count
  FROM public.admin_notifications
  WHERE created_at < v_cutoff;

  -- Hard delete
  DELETE FROM public.admin_notifications
  WHERE created_at < v_cutoff;

  RETURN json_build_object(
    'success', true,
    'deleted', v_count,
    'cutoff',  v_cutoff
  );
END;
$$;

-- Donne accès aux utilisateurs authentifiés (la fonction vérifie le rôle elle-même)
GRANT EXECUTE ON FUNCTION public.purge_old_notifications(INT) TO authenticated;

COMMENT ON FUNCTION public.purge_old_notifications IS
  'Hard delete des notifications admin plus anciennes que N jours (défaut 90). Super-admin uniquement.';


-- ============================================
-- 2. COMPTE DES NOTIFICATIONS PURGABLES
-- ============================================

CREATE OR REPLACE FUNCTION public.count_old_notifications(days_old INT DEFAULT 90)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_user_role TEXT;
  v_count     INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id AND role = 'super-admin'
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Accès refusé — super-admin requis');
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.admin_notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;

  RETURN json_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_old_notifications(INT) TO authenticated;

COMMENT ON FUNCTION public.count_old_notifications IS
  'Compte les notifications admin plus anciennes que N jours (défaut 90). Super-admin uniquement.';


-- ============================================
-- 3. RESET DES DONNÉES
-- ============================================

CREATE OR REPLACE FUNCTION public.reset_data(options JSONB DEFAULT '{}')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID;
  v_user_role      TEXT;
  v_del_profiles   BOOLEAN;
  v_del_shows      BOOLEAN;
  v_counts         JSONB := '{}';
  v_count          INT;
BEGIN
  -- Vérification super-admin
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id AND role = 'super-admin'
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Accès refusé — super-admin requis');
  END IF;

  -- Options
  v_del_profiles := COALESCE((options->>'profiles')::BOOLEAN, false);
  v_del_shows    := COALESCE((options->>'showsAndSlots')::BOOLEAN, false);

  -- ── 1. checkin_followup_emails ──────────────────────────────────────────
  DELETE FROM public.checkin_followup_emails;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('checkin_followup_emails', v_count);

  -- ── 2. sent_notifications ───────────────────────────────────────────────
  DELETE FROM public.sent_notifications;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('sent_notifications', v_count);

  -- ── 3. admin_notification_reads + admin_notification_dismissals ─────────
  DELETE FROM public.admin_notification_reads;
  DELETE FROM public.admin_notification_dismissals;

  -- ── 4. admin_notifications ──────────────────────────────────────────────
  DELETE FROM public.admin_notifications;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('admin_notifications', v_count);

  -- ── 5. reservations (CASCADE libère remaining_capacity via trigger) ──────
  DELETE FROM public.reservations;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('reservations', v_count);

  -- ── 6. Profils pro & compagnies (optionnel) ──────────────────────────────
  IF v_del_profiles THEN
    -- Supprimer uniquement les rôles professional et company
    -- Les super-admin, admin, externe ne sont PAS touchés
    DELETE FROM public.user_roles
    WHERE role IN ('professional', 'company')
    AND user_id IN (
      SELECT id FROM public.profiles
      WHERE id NOT IN (
        SELECT user_id FROM public.user_roles
        WHERE role IN ('super-admin', 'admin', 'externe')
      )
    );

    DELETE FROM public.profiles
    WHERE id NOT IN (
      SELECT user_id FROM public.user_roles
      WHERE role IN ('super-admin', 'admin', 'externe')
    );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_counts := v_counts || jsonb_build_object('profiles', v_count);
  END IF;

  -- ── 7. Spectacles, créneaux & lieux (optionnel) ──────────────────────────
  IF v_del_shows THEN
    -- Les slots sont supprimés en CASCADE par shows (ON DELETE CASCADE)
    DELETE FROM public.shows;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_counts := v_counts || jsonb_build_object('shows', v_count);

    DELETE FROM public.venues;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_counts := v_counts || jsonb_build_object('venues', v_count);
  END IF;

  RETURN json_build_object(
    'success', true,
    'deleted', v_counts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_data(JSONB) TO authenticated;

COMMENT ON FUNCTION public.reset_data IS
  'Remise à zéro des données transactionnelles. Options: profiles, showsAndSlots. Super-admin uniquement. NE supprime PAS les comptes super-admin/admin/externe.';
