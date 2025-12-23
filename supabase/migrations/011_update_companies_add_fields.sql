-- ============================================
-- Migration 011: Update companies - Add fields
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Ajout des nouveaux champs à la table companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.companies.city IS 'Ville du siège de la compagnie';
COMMENT ON COLUMN public.companies.contact_name IS 'Nom du contact principal de la compagnie';
