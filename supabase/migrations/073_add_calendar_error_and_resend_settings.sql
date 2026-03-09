-- ============================================
-- Migration 073 - calendar_error + app_settings Resend
-- Date: 2026-03-09
-- Objectif:
--   1. Ajouter le type 'calendar_error' dans la contrainte CHECK de
--      admin_notifications (pour notifier le super-admin des échecs Calendar)
--   2. Ajouter 2 clés app_settings pour gérer le plan Resend et son quota
--
-- Décisions d'architecture :
--   - PostgreSQL ne supporte pas ALTER CONSTRAINT → on drop + recreate la check
--   - resend_plan : 'free' | 'pro' — géré manuellement par le super-admin
--   - resend_monthly_quota : nombre d'emails max sur le mois en cours
--     (3000 pour free, valeur libre pour pro)
-- ============================================

-- ============================================
-- 1. ADMIN_NOTIFICATIONS — Ajout type 'calendar_error'
-- ============================================

-- PostgreSQL ne supporte pas ALTER CONSTRAINT directement.
-- On supprime l'ancienne contrainte et on en crée une nouvelle.
ALTER TABLE public.admin_notifications
  DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications
  ADD CONSTRAINT admin_notifications_type_check
    CHECK (type IN (
      'new_reservation',
      'cancellation',
      'modification',
      'calendar_error'   -- Nouveau : erreur Google Calendar non-bloquante
    ));

-- ============================================
-- 2. APP_SETTINGS — Plan et quota Resend
-- ============================================

-- Plan actuel Resend ('free' ou 'pro')
INSERT INTO public.app_settings (key, value)
VALUES ('resend_plan', '"free"')
ON CONFLICT (key) DO NOTHING;

-- Quota mensuel max selon le plan
-- Free  : 3000 emails/mois
-- Pro   : défini manuellement par le super-admin
INSERT INTO public.app_settings (key, value)
VALUES ('resend_monthly_quota', '3000')
ON CONFLICT (key) DO NOTHING;
