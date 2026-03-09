-- Migration 078: Ajout des paramètres de saison pour le dashboard
-- Derviche Diffusion
--
-- Ajoute deux clés dans app_settings :
--   season_start : date de début de saison (format YYYY-MM-DD)
--   season_end   : date de fin de saison (format YYYY-MM-DD)
--
-- Ces valeurs sont utilisées comme troisième option de période
-- dans le sélecteur du dashboard admin ("Saison").
-- Elles sont configurables depuis /admin/preferences (section Organisation).
--
-- Valeurs par défaut : saison culturelle standard septembre → juin.

INSERT INTO app_settings (key, value)
VALUES
  ('season_start', '"09-01"'),
  ('season_end',   '"06-30"')
ON CONFLICT (key) DO NOTHING;
