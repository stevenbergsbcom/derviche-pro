-- ============================================
-- Migration 015: Create show_target_audience_mapping table
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Table de liaison N-N entre shows et target_audiences
-- Un spectacle peut avoir plusieurs publics cibles
-- Un public cible peut être associé à plusieurs spectacles
CREATE TABLE IF NOT EXISTS public.show_target_audience_mapping (
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  target_audience_id UUID NOT NULL REFERENCES public.target_audiences(id) ON DELETE CASCADE,
  PRIMARY KEY (show_id, target_audience_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_show_target_audience_show ON public.show_target_audience_mapping(show_id);
CREATE INDEX IF NOT EXISTS idx_show_target_audience_audience ON public.show_target_audience_mapping(target_audience_id);

-- Commentaire sur la table
COMMENT ON TABLE public.show_target_audience_mapping IS 'Table de liaison N-N entre spectacles et publics cibles';

-- ============================================
-- RLS (Row Level Security) pour show_target_audience_mapping
-- ============================================

ALTER TABLE public.show_target_audience_mapping ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde peut lire les associations
CREATE POLICY "show_target_audience_mapping_select_all" ON public.show_target_audience_mapping
  FOR SELECT
  USING (true);

-- Insert : admins et super-admins uniquement
CREATE POLICY "show_target_audience_mapping_insert_admin" ON public.show_target_audience_mapping
  FOR INSERT
  WITH CHECK (is_admin_or_super());

-- Delete : admins et super-admins uniquement
CREATE POLICY "show_target_audience_mapping_delete_admin" ON public.show_target_audience_mapping
  FOR DELETE
  USING (is_admin_or_super());

-- Note: Pas de UPDATE car c'est une table de liaison (on supprime et recrée)
