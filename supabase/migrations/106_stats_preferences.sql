-- ============================================
-- Migration 106 : Préférences statistiques admin
-- Derviche Diffusion — Derviche Pro
--
-- Ajoute 6 setting keys dans app_settings avec défauts.
-- Idempotent via ON CONFLICT DO NOTHING.
-- ============================================

INSERT INTO app_settings (key, value, description) VALUES
  ('stats_default_period', '"month_current"'::jsonb, 'Période affichée par défaut sur /admin/statistiques'),
  ('stats_default_page_size', '20'::jsonb, 'Nombre de lignes par page dans les tableaux stats (10-100)'),
  ('stats_default_compare_preset', '"year_before"'::jsonb, 'Preset de comparaison sélectionné par défaut'),
  ('stats_hidden_columns_shows', '[]'::jsonb, 'Colonnes masquées du tableau "Par spectacle"'),
  ('stats_hidden_columns_venues', '[]'::jsonb, 'Colonnes masquées du tableau "Par lieu"'),
  ('stats_default_export_format', '"excel"'::jsonb, 'Format d''export pré-sélectionné')
ON CONFLICT (key) DO NOTHING;
