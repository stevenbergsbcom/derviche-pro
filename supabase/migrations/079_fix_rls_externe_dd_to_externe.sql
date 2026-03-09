-- ============================================
-- MIGRATION 079 : Correction policies RLS externe-dd → externe (complément)
-- Derviche Diffusion
--
-- Contexte :
-- - Migration 038 : renommage du rôle 'externe-dd' → 'externe'
-- - Migration 039 : a corrigé les policies reservations uniquement
-- - Migration 040 : a changé externe_has_access_to_show pour utiliser
--                   slots.hosted_by_id au lieu de user_show_assignments
--
-- Ce fichier corrige les policies restantes non traitées par 039 :
--   - user_show_assignments (lecture par l'externe)
--   - profiles (select + update)
--   - shows (select)
--   - slots (select)
-- ============================================

-- ============================================
-- USER_SHOW_ASSIGNMENTS
-- ============================================

DROP POLICY IF EXISTS "user_show_assignments_select_own" ON public.user_show_assignments;

CREATE POLICY "user_show_assignments_select_own"
  ON public.user_show_assignments FOR SELECT
  TO authenticated
  USING (public.has_role('externe') AND user_id = auth.uid());

-- ============================================
-- PROFILES
-- ============================================

DROP POLICY IF EXISTS "profiles_select_externe_dd" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_externe_dd" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_externe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_externe" ON public.profiles;

CREATE POLICY "profiles_select_externe"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role('externe') AND deleted_at IS NULL);

CREATE POLICY "profiles_update_externe"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role('externe') AND deleted_at IS NULL);

-- ============================================
-- SHOWS
-- ============================================

DROP POLICY IF EXISTS "shows_select_externe_dd" ON public.shows;
DROP POLICY IF EXISTS "shows_select_externe" ON public.shows;

CREATE POLICY "shows_select_externe"
  ON public.shows FOR SELECT
  TO authenticated
  USING (
    public.has_role('externe')
    AND public.externe_has_access_to_show(id)
    AND deleted_at IS NULL
  );

-- ============================================
-- SLOTS
-- ============================================

DROP POLICY IF EXISTS "slots_select_externe_dd" ON public.slots;
DROP POLICY IF EXISTS "slots_select_externe" ON public.slots;

CREATE POLICY "slots_select_externe"
  ON public.slots FOR SELECT
  TO authenticated
  USING (
    public.has_role('externe')
    AND public.externe_has_access_to_show(show_id)
  );
