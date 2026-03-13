-- Migration 093: Ajout des toggles pour le footer email
-- Permet de choisir quelles informations de contact afficher dans la 2e ligne du footer

INSERT INTO app_settings (key, value) VALUES
  ('email_footer_show_email',   'true'::jsonb),
  ('email_footer_show_phone',   'true'::jsonb),
  ('email_footer_show_address', 'true'::jsonb),
  ('email_footer_show_website', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
