-- ============================================
-- Migration 009: Update venues - Add fields
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Ajout des nouveaux champs à la table venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS pmr_accessible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transports TEXT;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.venues.capacity IS 'Capacité maximale de la salle';
COMMENT ON COLUMN public.venues.pmr_accessible IS 'Accessibilité PMR (Personnes à Mobilité Réduite)';
COMMENT ON COLUMN public.venues.parking IS 'Parking disponible à proximité';
COMMENT ON COLUMN public.venues.transports IS 'Informations sur les transports en commun';
