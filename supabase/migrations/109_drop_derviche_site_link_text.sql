-- ============================================
-- Migration 109 : Simplification du toggle CTA dervichediffusion.com
-- Derviche Diffusion
-- ============================================
-- Retire la colonne email_templates.derviche_site_link_text ajoutée par la
-- migration 108. Le bouton reste le même (cta_text fait office de libellé
-- unique) ; seul l'URL change selon show_derviche_site_link.
-- L'admin adapte manuellement cta_text au contexte (ex. « Découvrir le
-- spectacle ») quand le toggle est activé.
-- ============================================

ALTER TABLE public.email_templates
  DROP COLUMN IF EXISTS derviche_site_link_text;

COMMENT ON COLUMN public.email_templates.show_derviche_site_link
  IS 'Si true et shows.derviche_site_url renseigné, le CTA principal pointe vers cette URL externe au lieu de la fiche publique interne. Le libellé reste cta_text.';
