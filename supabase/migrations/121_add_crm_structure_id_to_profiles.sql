-- ============================================
-- Migration 121 : Ajout profiles.crm_structure_id
-- Derviche Diffusion — structure CRM du professionnel
-- ============================================
-- Second identifiant Zoho porté par le pro : l'ID de la STRUCTURE pour
-- laquelle il travaille (distinct de crm_id qui identifie le contact).
--   • Type TEXT (cohérent avec crm_id).
--   • AUCUNE contrainte d'unicité : plusieurs professionnels peuvent
--     dépendre de la même structure → le même ID se répétera. Attendu.
--   • Validation format côté UI uniquement (souple, numérique).
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crm_structure_id TEXT;

COMMENT ON COLUMN public.profiles.crm_structure_id
  IS 'Identifiant de la structure du professionnel dans le CRM Zoho (~17 chiffres). TEXT, pas d''unicité (plusieurs pros peuvent partager une structure). Source de vérité pour les réservations liées à un compte.';
