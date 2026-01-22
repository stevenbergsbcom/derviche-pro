-- ============================================
-- Migration 030: Autoriser la dissociation d'un utilisateur compagnie
-- Derviche Diffusion - Plateforme de réservation
-- Date: 2026-01-22
-- ============================================
-- OBJECTIF: Permettre de retirer le company_id d'un utilisateur avec rôle 'company'
--   - L'utilisateur garde son rôle 'company'
--   - L'utilisateur peut toujours se connecter
--   - Sans company_id, il voit un tableau de bord vide (aucun spectacle/réservation)
--   - Permet de "dissocier" un utilisateur sans supprimer son compte
-- ============================================

-- ============================================
-- SUPPRESSION DU TRIGGER QUI BLOQUAIT LA DISSOCIATION
-- ============================================

-- Supprimer le trigger qui empêchait de retirer company_id
DROP TRIGGER IF EXISTS trg_prevent_company_id_removal ON public.profiles;

-- Supprimer la fonction associée (plus nécessaire)
DROP FUNCTION IF EXISTS public.prevent_company_id_removal();

-- ============================================
-- NOTE: Le trigger sur user_roles reste en place
-- ============================================
-- trg_check_company_role_has_company_id vérifie qu'on ne peut pas 
-- ATTRIBUER le rôle 'company' à un utilisateur sans company_id.
-- C'est toujours valide : on ne peut pas créer un utilisateur compagnie
-- sans l'associer à une compagnie.
-- 
-- Par contre, on autorise maintenant la DISSOCIATION après coup.
-- ============================================

-- ============================================
-- Documentation
-- ============================================

COMMENT ON TRIGGER trg_check_company_role_has_company_id ON public.user_roles IS 
  'Vérifie que le profil a un company_id AVANT d''attribuer le rôle company. La dissociation après coup est autorisée.';
