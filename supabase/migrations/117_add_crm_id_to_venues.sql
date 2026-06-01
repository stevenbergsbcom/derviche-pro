-- ============================================
-- Migration 117 : Ajout ID CRM (Zoho) sur les lieux
-- Derviche Diffusion — S174
-- ============================================
-- Le client travaille avec un CRM Zoho dans lequel chaque lieu possède
-- un identifiant unique (~17 chiffres). On stocke cet identifiant sur
-- la fiche venue pour faire le pont avec leur CRM.
--
-- Décisions verrouillées (cf. docs/CONCEPTION_CRM_IDS.md) :
--   • Type TEXT (jamais BIGINT/INTEGER) : préserve les zéros en tête,
--     évite la notation scientifique, absorbe un futur changement de format.
--   • Unicité STRICTE via index unique PARTIEL — plusieurs lieux peuvent
--     rester sans ID CRM (NULL autorisé en multiple), mais un même ID
--     ne peut pas être rattaché à deux lieux différents.
--   • Validation format faite côté UI (souple, numérique uniquement,
--     avertissement non bloquant) — la BDD ne contraint pas la longueur
--     pour rester tolérante.
-- ============================================

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS crm_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS venues_crm_id_unique
  ON public.venues (crm_id)
  WHERE crm_id IS NOT NULL;

COMMENT ON COLUMN public.venues.crm_id
  IS 'Identifiant du lieu dans le CRM Zoho du client (~17 chiffres). TEXT pour préserver le format. Unicité partielle : un ID ne peut être rattaché qu''à un seul lieu, mais plusieurs lieux peuvent rester sans ID.';
