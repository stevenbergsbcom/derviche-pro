-- Migration 089 : Ajout des paramètres de suivi santé Google Calendar
-- Derviche Diffusion
--
-- 2 nouvelles clés dans app_settings :
--   google_calendar_token_status      : 'valid' | 'invalid' | 'unknown'
--   google_calendar_last_health_check : ISO timestamp ou 'never'
--
-- Utilisées par le cron quotidien et le widget /admin/systeme
-- pour monitorer la validité du refresh_token Google OAuth2.

INSERT INTO app_settings (key, value) VALUES
  ('google_calendar_token_status',      '"unknown"'),
  ('google_calendar_last_health_check', '"never"')
ON CONFLICT (key) DO NOTHING;
