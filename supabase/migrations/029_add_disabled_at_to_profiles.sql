-- Migration 029: Ajouter colonne disabled_at à profiles
-- Derviche Diffusion - Session 61
-- 
-- Cette colonne permet de désactiver temporairement un compte utilisateur
-- sans le supprimer (soft disable). NULL = actif, date = désactivé.
-- Différent de deleted_at qui est pour la suppression définitive.

-- ============================================
-- AJOUT DE LA COLONNE
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- INDEX POUR PERFORMANCES
-- ============================================

-- Index partiel pour trouver rapidement les comptes désactivés
CREATE INDEX IF NOT EXISTS idx_profiles_disabled_at
ON profiles (disabled_at)
WHERE disabled_at IS NOT NULL;

-- ============================================
-- COMMENTAIRE
-- ============================================

COMMENT ON COLUMN profiles.disabled_at IS 'Date de désactivation du compte. NULL = actif, date = désactivé temporairement.';
