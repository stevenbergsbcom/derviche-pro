-- ============================================
-- Migration 108 : Toggle CTA dervichediffusion.com sur email_templates
-- Derviche Diffusion
-- ============================================
-- Ajoute 2 colonnes sur email_templates pour router dynamiquement le CTA
-- principal de chaque template vers la page marketing externe du spectacle
-- (shows.derviche_site_url, cf. migration 107) au lieu de la fiche publique
-- interne /spectacle/[slug].
--
-- Comportement final dans le builder email :
--   • show_derviche_site_link=false             → CTA = /spectacle/[slug] (comportement historique)
--   • show_derviche_site_link=true + URL vide   → fallback /spectacle/[slug]
--   • show_derviche_site_link=true + URL valide → CTA = derviche_site_url
--
-- Défaut false pour ne modifier aucun comportement d'email existant.
-- ============================================

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS show_derviche_site_link BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS derviche_site_link_text TEXT    NOT NULL DEFAULT 'Découvrir le spectacle';

COMMENT ON COLUMN public.email_templates.show_derviche_site_link
  IS 'Si true et shows.derviche_site_url renseigné, le CTA principal du template pointe vers cette URL au lieu de la fiche publique interne.';
COMMENT ON COLUMN public.email_templates.derviche_site_link_text
  IS 'Libellé du CTA principal quand show_derviche_site_link est actif et URL présente. Remplace cta_text dans ce cas.';
