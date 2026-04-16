-- ============================================
-- Migration 102 : Fix RLS externe — filtrage niveau slot (au lieu de show)
-- Derviche Diffusion — Derviche Pro
--
-- Bug : la policy reservations_select_externe (migration 039) utilisait
-- externe_has_access_to_show(show_id) qui retourne true dès qu'un externe
-- est assigné à au moins un slot du spectacle. Conséquence : l'externe
-- voyait TOUTES les réservations du spectacle, pas seulement celles de
-- ses représentations.
--
-- Fix : filtrer directement au niveau slot via slots.hosted_by_id = auth.uid()
-- ============================================

DROP POLICY IF EXISTS reservations_select_externe ON reservations;
DROP POLICY IF EXISTS reservations_update_externe ON reservations;
DROP POLICY IF EXISTS reservations_delete_externe ON reservations;

CREATE POLICY reservations_select_externe ON reservations
  FOR SELECT
  USING (
    has_role('externe') AND EXISTS (
      SELECT 1 FROM slots
      WHERE slots.id = reservations.slot_id
      AND slots.hosted_by_id = auth.uid()
    )
  );

CREATE POLICY reservations_update_externe ON reservations
  FOR UPDATE
  USING (
    has_role('externe') AND EXISTS (
      SELECT 1 FROM slots
      WHERE slots.id = reservations.slot_id
      AND slots.hosted_by_id = auth.uid()
    )
  );

CREATE POLICY reservations_delete_externe ON reservations
  FOR DELETE
  USING (
    has_role('externe') AND EXISTS (
      SELECT 1 FROM slots
      WHERE slots.id = reservations.slot_id
      AND slots.hosted_by_id = auth.uid()
    )
  );
