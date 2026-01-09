-- ============================================
-- MIGRATION 016 : Rendre address et postal_code facultatifs dans venues
-- Derviche Diffusion - Plateforme de réservation
-- ============================================
-- Contexte : L'adresse complète et le code postal ne sont pas toujours
-- disponibles lors de la création d'un lieu. Seuls nom et ville sont requis.
-- ============================================

-- Supprimer la contrainte NOT NULL sur address
ALTER TABLE public.venues 
  ALTER COLUMN address DROP NOT NULL;

-- Supprimer la contrainte NOT NULL sur postal_code
ALTER TABLE public.venues 
  ALTER COLUMN postal_code DROP NOT NULL;

-- Commentaire mis à jour
COMMENT ON COLUMN public.venues.address IS 'Adresse du lieu (facultatif)';
COMMENT ON COLUMN public.venues.postal_code IS 'Code postal du lieu (facultatif)';
