-- ============================================
-- MIGRATION 087 : Lecture publique des paramètres footer et organisation
-- Derviche Diffusion
-- ============================================
-- Problème : Le footer est affiché sur toutes les pages publiques (catalogue,
-- spectacle, confirmation) mais les données homepage_footer et organization_*
-- ne sont lisibles que par les admin (RLS). Le footer côté client ne pouvait
-- donc pas charger les données depuis app_settings pour les visiteurs anonymes
-- et les utilisateurs non-admin.
-- Solution : Autoriser la lecture publique (anon + authenticated) des clés
-- non sensibles affichées dans le footer.
-- ============================================

-- Lecture publique (anon) des paramètres footer et organisation
-- Ces données sont non sensibles : elles sont affichées publiquement sur le site
CREATE POLICY "app_settings_select_public_footer"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (
    key IN (
      'homepage_footer',
      'organization_name',
      'organization_contact_email',
      'organization_contact_phone',
      'organization_address',
      'organization_website'
    )
  );
