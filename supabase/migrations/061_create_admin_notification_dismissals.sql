-- ============================================
-- Migration 061 - Table admin_notification_dismissals
-- Date: 2026-03-04
-- Objectif: Remplacer l'approche dismissed par colonne (migrations 059/060)
--           par une approche timestamp par utilisateur.
--
-- Logique : une ligne par admin avec dismissed_at = "j'ai vidé à cet instant"
-- On affiche uniquement les notifications créées APRÈS dismissed_at.
-- Les notifications antérieures sont invisibles pour cet admin.
-- Les autres admins ne sont pas affectés.
--
-- Avantages vs approche colonne dismissed :
--   - Pas d'upsert batch sur toutes les notifs
--   - Pas de policy UPDATE nécessaire
--   - Une seule ligne par admin (pas N lignes)
--   - Filtre simple : created_at > dismissed_at
-- ============================================

CREATE TABLE public.admin_notification_dismissals (
  user_id      UUID        NOT NULL PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.admin_notification_dismissals ENABLE ROW LEVEL SECURITY;

-- SELECT : chaque admin voit uniquement sa propre ligne
CREATE POLICY "admin_notification_dismissals_select_own"
  ON public.admin_notification_dismissals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin_or_super());

-- INSERT : chaque admin peut créer sa ligne de dismissal
CREATE POLICY "admin_notification_dismissals_insert_own"
  ON public.admin_notification_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_admin_or_super());

-- UPDATE : chaque admin peut mettre à jour son dismissed_at
CREATE POLICY "admin_notification_dismissals_update_own"
  ON public.admin_notification_dismissals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin_or_super())
  WITH CHECK (user_id = auth.uid() AND public.is_admin_or_super());

-- DELETE : chaque admin peut supprimer sa ligne (reset)
CREATE POLICY "admin_notification_dismissals_delete_own"
  ON public.admin_notification_dismissals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_admin_or_super());
