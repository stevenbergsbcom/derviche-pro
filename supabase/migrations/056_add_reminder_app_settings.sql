-- ============================================
-- Migration 056 - Clés app_settings pour les rappels automatiques
-- Date: 2026-03-04
-- Objectif: Insérer les 3 toggles de rappels dans app_settings.
--
-- Ces clés étaient définies dans le TypeScript (app-settings.ts)
-- mais n'avaient jamais été insérées en base.
-- Sans cette migration, la section Rappels dans /admin/preferences
-- retournait toujours les valeurs fallback (true) sans lire la DB.
--
-- Clés ajoutées :
--   reminder_enabled_7d  → activer/désactiver le rappel J-7
--   reminder_enabled_2d  → activer/désactiver le rappel J-2
--   reminder_enabled_12h → activer/désactiver le rappel H-12
--
-- Toutes initialisées à true (comportement par défaut).
-- L'admin peut les modifier via /admin/preferences?tab=reminders
-- ============================================

INSERT INTO app_settings (key, value, description)
VALUES
  (
    'reminder_enabled_7d',
    'true'::jsonb,
    'Envoyer un rappel automatique 7 jours avant la représentation'
  ),
  (
    'reminder_enabled_2d',
    'true'::jsonb,
    'Envoyer un rappel automatique 2 jours avant la représentation'
  ),
  (
    'reminder_enabled_12h',
    'true'::jsonb,
    'Envoyer un rappel automatique 12 heures avant la représentation'
  )
ON CONFLICT (key) DO NOTHING;
