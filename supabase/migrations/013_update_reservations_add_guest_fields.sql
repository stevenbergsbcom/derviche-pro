-- ============================================
-- Migration 013: Update reservations - Add guest fields
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Ajout des champs secondaires pour les guests (invités non connectés)
-- Ces champs sont optionnels et concernent uniquement les réservations
-- faites par des guests. Les utilisateurs connectés ont ces infos dans profiles.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS guest_email_secondary TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone_secondary TEXT,
  ADD COLUMN IF NOT EXISTS guest_address TEXT,
  ADD COLUMN IF NOT EXISTS guest_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS guest_city TEXT;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.reservations.guest_email_secondary IS 'Email secondaire du guest (optionnel, uniquement pour les non-connectés)';
COMMENT ON COLUMN public.reservations.guest_phone_secondary IS 'Téléphone secondaire du guest (optionnel, uniquement pour les non-connectés)';
COMMENT ON COLUMN public.reservations.guest_address IS 'Adresse du guest (optionnel, uniquement pour les non-connectés)';
COMMENT ON COLUMN public.reservations.guest_postal_code IS 'Code postal du guest (optionnel, uniquement pour les non-connectés)';
COMMENT ON COLUMN public.reservations.guest_city IS 'Ville du guest (optionnel, uniquement pour les non-connectés)';
