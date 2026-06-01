-- ============================================
-- Migration 119 : Ajout ID CRM (Zoho) sur les réservations sans compte
-- Derviche Diffusion — S174
-- ============================================
-- Pour les réservations guest (sans compte, user_id IS NULL), on doit
-- pouvoir saisir l'ID CRM du professionnel directement sur la réservation,
-- puisqu'il n'existe pas de fiche pro centrale (profiles) pour porter
-- l'information.
--
-- Décisions verrouillées (cf. docs/CONCEPTION_CRM_IDS.md) :
--   • Type TEXT (cohérent avec venues / profiles).
--   • AUCUNE contrainte d'unicité : un même pro sans compte peut
--     légitimement réserver plusieurs spectacles → le même crm_id se
--     répétera sur N lignes de reservations. C'est attendu, pas un bug.
--   • Validation format côté UI (souple, numérique uniquement).
--
-- Comportement S174/S175 :
--   • S174 : champ éditable dans l'admin pour les résas guest uniquement
--     (user_id IS NULL).
--   • S175 : pour les résas avec compte, on affichera profiles.crm_id en
--     lecture seule via jointure — la colonne reservations.crm_id restera
--     vide dans ce cas (pas de duplication, source de vérité unique).
-- ============================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS crm_id TEXT;

COMMENT ON COLUMN public.reservations.crm_id
  IS 'Identifiant CRM Zoho du professionnel pour les réservations guest (user_id IS NULL). Pas de contrainte d''unicité : un même pro sans compte peut réserver plusieurs spectacles. Pour les résas avec compte, lire profiles.crm_id via jointure (source de vérité unique).';
