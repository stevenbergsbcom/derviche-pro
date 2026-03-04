-- ============================================
-- Migration 058 - Table admin_notification_reads
-- Date: 2026-03-04
-- Objectif: Permettre un marquage lu/non-lu individuel par admin.
--           Chaque ligne représente "l'admin X a lu la notif Y".
--           Absence de ligne = non lu pour cet admin.
--
-- Décisions d'architecture :
--   - PK composite (notification_id, user_id) : garantit l'unicité
--   - ON DELETE CASCADE : si la notif ou l'utilisateur est supprimé,
--     la ligne de lecture disparaît automatiquement
--   - RLS stricte : chaque admin ne voit et ne gère que ses propres
--     lignes de lecture (user_id = auth.uid())
-- ============================================

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE public.admin_notification_reads (
  notification_id UUID        NOT NULL
    REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

-- ============================================
-- INDEX
-- ============================================

-- Lecture rapide de toutes les notifs lues par un utilisateur donné
CREATE INDEX idx_admin_notification_reads_user_id
  ON public.admin_notification_reads(user_id);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

-- SELECT : chaque admin voit uniquement ses propres lignes
CREATE POLICY "admin_notification_reads_select_own"
  ON public.admin_notification_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin_or_super());

-- INSERT : chaque admin peut marquer une notif comme lue pour lui-même
CREATE POLICY "admin_notification_reads_insert_own"
  ON public.admin_notification_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_admin_or_super());

-- DELETE : chaque admin peut dé-marquer (optionnel, pour "marquer non lu")
CREATE POLICY "admin_notification_reads_delete_own"
  ON public.admin_notification_reads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin_or_super());
