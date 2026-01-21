-- ============================================
-- Migration 028: Contrainte company_id obligatoire pour rôle company
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-21
-- ============================================
-- SÉCURITÉ: Cette migration garantit l'intégrité des données :
--   - Un utilisateur avec rôle 'company' DOIT avoir un company_id
--   - Empêche la création d'un compte compagnie orphelin
--   - Empêche la suppression du company_id d'un utilisateur compagnie
-- ============================================

-- ============================================
-- FONCTION: Vérifier company_id lors de l'attribution du rôle company
-- ============================================

CREATE OR REPLACE FUNCTION public.check_company_role_has_company_id()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Ne vérifier que pour le rôle 'company'
  IF NEW.role = 'company' THEN
    -- Récupérer le company_id du profil
    SELECT company_id INTO v_company_id
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Vérifier que company_id est renseigné
    IF v_company_id IS NULL THEN
      RAISE EXCEPTION 'Un utilisateur avec le rôle "company" doit avoir un company_id renseigné dans son profil'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_company_role_has_company_id() IS 
  'Vérifie qu''un utilisateur avec rôle company a bien un company_id';

-- ============================================
-- TRIGGER: Sur user_roles (INSERT/UPDATE)
-- ============================================

DROP TRIGGER IF EXISTS trg_check_company_role_has_company_id ON public.user_roles;

CREATE TRIGGER trg_check_company_role_has_company_id
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_company_role_has_company_id();

-- ============================================
-- FONCTION: Empêcher la suppression de company_id pour un utilisateur compagnie
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_company_id_removal()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Si company_id passe de non-NULL à NULL
  IF OLD.company_id IS NOT NULL AND NEW.company_id IS NULL THEN
    -- Vérifier si l'utilisateur a le rôle 'company'
    SELECT role INTO v_role
    FROM public.user_roles
    WHERE user_id = NEW.id;
    
    IF v_role = 'company' THEN
      RAISE EXCEPTION 'Impossible de supprimer le company_id d''un utilisateur avec le rôle "company"'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.prevent_company_id_removal() IS 
  'Empêche la suppression du company_id pour un utilisateur ayant le rôle company';

-- ============================================
-- TRIGGER: Sur profiles (UPDATE)
-- ============================================

DROP TRIGGER IF EXISTS trg_prevent_company_id_removal ON public.profiles;

CREATE TRIGGER trg_prevent_company_id_removal
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_company_id_removal();

-- ============================================
-- Vérification des données existantes (audit)
-- ============================================

-- Cette requête identifie les utilisateurs avec rôle 'company' sans company_id
-- À exécuter manuellement si nécessaire pour corriger les données existantes
-- SELECT p.id, p.email, p.first_name, p.last_name, ur.role
-- FROM public.profiles p
-- JOIN public.user_roles ur ON ur.user_id = p.id
-- WHERE ur.role = 'company' AND p.company_id IS NULL;

-- ============================================
-- Documentation
-- ============================================

COMMENT ON TRIGGER trg_check_company_role_has_company_id ON public.user_roles IS 
  'Vérifie que le profil a un company_id avant d''attribuer le rôle company';

COMMENT ON TRIGGER trg_prevent_company_id_removal ON public.profiles IS 
  'Empêche de retirer le company_id d''un utilisateur ayant le rôle company';
