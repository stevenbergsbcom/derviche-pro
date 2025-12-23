-- ============================================
-- Migration 014: Create target_audiences table
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Table des publics cibles (structure identique à show_categories pour cohérence)
CREATE TABLE IF NOT EXISTS public.target_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour l'ordre d'affichage
CREATE INDEX IF NOT EXISTS idx_target_audiences_display_order ON public.target_audiences(display_order);

-- Trigger pour mettre à jour updated_at automatiquement
-- Note: On réutilise la fonction update_updated_at_column() créée dans les migrations précédentes
CREATE TRIGGER update_target_audiences_updated_at
  BEFORE UPDATE ON public.target_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données initiales
INSERT INTO public.target_audiences (name, slug, display_order) VALUES
  ('Tout public', 'tout-public', 1),
  ('Adultes', 'adultes', 2),
  ('Jeune public', 'jeune-public', 3),
  ('Famille', 'famille', 4)
ON CONFLICT (name) DO NOTHING;

-- Commentaire sur la table
COMMENT ON TABLE public.target_audiences IS 'Publics cibles des spectacles (relation N-N avec shows via show_target_audience_mapping)';

-- ============================================
-- RLS (Row Level Security) pour target_audiences
-- ============================================

ALTER TABLE public.target_audiences ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde peut lire les publics cibles
CREATE POLICY "target_audiences_select_all" ON public.target_audiences
  FOR SELECT
  USING (true);

-- Insert : admins et super-admins uniquement
CREATE POLICY "target_audiences_insert_admin" ON public.target_audiences
  FOR INSERT
  WITH CHECK (is_admin_or_super());

-- Update : admins et super-admins uniquement
CREATE POLICY "target_audiences_update_admin" ON public.target_audiences
  FOR UPDATE
  USING (is_admin_or_super())
  WITH CHECK (is_admin_or_super());

-- Delete : super-admins uniquement
CREATE POLICY "target_audiences_delete_super_admin" ON public.target_audiences
  FOR DELETE
  USING (is_super_admin());
