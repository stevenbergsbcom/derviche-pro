-- ============================================
-- Migration 049 - Paramètres notifications email et URL catalogue
-- Date: 2026-03-02
-- Objectif: Ajouter les clés de préférences de notifications email
--           (config globale modifiable par super-admin uniquement)
--           et l'URL du catalogue public (à mettre à jour lors du custom domaine)
--
-- ⚠️  NOTE IMPORTANTE :
--   email_catalogue_url pointe actuellement vers derviche-pro.vercel.app
--   À mettre à jour lors de la configuration du custom domaine derviche-pro.fr
-- ============================================

INSERT INTO app_settings (key, value, description)
VALUES
  (
    'email_catalogue_url',
    '"https://derviche-pro.vercel.app/catalogue"',
    'URL du catalogue public dans les emails (⚠️ À mettre à jour lors du custom domaine)'
  ),
  (
    'email_notification_new_reservation',
    'true'::jsonb,
    'Notifier le manager DD par email lors d''une nouvelle réservation'
  ),
  (
    'email_notification_cancellation',
    'true'::jsonb,
    'Notifier le manager DD par email lors d''une annulation de réservation'
  ),
  (
    'email_notification_modification',
    'false'::jsonb,
    'Notifier le manager DD par email lors d''une modification de réservation'
  )
ON CONFLICT (key) DO NOTHING;
