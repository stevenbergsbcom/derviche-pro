-- ============================================
-- Migration 060 - Ajout policy UPDATE sur admin_notification_reads
-- Date: 2026-03-04
-- Objectif: Permettre la mise à jour de la colonne dismissed.
--
-- Contexte : La migration 058 avait défini SELECT/INSERT/DELETE
-- mais pas UPDATE. Le upsert de dismissAll() (ignored_duplicates=false)
-- tente un UPDATE sur les lignes existantes → bloqué silencieusement
-- par RLS → dismissed reste false → les notifications réapparaissent.
-- ============================================

CREATE POLICY "admin_notification_reads_update_own"
  ON public.admin_notification_reads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin_or_super())
  WITH CHECK (user_id = auth.uid() AND public.is_admin_or_super());
