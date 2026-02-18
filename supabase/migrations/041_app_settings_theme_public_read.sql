-- ============================================
-- MIGRATION 041 : Lecture publique des settings de thème
-- Derviche Diffusion
-- ============================================
-- Problème : Les utilisateurs professionnels et compagnies ne pouvaient
-- pas lire les app_settings (RLS bloquait). La sidebar affichait donc
-- le logo sombre sur fond sombre (invisible).
-- Solution : Autoriser tous les utilisateurs authentifiés à lire les
-- paramètres de thème/apparence (données non sensibles).
-- ============================================

-- Politique de lecture pour tous les utilisateurs authentifiés
-- Limité aux clés de thème et d'organisation (non sensibles)
CREATE POLICY "app_settings_select_theme_authenticated"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (
    key IN (
      'theme_preset',
      'logo_white_url',
      'logo_dark_url',
      'organization_name',
      'organization_logo_url'
    )
  );
