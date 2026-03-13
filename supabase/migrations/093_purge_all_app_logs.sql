-- ============================================
-- Migration 093 : RPC purge_all_app_logs
-- Derviche Diffusion — Derviche Pro
--
-- Hard delete de tous les logs dans app_logs.
-- Accès : super-admin uniquement (vérifié dans la fonction).
-- ============================================

CREATE OR REPLACE FUNCTION public.purge_all_app_logs()
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

  -- Comptage avant suppression
  SELECT COUNT(*) INTO v_count FROM public.app_logs;

  -- Hard delete (WHERE true requis par pg_safeupdate)
  DELETE FROM public.app_logs WHERE true;

  RETURN json_build_object(
    'success', true,
    'deleted', v_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_all_app_logs() TO authenticated;

COMMENT ON FUNCTION public.purge_all_app_logs IS
  'Hard delete de tous les logs système (app_logs). Super-admin uniquement.';
