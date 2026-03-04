-- ============================================
-- Migration 059 - Ajout colonne dismissed à admin_notification_reads
-- Date: 2026-03-04
-- Objectif: Permettre à chaque admin de masquer individuellement
--           toutes les notifications (soft delete individuel).
--
-- Décision : réutiliser admin_notification_reads plutôt que créer
-- une 3ème table — dismissed=true = masquée pour cet admin uniquement.
-- Les autres admins continuent de voir la notification.
-- ============================================

ALTER TABLE public.admin_notification_reads
  ADD COLUMN IF NOT EXISTS dismissed BOOLEAN NOT NULL DEFAULT false;

-- Index pour filtrer rapidement les notifications non masquées
CREATE INDEX IF NOT EXISTS idx_admin_notification_reads_dismissed
  ON public.admin_notification_reads(user_id, dismissed)
  WHERE dismissed = true;
