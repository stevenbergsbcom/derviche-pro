-- ============================================
-- Migration 100 : Rappel H-12 → H-4
-- Derviche Diffusion — Derviche Pro
--
-- Renomme le rappel automatique de 12h avant
-- à 4h avant la représentation.
-- ============================================

-- 1. Renommer le setting dans app_settings
UPDATE app_settings
SET key = 'reminder_enabled_4h',
    description = 'Envoyer un rappel automatique 4 heures avant la représentation'
WHERE key = 'reminder_enabled_12h';

-- 2. Renommer le template email
UPDATE email_templates
SET template_key = 'reminder_4h',
    name = 'Rappel H-4 (4 heures avant)'
WHERE template_key = 'reminder_12h';

-- 3. Renommer l'historique des envois (AVANT la contrainte CHECK)
UPDATE sent_notifications SET type = 'reminder_4h' WHERE type = 'reminder_12h';

-- 4. Mettre à jour la contrainte CHECK sur sent_notifications
ALTER TABLE sent_notifications DROP CONSTRAINT IF EXISTS sent_notifications_type_check;
ALTER TABLE sent_notifications
  ADD CONSTRAINT sent_notifications_type_check
  CHECK (type IN ('reminder_7d', 'reminder_2d', 'reminder_4h'));
