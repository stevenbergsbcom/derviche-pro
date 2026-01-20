-- ============================================
-- Migration 020: Ajouter champ source aux réservations
-- Derviche Diffusion
-- 
-- Objectif: Tracker l'origine des réservations ('public' ou 'admin')
-- ============================================

-- 1. Créer le type ENUM pour la source
DO $$ BEGIN
  CREATE TYPE reservation_source AS ENUM ('public', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ajouter la colonne source avec valeur par défaut 'public'
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS source reservation_source NOT NULL DEFAULT 'public';

-- 3. Ajouter la colonne created_by_user_id pour savoir quel admin a créé la réservation
-- NULL pour les réservations publiques, rempli pour les réservations admin
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Ajouter un index pour les requêtes filtrées par source
CREATE INDEX IF NOT EXISTS idx_reservations_source ON reservations(source);

-- 5. Commentaires pour documentation
COMMENT ON COLUMN reservations.source IS 'Origine de la réservation: public (site web) ou admin (back-office)';
COMMENT ON COLUMN reservations.created_by_user_id IS 'ID de l''admin qui a créé la réservation (NULL si créée depuis le site public)';
