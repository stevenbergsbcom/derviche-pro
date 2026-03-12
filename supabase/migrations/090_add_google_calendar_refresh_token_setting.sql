-- Migration 090 : Stockage du refresh_token Google Calendar en DB
-- Derviche Diffusion
--
-- Permet de renouveler le token via /api/auth/google/authorize
-- sans devoir mettre à jour manuellement les variables d'environnement.
--
-- getGoogleAuthClient() lit d'abord cette clé, puis fallback sur env var.
-- Sécurité : seuls admin/super-admin peuvent lire app_settings (RLS existante).

INSERT INTO app_settings (key, value) VALUES
  ('google_calendar_refresh_token', '"none"')
ON CONFLICT (key) DO NOTHING;
