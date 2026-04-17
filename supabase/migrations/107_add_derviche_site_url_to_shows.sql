-- ============================================
-- Migration 107 : Ajout lien page dervichediffusion.com sur shows
-- Derviche Diffusion
-- ============================================
-- Ajoute la colonne derviche_site_url sur la table shows.
-- URL de la page marketing du spectacle sur le site vitrine externe
-- (https://dervichediffusion.com/spectacles/...).
-- Usage :
--   • Saisie dans le formulaire admin spectacle
--   • Affichée en lecture dans la vue admin spectacle
--   • Bouton « Découvrir le spectacle » sur la fiche publique /spectacle/[slug]
--   • CTA principal des emails de confirmation (selon toggle par template — voir migration 108)
-- ============================================

ALTER TABLE public.shows
  ADD COLUMN IF NOT EXISTS derviche_site_url TEXT;

COMMENT ON COLUMN public.shows.derviche_site_url
  IS 'URL de la page marketing du spectacle sur dervichediffusion.com (site vitrine externe). Optionnelle.';
