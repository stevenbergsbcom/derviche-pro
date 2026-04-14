-- ============================================
-- Migration 101 : Destinataire configurable pour les notifications email
-- Derviche Diffusion — Derviche Pro
--
-- Ajoute 2 nouveaux settings :
-- - email_notification_send_to_manager : envoyer au manager DD (true par défaut)
-- - email_notification_custom_recipient : adresse email personnalisée (vide par défaut)
-- ============================================

INSERT INTO app_settings (key, value, description)
VALUES (
  'email_notification_send_to_manager',
  'true'::jsonb,
  'Envoyer les notifications email au manager DD assigné au spectacle'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value, description)
VALUES (
  'email_notification_custom_recipient',
  '""'::jsonb,
  'Adresse email personnalisée pour recevoir les notifications de réservation'
)
ON CONFLICT (key) DO NOTHING;
