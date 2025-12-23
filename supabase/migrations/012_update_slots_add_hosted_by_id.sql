-- ============================================
-- Migration 012: Update slots - Add hosted_by_id
-- Derviche Diffusion - CDC V4
-- Date: 2025-12-23
-- ============================================

-- Ajout du champ hosted_by_id pour identifier qui assure l'accueil
ALTER TABLE public.slots
  ADD COLUMN IF NOT EXISTS hosted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index pour le filtrage par personne d'accueil
CREATE INDEX IF NOT EXISTS idx_slots_hosted_by_id ON public.slots(hosted_by_id);

-- Contrainte : hosted_by_id doit être NULL si hosted_by = 'company'
-- Note: On utilise une contrainte CHECK pour garantir la cohérence des données
-- Si hosted_by = 'company', la compagnie est retrouvée via slot → show → company_id
ALTER TABLE public.slots
  ADD CONSTRAINT chk_hosted_by_id_consistency
  CHECK (
    (hosted_by = 'company' AND hosted_by_id IS NULL) OR
    (hosted_by = 'derviche')
  );

-- Commentaire sur la colonne
COMMENT ON COLUMN public.slots.hosted_by_id IS 'Membre Derviche assurant l''accueil (uniquement si hosted_by = derviche). Si hosted_by = company, ce champ doit être NULL.';
