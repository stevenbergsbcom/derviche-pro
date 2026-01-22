-- ============================================
-- Migration 031: Add 'externe' to hosted_by enum
-- Derviche Diffusion - Module Accueil (Check-in)
-- Date: 2026-01-22
-- ============================================
-- 
-- Contexte:
-- Le champ hosted_by indique qui gère l'accueil d'une représentation :
-- - 'derviche' : un membre Derviche (admin/super-admin) gère l'accueil
-- - 'company' : la compagnie du spectacle gère l'accueil
-- - 'externe' (NOUVEAU) : un externe-dd assigné gère l'accueil
--
-- Le champ hosted_by_id pointe vers le user spécifique qui gère l'accueil
-- (obligatoirement NULL si hosted_by = 'company', car on utilise show.company_id)
-- ============================================

-- 1. Supprimer l'ancienne contrainte CHECK sur hosted_by
ALTER TABLE public.slots 
  DROP CONSTRAINT IF EXISTS slots_hosted_by_check;

-- 2. Ajouter la nouvelle contrainte avec 'externe'
ALTER TABLE public.slots
  ADD CONSTRAINT slots_hosted_by_check 
  CHECK (hosted_by IN ('derviche', 'company', 'externe'));

-- 3. Supprimer l'ancienne contrainte de cohérence hosted_by_id
ALTER TABLE public.slots 
  DROP CONSTRAINT IF EXISTS chk_hosted_by_id_consistency;

-- 4. Ajouter la nouvelle contrainte de cohérence
-- - Si hosted_by = 'company' : hosted_by_id DOIT être NULL (on utilise show.company_id)
-- - Si hosted_by = 'derviche' ou 'externe' : hosted_by_id PEUT être défini
ALTER TABLE public.slots
  ADD CONSTRAINT chk_hosted_by_id_consistency
  CHECK (
    (hosted_by = 'company' AND hosted_by_id IS NULL) OR
    (hosted_by IN ('derviche', 'externe'))
  );

-- 5. Mettre à jour le commentaire de la colonne
COMMENT ON COLUMN public.slots.hosted_by IS 'Qui gère l''accueil: derviche = membre Derviche (admin/super-admin), company = la compagnie du spectacle, externe = un externe-dd assigné';

COMMENT ON COLUMN public.slots.hosted_by_id IS 'UUID du user gérant l''accueil. NULL si hosted_by = company (utilise show.company_id). Optionnel pour derviche/externe.';
