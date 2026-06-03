-- ============================================
-- Migration 120 : Suppression de venues.crm_id
-- Derviche Diffusion — correction malentendu CRM "lieu"
-- ============================================
-- L'ID CRM "lieu" (migration 117) résultait d'une erreur de compréhension :
-- il ne concernait pas les salles (venues) mais la structure pour laquelle
-- travaille le professionnel. Cette information est déplacée vers
-- profiles.crm_structure_id + reservations.crm_structure_id (Session B).
-- On supprime donc proprement la colonne et son index unique partiel.
-- Perte de données assumée (champ récent issu du malentendu).
-- ============================================

DROP INDEX IF EXISTS venues_crm_id_unique;

ALTER TABLE public.venues
  DROP COLUMN IF EXISTS crm_id;
