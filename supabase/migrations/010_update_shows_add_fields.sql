-- ============================================
-- Migration 010: Update shows - Add fields
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Ajout des nouveaux champs à la table shows
ALTER TABLE public.shows
  ADD COLUMN IF NOT EXISTS period TEXT,
  ADD COLUMN IF NOT EXISTS derviche_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invitation_policy TEXT,
  ADD COLUMN IF NOT EXISTS closure_dates TEXT,
  ADD COLUMN IF NOT EXISTS folder_url TEXT,
  ADD COLUMN IF NOT EXISTS teaser_url TEXT,
  ADD COLUMN IF NOT EXISTS captation_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS captation_url TEXT;

-- Index pour le responsable Derviche (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_shows_derviche_manager ON public.shows(derviche_manager_id);

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.shows.period IS 'Période de programmation (ex: Automne 2025, Été 2026)';
COMMENT ON COLUMN public.shows.derviche_manager_id IS 'Responsable Derviche du spectacle (FK vers profiles)';
COMMENT ON COLUMN public.shows.invitation_policy IS 'Politique d''invitation et de détaxe';
COMMENT ON COLUMN public.shows.closure_dates IS 'Dates de relâche du spectacle';
COMMENT ON COLUMN public.shows.folder_url IS 'URL du dossier de presse (Google Drive, Dropbox, etc.)';
COMMENT ON COLUMN public.shows.teaser_url IS 'URL du teaser vidéo';
COMMENT ON COLUMN public.shows.captation_available IS 'Indique si une captation vidéo est disponible';
COMMENT ON COLUMN public.shows.captation_url IS 'URL de la captation vidéo (si disponible)';
