-- ============================================
-- Migration 098 - Ajouter la catégorie 'show' à app_logs
-- Date: 2026-03-16
-- Session: S190 — Logs d'activité complets
--
-- Objectif: Permettre de tracer les actions sur les spectacles
-- (création, modification, suppression) dans le journal des événements.
-- ============================================

-- Supprimer l'ancienne contrainte CHECK et la recréer avec 'show'
ALTER TABLE public.app_logs
  DROP CONSTRAINT IF EXISTS app_logs_category_check;

ALTER TABLE public.app_logs
  ADD CONSTRAINT app_logs_category_check
  CHECK (category IN ('email', 'calendar', 'reservation', 'system', 'show'));

-- Mettre à jour le commentaire
COMMENT ON COLUMN public.app_logs.category IS
  'Domaine fonctionnel : email | calendar | reservation | system | show';
