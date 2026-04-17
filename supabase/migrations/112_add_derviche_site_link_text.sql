-- Migration 112 — Libellé éditable pour le lien dervichediffusion.com
-- Derviche Diffusion — S186
--
-- Réintroduit la colonne `derviche_site_link_text` supprimée par la
-- migration 109 : elle est désormais utilisée par les 4 templates post-checkin
-- (style sobre) pour afficher un lien optionnel vers la page marketing
-- avec un libellé personnalisable par template.
--
-- Pour les autres templates (confirmation, modification, rappels J-7/J-2/H-4),
-- la colonne existe mais n'est pas consommée : le libellé du bouton y reste
-- `cta_text` (comportement inchangé).

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS derviche_site_link_text TEXT NOT NULL
    DEFAULT 'Voir la fiche spectacle sur dervichediffusion.com';

COMMENT ON COLUMN public.email_templates.derviche_site_link_text
  IS 'Libellé du lien vers dervichediffusion.com dans les templates post-checkin (style sobre). Non utilisé par les templates qui routent leur CTA principal via show_derviche_site_link (libellé = cta_text).';
