-- Migration 080: Ajouter slot_date et slot_time sur reservations pour tri direct
-- Contexte : .order({ referencedTable: 'slots' }) en Supabase JS ne trie PAS la table parente.
--            On dénormalise la date/heure du slot pour permettre un tri serveur correct.
-- Derviche Pro - S162

-- ============================================
-- 1. COLONNES
-- ============================================

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS slot_date date,
  ADD COLUMN IF NOT EXISTS slot_time time;

-- ============================================
-- 2. BACKFILL (données existantes)
-- ============================================

UPDATE reservations r
SET
  slot_date = s.date,
  slot_time = s.time
FROM slots s
WHERE s.id = r.slot_id;

-- ============================================
-- 3. TRIGGER : maintenir slot_date/slot_time en sync
-- ============================================

CREATE OR REPLACE FUNCTION sync_reservation_slot_datetime()
RETURNS TRIGGER AS $$
BEGIN
  SELECT date, time
  INTO NEW.slot_date, NEW.slot_time
  FROM slots
  WHERE id = NEW.slot_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclenché à chaque INSERT ou UPDATE du slot_id
DROP TRIGGER IF EXISTS reservation_sync_slot_datetime ON reservations;

CREATE TRIGGER reservation_sync_slot_datetime
BEFORE INSERT OR UPDATE OF slot_id ON reservations
FOR EACH ROW
EXECUTE FUNCTION sync_reservation_slot_datetime();

-- ============================================
-- 4. INDEX pour les tris courants
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reservations_slot_date_asc
  ON reservations (slot_date ASC, slot_time ASC);

CREATE INDEX IF NOT EXISTS idx_reservations_slot_date_desc
  ON reservations (slot_date DESC, slot_time DESC);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON COLUMN reservations.slot_date IS
  'Dénormalisé depuis slots.date — maintenu par trigger reservation_sync_slot_datetime';

COMMENT ON COLUMN reservations.slot_time IS
  'Dénormalisé depuis slots.time — maintenu par trigger reservation_sync_slot_datetime';
