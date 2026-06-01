-- ============================================
-- Migration 118 : Ajout ID CRM (Zoho) sur les profils (pros)
-- Derviche Diffusion — S174
-- ============================================
-- Pendant du lieu (migration 117) côté professionnels :
-- chaque contact dans le CRM Zoho du client possède un ID unique
-- (~17 chiffres) qu'on stocke sur la fiche pro pour faire le pont.
--
-- Décisions identiques à venues.crm_id :
--   • Type TEXT
--   • Unicité STRICTE via index unique PARTIEL (NULL autorisés en multiple)
--   • Validation format faite côté UI uniquement
--
-- Articulation avec reservations.crm_id (migration 119) :
--   • Réservation AVEC compte (user_id renseigné) → l'ID CRM affiché
--     en lecture seule sera celui du profil lié (source de vérité unique).
--   • Réservation SANS compte (user_id NULL, guest_*) → l'ID CRM sera
--     stocké directement sur reservations.crm_id (pas de fiche pro centrale).
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crm_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_crm_id_unique
  ON public.profiles (crm_id)
  WHERE crm_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.crm_id
  IS 'Identifiant du professionnel dans le CRM Zoho du client (~17 chiffres). TEXT pour préserver le format. Unicité partielle : un ID ne peut être rattaché qu''à un seul profil. Source de vérité pour les réservations liées à un compte pro.';
