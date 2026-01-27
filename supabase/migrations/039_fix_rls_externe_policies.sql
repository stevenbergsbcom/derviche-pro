-- Migration 039: Fix RLS policies externe-dd → externe
-- Le rôle 'externe-dd' a été renommé en 'externe' (migration 038)
-- Les policies RLS utilisaient encore l'ancien nom

-- ============================================
-- RESERVATIONS
-- ============================================

-- 1. DROP les anciennes policies avec l'ancien nom
DROP POLICY IF EXISTS reservations_select_externe_dd ON reservations;
DROP POLICY IF EXISTS reservations_update_externe_dd ON reservations;
DROP POLICY IF EXISTS reservations_delete_externe_dd ON reservations;

-- 2. Recréer avec le bon nom de rôle 'externe'
CREATE POLICY reservations_select_externe ON reservations
  FOR SELECT
  USING (
    has_role('externe') AND EXISTS (
      SELECT 1 FROM slots
      WHERE slots.id = reservations.slot_id
      AND externe_has_access_to_show(slots.show_id)
    )
  );

CREATE POLICY reservations_update_externe ON reservations
  FOR UPDATE
  USING (
    has_role('externe') AND EXISTS (
      SELECT 1 FROM slots
      WHERE slots.id = reservations.slot_id
      AND externe_has_access_to_show(slots.show_id)
    )
  );

CREATE POLICY reservations_delete_externe ON reservations
  FOR DELETE
  USING (
    has_role('externe') AND EXISTS (
      SELECT 1 FROM slots
      WHERE slots.id = reservations.slot_id
      AND externe_has_access_to_show(slots.show_id)
    )
  );
