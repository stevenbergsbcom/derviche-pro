-- Migration 062 : Ajout des paramètres Google Calendar dans app_settings
-- Derviche Diffusion
--
-- 3 nouvelles clés :
--   google_calendar_enabled              : active/désactive l'intégration Calendar
--   google_calendar_notify_on_cancellation : envoyer un email Google à l'annulation
--   google_calendar_notify_on_modification : envoyer un email Google à la modification
--
-- Note : la création envoie TOUJOURS un email (non configurable).

INSERT INTO app_settings (key, value) VALUES
  ('google_calendar_enabled',               'false'),
  ('google_calendar_notify_on_cancellation', 'false'),
  ('google_calendar_notify_on_modification', 'false')
ON CONFLICT (key) DO NOTHING;
