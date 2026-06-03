-- ============================================
-- Migration 122 : Ajout reservations.crm_structure_id
-- Derviche Diffusion — structure CRM (réservations guest)
-- ============================================
-- Pendant de reservations.crm_id (migration 119) pour la structure.
-- Utilisé uniquement pour les réservations sans compte (user_id IS NULL) ;
-- pour les résas avec compte, lire profiles.crm_structure_id via jointure.
--   • Type TEXT, aucune contrainte d'unicité.
-- ============================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS crm_structure_id TEXT;

COMMENT ON COLUMN public.reservations.crm_structure_id
  IS 'Identifiant CRM Zoho de la structure du pro, pour les réservations guest (user_id IS NULL). Pas d''unicité. Pour les résas avec compte, lire profiles.crm_structure_id via jointure.';
