-- ============================================
-- Migration 072 - Table app_logs
-- Date: 2026-03-09
-- Objectif: Journal centralisé des événements système pour le super-admin.
--           Trace les envois d'emails, les opérations Google Calendar
--           et les erreurs système.
--
-- Décisions d'architecture :
--   - Rétention : 90 jours (purge automatique via GitHub Actions cron-daily)
--   - Lecture : super-admin uniquement
--   - Écriture : service_role uniquement (routes API Next.js côté serveur)
--   - Non-bloquant : une erreur d'insertion en log ne doit jamais
--     faire échouer l'opération métier (géré côté service TS)
-- ============================================

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE public.app_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Catégorie de l'événement
  category        TEXT        NOT NULL
    CHECK (category IN ('email', 'calendar', 'reservation', 'system')),

  -- Niveau de criticité
  level           TEXT        NOT NULL DEFAULT 'info'
    CHECK (level IN ('info', 'warning', 'error')),

  -- Action spécifique (ex: 'send_confirmation', 'calendar_create', 'reminder_j7')
  action          TEXT        NOT NULL,

  -- Résultat de l'opération
  status          TEXT        NOT NULL
    CHECK (status IN ('success', 'error')),

  -- Qui a déclenché l'action (null = cron/système)
  actor_id        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role      TEXT,

  -- Réservation concernée (null = action globale)
  reservation_id  UUID        REFERENCES public.reservations(id) ON DELETE SET NULL,

  -- Données additionnelles structurées :
  -- email: { to, resend_id, template_key, error_message }
  -- calendar: { event_id, reservation_id, error_message }
  -- system: { message, context }
  details         JSONB       DEFAULT '{}'::jsonb,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================

-- Tri chronologique inversé (affichage tableau logs)
CREATE INDEX idx_app_logs_created_at
  ON public.app_logs(created_at DESC);

-- Filtrage par catégorie
CREATE INDEX idx_app_logs_category
  ON public.app_logs(category);

-- Filtrage par niveau / statut
CREATE INDEX idx_app_logs_level_status
  ON public.app_logs(level, status);

-- Filtrage par réservation
CREATE INDEX idx_app_logs_reservation_id
  ON public.app_logs(reservation_id)
  WHERE reservation_id IS NOT NULL;

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- SELECT : super-admin uniquement
CREATE POLICY "app_logs_select_super_admin"
  ON public.app_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- INSERT / UPDATE / DELETE : service_role uniquement
-- (pas de policy → seul le service_role peut écrire, via les routes API)

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.app_logs IS
  'Journal des événements système (emails, calendar, erreurs). Lecture super-admin uniquement. Rétention 90 jours.';

COMMENT ON COLUMN public.app_logs.category IS
  'Domaine fonctionnel : email | calendar | reservation | system';

COMMENT ON COLUMN public.app_logs.level IS
  'Criticité : info (succès normal) | warning (dégradé) | error (échec)';

COMMENT ON COLUMN public.app_logs.action IS
  'Action précise : send_confirmation, calendar_create, reminder_j7, etc.';

COMMENT ON COLUMN public.app_logs.details IS
  'JSONB libre : to, resend_id, template_key, event_id, error_message, context…';
