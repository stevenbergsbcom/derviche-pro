-- Migration 111 — Classement éditorial des spectacles
-- Derviche Diffusion — S186
--
-- Ajoute deux colonnes à `shows` pour piloter depuis l'onglet
-- /admin/preferences?tab=classement :
--   • is_featured   : sélection pour le slider hero de la page d'accueil
--   • display_order : ordre global d'affichage (catalogue + carousel homepage
--                     + ordre des vedettes)
--
-- Tie-break systématique par `title` quand display_order est NULL ou
-- partagé entre plusieurs shows.

ALTER TABLE public.shows
  ADD COLUMN IF NOT EXISTS is_featured   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Index partiel pour la récupération rapide des vedettes (petite liste).
CREATE INDEX IF NOT EXISTS idx_shows_is_featured
  ON public.shows(display_order, title)
  WHERE is_featured = true AND deleted_at IS NULL;

-- Index pour le tri catalogue public (ORDER BY display_order NULLS LAST, title).
CREATE INDEX IF NOT EXISTS idx_shows_display_order
  ON public.shows(display_order NULLS LAST, title)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.shows.is_featured
  IS 'Si true, le spectacle est affiché dans le slider hero de la page d''accueil. Piloté depuis /admin/preferences?tab=classement (zone "En vedette").';
COMMENT ON COLUMN public.shows.display_order
  IS 'Ordre d''affichage éditorial. NULL = fin de liste (tie-break par title). Pas de contrainte d''unicité : plusieurs shows peuvent partager un rang. Piloté depuis /admin/preferences?tab=classement.';
