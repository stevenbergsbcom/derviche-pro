-- ============================================
-- Migration 018: Table user_preferences
-- Derviche Diffusion
-- 
-- Stocke les préférences utilisateur (colonnes visibles, etc.)
-- ============================================

-- Créer la fonction update_updated_at si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un utilisateur ne peut avoir qu'une préférence par clé
  UNIQUE(user_id, preference_key)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "users_own_preferences_select" ON user_preferences;
DROP POLICY IF EXISTS "users_own_preferences_insert" ON user_preferences;
DROP POLICY IF EXISTS "users_own_preferences_update" ON user_preferences;
DROP POLICY IF EXISTS "users_own_preferences_delete" ON user_preferences;

-- Les utilisateurs peuvent voir leurs propres préférences
CREATE POLICY "users_own_preferences_select"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer leurs propres préférences
CREATE POLICY "users_own_preferences_insert"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent modifier leurs propres préférences
CREATE POLICY "users_own_preferences_update"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres préférences
CREATE POLICY "users_own_preferences_delete"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- Commentaires
-- ============================================
COMMENT ON TABLE user_preferences IS 'Préférences utilisateur (colonnes visibles, paramètres UI, etc.)';
COMMENT ON COLUMN user_preferences.preference_key IS 'Clé de la préférence (ex: admin_reservations_columns)';
COMMENT ON COLUMN user_preferences.preference_value IS 'Valeur JSON de la préférence';
